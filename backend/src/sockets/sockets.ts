import { Server } from "socket.io"
import {
  JoinLibrary,
  Disconnect,
  OnEventCallback,
  MovePlayer,
  Teleport,
  ChangedSkin,
  NewMessage,
} from "./socket-types"
import { z } from "zod"
import { users } from "../Users"
import { sessionManager } from "../session"
import { removeExtraSpaces } from "../utils"
import { kickPlayer } from "./helpers"
import { formatEmailToName } from "../utils"
import { verifyBearerToken } from "../auth"
import { query } from "../db"

const joiningInProgress = new Set<string>()

function protectConnection(io: Server) {
    io.use(async (socket, next) => {
        const access_token = socket.handshake.headers['authorization']?.split(' ')[1]
        const uid = socket.handshake.query.uid as string
        if (!access_token || !uid) {
            const error = new Error("Invalid access token or uid.")
            return next(error)
        } else {
            try {
                const verified = await verifyBearerToken(access_token)
                if (verified.id !== uid) {
                    return next(new Error("Invalid uid."))
                }
                users.addUser(uid, { id: verified.id, email: verified.email ?? undefined })
                next()
            } catch {
                return next(new Error("Invalid access token."))
            }
        }
    })
}


export function sockets(io: Server) {
    protectConnection(io)

    // Handle a connection
    io.on('connection', (socket) => {

        function on(eventName: string, schema: z.ZodTypeAny, callback: OnEventCallback) {
            socket.on(eventName, (data: any) => {
                const success = schema.safeParse(data).success
                if (!success) return

                const session = sessionManager.getPlayerSession(socket.handshake.query.uid as string)
                if (!session) {
                    return
                }
                callback({ session, data })
            })
        }

        function emit(eventName: string, data: any) {
            const session = sessionManager.getPlayerSession(socket.handshake.query.uid as string)
            if (!session) {
                return
            }

            const room = session.getPlayerRoom(socket.handshake.query.uid as string)
            const players = session.getPlayersInRoom(room)

            for (const player of players) {
                if (player.socketId === socket.id) continue

                io.to(player.socketId).emit(eventName, data)
            }
        }

        function emitToSocketIds(socketIds: string[], eventName: string, data: any) {
            for (const socketId of socketIds) {
                io.to(socketId).emit(eventName, data)
            }
        }

        socket.on('joinLibrary', async (joinData: z.infer<typeof JoinLibrary>) => {
            const uid = socket.handshake.query.uid as string
            const rejectJoin = (reason: string) => {
                socket.emit('failedToJoinRoom', reason)
                joiningInProgress.delete(uid)
            }

            if (JoinLibrary.safeParse(joinData).success === false) {
                return rejectJoin('Invalid request data.')
            }

            if (joiningInProgress.has(uid)) {
                rejectJoin('Already joining a library.')
            }
            joiningInProgress.add(uid)

            const session = sessionManager.getSession(joinData.libraryId)
            if (session) {
                const playerCount = session.getPlayerCount()
                if (playerCount >= 30) {
                    return rejectJoin("Library is full. It's 30 players max.")
                } 
            }

            const { rows: libraryRows } = await query<{
              owner_id: string
              share_id: string | null
              map_data: any
              only_owner: boolean | null
            }>(
              `select owner_id, share_id, map_data, only_owner
               from libraries
               where id = $1
               limit 1`,
              [joinData.libraryId],
            )

            const library = libraryRows[0]
            if (!library) {
              return rejectJoin("Library not found.")
            }

            const { rows: profileRows } = await query<{ skin: string | null }>(
              `select skin
               from profiles
               where id = $1
               limit 1`,
              [uid],
            )
            const profile = profileRows[0]
            if (!profile) {
              return rejectJoin("Failed to get profile.")
            }

            const join = async () => {
                if (!sessionManager.getSession(joinData.libraryId)) {
                    sessionManager.createSession(joinData.libraryId, library.map_data)
                }

                const currentSession = sessionManager.getPlayerSession(uid)
                if (currentSession) {
                    kickPlayer(uid, 'You have logged in from another location.')
                }

                const user = users.getUser(uid)!
                const username = formatEmailToName(user.email || "")
                sessionManager.addPlayerToSession(
                  socket.id,
                  joinData.libraryId,
                  uid,
                  username,
                  profile.skin || '009',
                )
                const newSession = sessionManager.getPlayerSession(uid)
                const player = newSession.getPlayer(uid)   

                socket.join(joinData.libraryId)
                socket.emit('joinedLibrary')
                emit('playerJoinedRoom', player)
                joiningInProgress.delete(uid)
            }

            if (library.owner_id === socket.handshake.query.uid) {
                return join()
            }

            if (library.only_owner) {
                return rejectJoin('This library is private right now. Come back later!')
            }

            if (library.share_id === joinData.shareId) {
                return join()
            } else {
                return rejectJoin('The share link has been changed.')
            }
        })

        // Handle a disconnection
        on('disconnect', Disconnect, ({ session, data }) => {
            const uid = socket.handshake.query.uid as string
            const socketIds = sessionManager.getSocketIdsInRoom(session.id, session.getPlayerRoom(uid))
            const success = sessionManager.logOutBySocketId(socket.id)
            if (success) {
                emitToSocketIds(socketIds, 'playerLeftRoom', uid)
                users.removeUser(uid)
            }
        })

        on('movePlayer', MovePlayer, ({ session, data }) => {  
            const player = session.getPlayer(socket.handshake.query.uid as string)
            const changedPlayers = session.movePlayer(player.uid, data.x, data.y)

            emit('playerMoved', {
                uid: player.uid,
                x: player.x,
                y: player.y
            })

            for (const uid of changedPlayers) {
                const changedPlayerData = session.getPlayer(uid)

                emitToSocketIds([changedPlayerData.socketId], 'proximityUpdate', {
                    proximityId: changedPlayerData.proximityId
                })
            }
        })  

        on('teleport', Teleport, ({ session, data }) => {
            const uid = socket.handshake.query.uid as string
            const player = session.getPlayer(uid)
            if (player.room !== data.roomIndex) {
                emit('playerLeftRoom', uid)
                const session = sessionManager.getPlayerSession(uid)
                const changedPlayers = session.changeRoom(uid, data.roomIndex, data.x, data.y)
                emit('playerJoinedRoom', player)

                for (const uid of changedPlayers) {
                    const changedPlayerData = session.getPlayer(uid)

                    emitToSocketIds([changedPlayerData.socketId], 'proximityUpdate', {
                        proximityId: changedPlayerData.proximityId
                    })
                }
            } else {
                const changedPlayers = session.movePlayer(player.uid, data.x, data.y)
                emit('playerTeleported', { uid, x: player.x, y: player.y })

                for (const uid of changedPlayers) {
                    const changedPlayerData = session.getPlayer(uid)

                    emitToSocketIds([changedPlayerData.socketId], 'proximityUpdate', {
                        proximityId: changedPlayerData.proximityId
                    })
                }
            }
        })

        on('changedSkin', ChangedSkin, ({ session, data }) => {
            const uid = socket.handshake.query.uid as string
            const player = session.getPlayer(uid)
            player.skin = data
            emit('playerChangedSkin', { uid, skin: player.skin })
        })

        on('sendMessage', NewMessage, ({ session, data }) => {
            // cannot exceed 300 characters
            if (data.length > 300 || data.trim() === '') return

            const message = removeExtraSpaces(data)

            const uid = socket.handshake.query.uid as string
            emit('receiveMessage', { uid, message })
        })
    })
}
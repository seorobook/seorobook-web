import { Router } from "express"
import { GetPlayersInRoom, GetPlayerCounts } from "./route-types"
import { z } from "zod"
import { sessionManager } from "../session"
import { verifyBearerToken } from "../auth"

export default function routes(): Router {
    const router = Router()

    router.get('/getPlayersInRoom', async (req, res) => {
        const access_token = req.headers.authorization?.split(' ')[1];

        if (!access_token) {
            return res.status(401).json({ message: 'No access token provided' });
        }

        let userId = ""
        try {
            const user = await verifyBearerToken(access_token)
            userId = user.id
        } catch {
            return res.status(401).json({ message: 'Invalid access token' })
        }

        const params = req.query as unknown as z.infer<typeof GetPlayersInRoom>
        if (!GetPlayersInRoom.safeParse(params).success) {
            return res.status(400).json({ message: 'Invalid parameters' })
        }

        const session = sessionManager.getPlayerSession(userId)
        if (!session) {
            return res.status(400).json({ message: 'User not in a library.' })
        }

        const players = session.getPlayersInRoom(params.roomIndex)
        return res.json({ players })
    })

    router.get('/getPlayerCounts', async (req, res) => {
        const access_token = req.headers.authorization?.split(' ')[1];

        if (!access_token) {
            return res.status(401).json({ message: 'No access token provided' });
        }

        let params = req.query as unknown as z.infer<typeof GetPlayerCounts>
        const parseResults = GetPlayerCounts.safeParse(params)
        if (!parseResults.success) {
            return res.status(400).json({ message: 'Invalid parameters' })
        }

        params = parseResults.data

        if (params.libraryIds.length > 100) {
            return res.status(400).json({ message: 'Too many server IDs' })
        }

        try {
            await verifyBearerToken(access_token)
        } catch {
            return res.status(401).json({ message: 'Invalid access token' })
        }

        const playerCounts: number[] = []
        for (const libraryId of params.libraryIds) {
            const session = sessionManager.getSession(libraryId)
            if (session) {
                const playerCount = session.getPlayerCount()

                playerCounts.push(playerCount)
            } else {
                playerCounts.push(0)
            }
        }

        return res.json({ playerCounts })
    })

    return router
}
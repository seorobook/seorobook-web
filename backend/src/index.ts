// IMPORTANT: env must be loaded before importing modules that read it.
const path = require("path") as typeof import("path")
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") })
require("dotenv").config({ path: path.resolve(process.cwd(), "..", ".env.local") })

const express = require("express") as typeof import("express")
const cors = require("cors") as typeof import("cors")
const http = require("http") as typeof import("http")
const { Server: SocketIOServer } = require("socket.io") as typeof import("socket.io")

const routes = require("./routes/routes").default as typeof import("./routes/routes").default
const { sockets } = require("./sockets/sockets") as typeof import("./sockets/sockets")

const app = express()
const server = http.createServer(app)

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
)

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
  },
})

app.use(routes())
sockets(io)

// Supabase realtime was used to terminate sessions on library changes/deletes.
// That dependency has been removed; if you need this behavior again,
// implement it with DB notifications or an explicit "terminate session" call
// in the Next.js API routes that mutate libraries.

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`)
})

export { io }
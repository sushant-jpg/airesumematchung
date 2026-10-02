import { createServer } from "node:http";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { app } from "./app.js";
import { config } from "./config.js";
import { setSocketServer } from "./services/notification.service.js";

await mongoose.connect(config.MONGODB_URI);
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: config.WEB_URL, credentials: true } });
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) throw new Error("Missing token");
    const claims = jwt.verify(token, config.JWT_ACCESS_SECRET) as jwt.JwtPayload;
    socket.data.userId = claims.sub; next();
  } catch { next(new Error("Authentication failed")); }
});
io.on("connection", (socket) => socket.join(`user:${String(socket.data.userId)}`));
setSocketServer(io);
httpServer.listen(config.API_PORT, () => console.log(`HireMatch API listening on :${config.API_PORT}`));

async function shutdown(): Promise<void> { io.close(); httpServer.close(); await mongoose.disconnect(); process.exit(0); }
process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown);

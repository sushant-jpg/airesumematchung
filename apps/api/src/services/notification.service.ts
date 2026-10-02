import type { Server } from "socket.io";
import { Notification } from "../models/index.js";

let socketServer: Server | undefined;
export function setSocketServer(server: Server): void { socketServer = server; }
export async function notify(userId: string, type: string, title: string, message: string, data?: Record<string, unknown>) {
  const notification = await Notification.create({ userId, type, title, message, data });
  socketServer?.to(`user:${userId}`).emit("notification:new", notification.toJSON());
  return notification;
}

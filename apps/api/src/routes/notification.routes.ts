import { Router } from "express";
import { authenticate } from "../lib/auth.js";
import { AppError } from "../lib/errors.js";
import { Notification } from "../models/index.js";

export const notificationRouter = Router();
notificationRouter.use(authenticate);
notificationRouter.get("/", async (request, response) => {
  const page = Math.max(Number(request.query.page) || 1, 1); const limit = Math.min(Number(request.query.limit) || 20, 50);
  const filter = { userId: request.auth!.userId }; const [notifications, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(filter), Notification.countDocuments({ ...filter, readAt: null })
  ]);
  response.json({ success: true, data: notifications, meta: { unread }, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
notificationRouter.patch("/read-all", async (request, response) => {
  await Notification.updateMany({ userId: request.auth!.userId, readAt: null }, { readAt: new Date() });
  response.json({ success: true, data: { updated: true } });
});
notificationRouter.patch("/:id/read", async (request, response) => {
  const notification = await Notification.findOneAndUpdate({ _id: request.params.id, userId: request.auth!.userId }, { readAt: new Date() }, { new: true });
  if (!notification) throw new AppError(404, "NOTIFICATION_NOT_FOUND", "The notification was not found.");
  response.json({ success: true, data: notification });
});

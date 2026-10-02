import type { Request } from "express";
import { AuditLog } from "../models/index.js";

export async function audit(request: Request, action: string, resource: string, resourceId?: string): Promise<void> {
  await AuditLog.create({
    actorId: request.auth?.userId, actorRole: request.auth?.role ?? "ANONYMOUS", action, resource, resourceId,
    ip: request.ip, userAgent: request.header("user-agent")?.slice(0, 300), requestId: request.requestId
  });
}

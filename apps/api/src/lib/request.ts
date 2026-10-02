import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requestContext(request: Request, response: Response, next: NextFunction): void {
  const supplied = request.header("x-request-id");
  request.requestId = supplied?.slice(0, 100) || randomUUID();
  response.setHeader("X-Request-ID", request.requestId);
  next();
}

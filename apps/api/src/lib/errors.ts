import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly details?: unknown) {
    super(message);
  }
}
export function notFound(request: Request, _response: Response, next: NextFunction): void {
  next(new AppError(404, "RESOURCE_NOT_FOUND", `Route ${request.method} ${request.path} was not found.`));
}
export function errorHandler(error: unknown, request: Request, response: Response, _next: NextFunction): void {
  const appError = error instanceof AppError ? error : error instanceof ZodError
    ? new AppError(422, "VALIDATION_FAILED", "The request contains invalid data.", error.flatten())
    : new AppError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  if (!(error instanceof AppError) && !(error instanceof ZodError)) console.error({ requestId: request.requestId, error });
  response.status(appError.status).json({ success: false, error: {
    code: appError.code, message: appError.message, requestId: request.requestId,
    ...(appError.details ? { details: appError.details } : {})
  }});
}

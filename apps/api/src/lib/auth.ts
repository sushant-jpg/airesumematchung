import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@hirematch/types";
import { config } from "../config.js";
import { AppError } from "./errors.js";

interface Claims { sub: string; role: UserRole; type: "access"; }
export function signAccessToken(userId: string, role: UserRole): string {
  return jwt.sign({ role, type: "access" }, config.JWT_ACCESS_SECRET, { subject: userId, expiresIn: config.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"] });
}
export function authenticate(request: Request, _response: Response, next: NextFunction): void {
  const token = request.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new AppError(401, "AUTH_REQUIRED", "Authentication is required.");
  try {
    const claims = jwt.verify(token, config.JWT_ACCESS_SECRET) as jwt.JwtPayload & Claims;
    if (claims.type !== "access" || !claims.sub) throw new Error("Invalid token type");
    request.auth = { userId: claims.sub, role: claims.role };
    next();
  } catch {
    throw new AppError(401, "AUTH_TOKEN_INVALID", "The access token is invalid or expired.");
  }
}
export function authorize(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.auth || !roles.includes(request.auth.role)) throw new AppError(403, "AUTH_FORBIDDEN", "You do not have permission to perform this action.");
    next();
  };
}

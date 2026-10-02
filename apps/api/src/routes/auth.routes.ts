import { createHash, randomBytes } from "node:crypto";
import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { loginSchema, passwordSchema, registerSchema } from "@hirematch/validation";
import { config } from "../config.js";
import { authenticate, signAccessToken } from "../lib/auth.js";
import { audit } from "../lib/audit.js";
import { AppError } from "../lib/errors.js";
import { ActionToken, CandidateProfile, RecruiterProfile, RefreshSession, User } from "../models/index.js";

export const authRouter = Router();
const cookieOptions = { httpOnly: true, secure: config.COOKIE_SECURE === "true", sameSite: "lax" as const, path: "/api/v1/auth", maxAge: config.REFRESH_TOKEN_TTL_DAYS * 86_400_000 };
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

async function createSession(request: Request, userId: string): Promise<string> {
  const token = randomBytes(48).toString("base64url");
  await RefreshSession.create({ userId, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + config.REFRESH_TOKEN_TTL_DAYS * 86_400_000), ip: request.ip, userAgent: request.header("user-agent") });
  return token;
}
async function createActionToken(userId: string, purpose: "VERIFY_EMAIL" | "RESET_PASSWORD", lifetimeMinutes: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await ActionToken.deleteMany({ userId, purpose });
  await ActionToken.create({ userId, purpose, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + lifetimeMinutes * 60_000) });
  return token;
}

authRouter.post("/register", async (request, response) => {
  const input = registerSchema.parse(request.body);
  if (await User.exists({ email: input.email })) throw new AppError(409, "AUTH_EMAIL_EXISTS", "An account already exists for this email.");
  const user = await User.create({ ...input, passwordHash: await bcrypt.hash(input.password, 12) });
  if (input.role === "CANDIDATE") await CandidateProfile.create({ userId: user.id });
  else await RecruiterProfile.create({ userId: user.id });
  await audit(request, "USER_REGISTERED", "User", user.id);
  response.status(201).json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified } });
});

authRouter.post("/login", async (request, response) => {
  const input = loginSchema.parse(request.body);
  const user = await User.findOne({ email: input.email }).select("+passwordHash +failedLoginCount +lockedUntil");
  if (!user || (user.lockedUntil && user.lockedUntil > new Date())) {
    await audit(request, "LOGIN_FAILED", "User", user?.id);
    throw new AppError(401, "AUTH_INVALID_CREDENTIALS", "Invalid email or password.");
  }
  if (user.suspendedAt) throw new AppError(403, "AUTH_ACCOUNT_SUSPENDED", "This account is suspended.");
  if (!await bcrypt.compare(input.password, user.passwordHash)) {
    user.failedLoginCount += 1;
    if (user.failedLoginCount >= 5) user.lockedUntil = new Date(Date.now() + 15 * 60_000);
    await user.save(); await audit(request, "LOGIN_FAILED", "User", user.id);
    throw new AppError(401, "AUTH_INVALID_CREDENTIALS", "Invalid email or password.");
  }
  user.failedLoginCount = 0; user.lockedUntil = undefined; await user.save();
  const refreshToken = await createSession(request, user.id);
  response.cookie("hirematch_refresh", refreshToken, cookieOptions);
  await audit(request, "LOGIN_SUCCEEDED", "User", user.id);
  response.json({ success: true, data: { accessToken: signAccessToken(user.id, user.role), user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified } } });
});

authRouter.post("/refresh", async (request, response) => {
  const supplied = request.cookies?.hirematch_refresh as string | undefined;
  if (!supplied) throw new AppError(401, "AUTH_REFRESH_REQUIRED", "A refresh session is required.");
  const session = await RefreshSession.findOne({ tokenHash: tokenHash(supplied) }).select("+tokenHash");
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    if (session) await RefreshSession.updateMany({ userId: session.userId, revokedAt: null }, { revokedAt: new Date() });
    response.clearCookie("hirematch_refresh", cookieOptions);
    throw new AppError(401, "AUTH_REFRESH_INVALID", "The refresh session is invalid or expired.");
  }
  const user = await User.findById(session.userId);
  if (!user || user.suspendedAt) throw new AppError(401, "AUTH_REFRESH_INVALID", "The refresh session is invalid or expired.");
  session.revokedAt = new Date();
  const nextToken = await createSession(request, user.id);
  const nextSession = await RefreshSession.findOne({ tokenHash: tokenHash(nextToken) });
  session.replacedById = nextSession?._id; await session.save();
  response.cookie("hirematch_refresh", nextToken, cookieOptions);
  response.json({ success: true, data: { accessToken: signAccessToken(user.id, user.role) } });
});

authRouter.post("/logout", async (request, response: Response) => {
  const supplied = request.cookies?.hirematch_refresh as string | undefined;
  if (supplied) await RefreshSession.updateOne({ tokenHash: tokenHash(supplied), revokedAt: null }, { revokedAt: new Date() });
  response.clearCookie("hirematch_refresh", cookieOptions).status(204).send();
});

authRouter.post("/email-verification/request", authenticate, async (request, response) => {
  const user = await User.findById(request.auth!.userId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "The user was not found.");
  if (user.emailVerified) return response.json({ success: true, data: { alreadyVerified: true } });
  const token = await createActionToken(user.id, "VERIFY_EMAIL", 60);
  // Production deployments send this through an email provider; it is exposed only for local development.
  return response.status(202).json({ success: true, data: { accepted: true, ...(config.NODE_ENV === "development" ? { developmentToken: token } : {}) } });
});
authRouter.post("/email-verification/confirm", async (request, response) => {
  const token = typeof request.body.token === "string" ? request.body.token : "";
  const record = await ActionToken.findOne({ tokenHash: tokenHash(token), purpose: "VERIFY_EMAIL", usedAt: null, expiresAt: { $gt: new Date() } }).select("+tokenHash");
  if (!record) throw new AppError(400, "AUTH_VERIFICATION_INVALID", "The verification link is invalid or expired.");
  await User.updateOne({ _id: record.userId }, { emailVerified: true }); record.usedAt = new Date(); await record.save();
  response.json({ success: true, data: { verified: true } });
});
authRouter.post("/password/forgot", async (request, response) => {
  const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const user = await User.findOne({ email }); let token: string | undefined;
  if (user) token = await createActionToken(user.id, "RESET_PASSWORD", 30);
  response.status(202).json({ success: true, data: { accepted: true, ...(config.NODE_ENV === "development" && token ? { developmentToken: token } : {}) } });
});
authRouter.post("/password/reset", async (request, response) => {
  const token = typeof request.body.token === "string" ? request.body.token : "";
  const password = passwordSchema.parse(request.body.password);
  const record = await ActionToken.findOne({ tokenHash: tokenHash(token), purpose: "RESET_PASSWORD", usedAt: null, expiresAt: { $gt: new Date() } }).select("+tokenHash");
  if (!record) throw new AppError(400, "AUTH_RESET_INVALID", "The password reset link is invalid or expired.");
  await User.updateOne({ _id: record.userId }, { passwordHash: await bcrypt.hash(password, 12), failedLoginCount: 0, lockedUntil: null });
  await RefreshSession.updateMany({ userId: record.userId, revokedAt: null }, { revokedAt: new Date() });
  record.usedAt = new Date(); await record.save();
  response.json({ success: true, data: { reset: true } });
});

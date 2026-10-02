import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";
import { config } from "./config.js";
import { errorHandler, notFound, AppError } from "./lib/errors.js";
import { requestContext } from "./lib/request.js";
import { openapi } from "./openapi.js";
import { authRouter } from "./routes/auth.routes.js";
import { candidateRouter } from "./routes/candidate.routes.js";
import { companyRouter } from "./routes/company.routes.js";
import { jobRouter } from "./routes/job.routes.js";
import { matchRouter } from "./routes/match.routes.js";
import { applicationRouter } from "./routes/application.routes.js";
import { notificationRouter } from "./routes/notification.routes.js";
import { savedJobRouter } from "./routes/saved-job.routes.js";
import { adminRouter } from "./routes/admin.routes.js";

function containsUnsafeMongoKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nested]) => key.startsWith("$") || key.includes(".") || containsUnsafeMongoKey(nested));
}
export const app = express();
app.disable("x-powered-by"); app.set("trust proxy", 1);
app.use(requestContext, helmet(), cors({ origin: config.WEB_URL, credentials: true }), express.json({ limit: "1mb" }), cookieParser());
app.use((request, _response, next) => { if (containsUnsafeMongoKey(request.body)) throw new AppError(400, "REQUEST_UNSAFE_KEY", "Request contains a prohibited key."); next(); });
app.use("/api/v1/auth", rateLimit({ windowMs: 15 * 60_000, limit: 50, standardHeaders: true, legacyHeaders: false }), authRouter);
app.get("/health/live", (_request, response) => response.json({ status: "ok", service: "api" }));
app.get("/health/ready", async (_request, response) => {
  const mongo = mongoose.connection.readyState === 1;
  let ai = false; try { ai = (await fetch(`${config.AI_SERVICE_URL}/health/ready`, { signal: AbortSignal.timeout(1500) })).ok; } catch { ai = false; }
  response.status(mongo && ai ? 200 : 503).json({ status: mongo && ai ? "ready" : "degraded", dependencies: { mongodb: mongo ? "up" : "down", aiService: ai ? "up" : "down" } });
});
app.get("/api/v1/openapi.json", (_request, response) => response.json(openapi));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.use("/api/v1/companies", companyRouter); app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/candidates", candidateRouter); app.use("/api/v1/matches", matchRouter);
app.use("/api/v1/applications", applicationRouter); app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/saved-jobs", savedJobRouter); app.use("/api/v1/admin", adminRouter);
app.use(notFound, errorHandler);

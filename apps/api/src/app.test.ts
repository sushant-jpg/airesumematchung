import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./app.js";
import { transitions } from "./routes/application.routes.js";

describe("API foundation", () => {
  it("returns liveness and a request id", async () => {
    const response = await request(app).get("/health/live").expect(200);
    expect(response.body).toEqual({ status: "ok", service: "api" });
    expect(response.headers["x-request-id"]).toBeTruthy();
  });
  it("uses the standard error envelope", async () => {
    const response = await request(app).get("/missing").expect(404);
    expect(response.body.success).toBe(false); expect(response.body.error.code).toBe("RESOURCE_NOT_FOUND");
    expect(response.body.error.requestId).toBe(response.headers["x-request-id"]);
  });
  it("prevents invalid application state transitions", () => {
    expect(transitions.APPLIED).toContain("REVIEWING"); expect(transitions.REJECTED).toEqual([]); expect(transitions.HIRED).toEqual([]);
  });
});

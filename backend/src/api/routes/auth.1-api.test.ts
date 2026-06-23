import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { authRouter } from "./auth";

vi.mock("../../config", () => ({
  default: {
    api: { key: "test-secret-key" },
    server: { nodeEnv: "test" },
  },
}));

import config from "../../config";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/auth", authRouter());
  return app;
}

describe("authRouter", () => {
  describe("POST /auth/login", () => {
    it("returns 200 with ok: true when password matches", async () => {
      const res = await request(makeApp())
        .post("/auth/login")
        .send({ password: "test-secret-key" });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("sets session cookie on successful login", async () => {
      const res = await request(makeApp())
        .post("/auth/login")
        .send({ password: "test-secret-key" });
      expect(res.status).toBe(200);
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toContain("session=");
    });

    it("returns 401 when password is missing", async () => {
      const res = await request(makeApp()).post("/auth/login").send({});
      expect(res.status).toBe(401);
    });

    it("returns 401 when password is wrong", async () => {
      const res = await request(makeApp()).post("/auth/login").send({ password: "wrong-password" });
      expect(res.status).toBe(401);
    });

    it("returns 503 when api key is not configured", async () => {
      const original = config.api.key;
      (config.api as { key: string | undefined }).key = undefined;
      const res = await request(makeApp()).post("/auth/login").send({ password: "any" });
      (config.api as { key: string | undefined }).key = original;
      expect(res.status).toBe(503);
    });
  });

  describe("POST /auth/logout", () => {
    it("returns 200 with ok: true", async () => {
      const res = await request(makeApp()).post("/auth/logout");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("clears the session cookie", async () => {
      const res = await request(makeApp()).post("/auth/logout");
      expect(res.status).toBe(200);
      const cookies = res.headers["set-cookie"] as unknown as string[] | undefined;
      expect(cookies?.some((c) => c.startsWith("session=;"))).toBe(true);
    });
  });

  describe("GET /auth/me", () => {
    it("returns 200 when x-api-key header matches", async () => {
      const res = await request(makeApp()).get("/auth/me").set("x-api-key", "test-secret-key");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("returns 200 when session cookie matches", async () => {
      const res = await request(makeApp()).get("/auth/me").set("Cookie", "session=test-secret-key");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("returns 401 when no credentials provided", async () => {
      const res = await request(makeApp()).get("/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns 401 when x-api-key header is wrong", async () => {
      const res = await request(makeApp()).get("/auth/me").set("x-api-key", "wrong-key");
      expect(res.status).toBe(401);
    });

    it("returns 401 when session cookie is wrong", async () => {
      const res = await request(makeApp()).get("/auth/me").set("Cookie", "session=wrong-key");
      expect(res.status).toBe(401);
    });
  });
});

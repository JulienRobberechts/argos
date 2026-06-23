import { randomUUID } from "node:crypto";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nullLogger } from "../../../tests/fakes/NullLogger";
import type { IGenerateQuiz, QuizQuestion } from "../../app-ports/quiz";
import { createErrorHandler } from "../middleware/errorHandler";
import { quizzesRouter } from "./quizzes";

function makeQuestion(overrides?: Partial<QuizQuestion>): QuizQuestion {
  return {
    text: "What is RAG?",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctIndex: 0,
    ...overrides,
  };
}

function makeGenerateQuiz(): IGenerateQuiz {
  return { execute: vi.fn().mockResolvedValue([makeQuestion()]) };
}

function makeApp(generateQuiz = makeGenerateQuiz()) {
  const app = express();
  app.use(express.json());
  app.use("/quizzes", quizzesRouter(generateQuiz));
  app.use(createErrorHandler(nullLogger));
  return app;
}

describe("quizzesRouter", () => {
  let generateQuiz: IGenerateQuiz;

  beforeEach(() => {
    generateQuiz = makeGenerateQuiz();
  });

  describe("POST /quizzes/generate", () => {
    it("returns 200 with questions array", async () => {
      const questions = [makeQuestion(), makeQuestion()];
      (generateQuiz.execute as ReturnType<typeof vi.fn>).mockResolvedValue(questions);
      const res = await request(makeApp(generateQuiz))
        .post("/quizzes/generate")
        .send({ documentIds: [randomUUID()] });
      expect(res.status).toBe(200);
      expect(res.body.questions).toHaveLength(2);
    });

    it("returns questions with expected shape", async () => {
      const res = await request(makeApp(generateQuiz))
        .post("/quizzes/generate")
        .send({ documentIds: [randomUUID()] });
      expect(res.status).toBe(200);
      expect(res.body.questions[0]).toMatchObject({
        text: expect.any(String),
        options: expect.any(Array),
        correctIndex: expect.any(Number),
      });
    });

    it("accepts optional questionCount parameter", async () => {
      const res = await request(makeApp(generateQuiz))
        .post("/quizzes/generate")
        .send({ documentIds: [randomUUID()], questionCount: 10 });
      expect(res.status).toBe(200);
    });

    it("returns 200 when questionCount is omitted (uses default)", async () => {
      const res = await request(makeApp(generateQuiz))
        .post("/quizzes/generate")
        .send({ documentIds: [randomUUID()] });
      expect(res.status).toBe(200);
    });

    it("returns 400 when documentIds is missing", async () => {
      const res = await request(makeApp(generateQuiz)).post("/quizzes/generate").send({});
      expect(res.status).toBe(400);
    });

    it("returns 400 when documentIds is empty array", async () => {
      const res = await request(makeApp(generateQuiz))
        .post("/quizzes/generate")
        .send({ documentIds: [] });
      expect(res.status).toBe(400);
    });

    it("returns 400 when documentIds contains non-UUID values", async () => {
      const res = await request(makeApp(generateQuiz))
        .post("/quizzes/generate")
        .send({ documentIds: ["not-a-uuid"] });
      expect(res.status).toBe(400);
    });

    it("returns 400 when questionCount is below minimum of 3", async () => {
      const res = await request(makeApp(generateQuiz))
        .post("/quizzes/generate")
        .send({ documentIds: [randomUUID()], questionCount: 2 });
      expect(res.status).toBe(400);
    });

    it("returns 400 when questionCount exceeds maximum of 20", async () => {
      const res = await request(makeApp(generateQuiz))
        .post("/quizzes/generate")
        .send({ documentIds: [randomUUID()], questionCount: 21 });
      expect(res.status).toBe(400);
    });
  });
});

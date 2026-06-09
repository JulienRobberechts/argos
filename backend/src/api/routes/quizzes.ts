import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { GenerateQuiz } from "../../application/GenerateQuiz";

const generateQuizSchema = z.object({
  documentId: z.string().uuid(),
  questionCount: z.number().int().min(3).max(20).default(5),
});

export function quizzesRouter(generateQuiz: GenerateQuiz): Router {
  const router = Router();

  router.post(
    "/generate",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const body = generateQuizSchema.parse(req.body);
        const questions = await generateQuiz.execute(
          body.documentId,
          body.questionCount,
        );
        res.json({ questions });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";

import { apiKeyAuth } from "./api/middleware/apiKeyAuth";
import { errorHandler } from "./api/middleware/errorHandler";
import { adminRouter } from "./api/routes/admin";
import { authRouter } from "./api/routes/auth";
import { configRouter } from "./api/routes/config";
import { conversationsRouter } from "./api/routes/conversations";
import { documentsRouter } from "./api/routes/documents";
import { quizzesRouter } from "./api/routes/quizzes";
import { searchRouter } from "./api/routes/search";
import {
  appSettingsService,
  askQuestion,
  checkStorageConsistency,
  chunkRepo,
  conversationRepo,
  createDocument,
  documentRepo,
  fileStorage,
  generateQuiz,
  ingestDocument,
  resetAll,
  searchKnowledge,
  summaryRepo,
  summarizeDocument,
} from "./registry";
import config from "./config";

const app = express();

app.use(
  cors({
    origin: config.server.allowedOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/config", configRouter(appSettingsService));
app.use(
  "/api/admin",
  adminRouter(checkStorageConsistency, appSettingsService, resetAll),
);
app.use("/api/auth", authRouter());

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);
app.use("/api", apiKeyAuth);
app.use(
  "/api/documents",
  documentsRouter(
    documentRepo,
    chunkRepo,
    fileStorage,
    createDocument,
    ingestDocument,
    summaryRepo,
    summarizeDocument,
  ),
);
app.use(
  "/api/conversations",
  conversationsRouter(conversationRepo, askQuestion),
);
app.use("/api/search", searchRouter(searchKnowledge));
app.use("/api/quizzes", quizzesRouter(generateQuiz));

app.use(errorHandler);

export default app;

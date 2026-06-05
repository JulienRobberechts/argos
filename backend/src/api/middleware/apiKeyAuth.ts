import { NextFunction, Request, Response } from "express";
import config from "../../config";

export function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== config.api.key) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

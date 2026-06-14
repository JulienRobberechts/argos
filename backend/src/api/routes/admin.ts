import { Router, Request, Response, NextFunction } from "express";
import { CheckStorageConsistency } from "../../application/CheckStorageConsistency";

export function adminRouter(checkConsistency: CheckStorageConsistency): Router {
  const router = Router();

  router.get(
    "/storage/consistency",
    async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await checkConsistency.execute();
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

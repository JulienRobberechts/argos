import { type NextFunction, type Request, type Response, Router } from "express";
import type { AppSettingsPatch, AppSettingsService } from "../../application/AppSettingsService";
import type { CheckStorageConsistency } from "../../application/CheckStorageConsistency";
import type { ResetAll } from "../../application/ResetAll";

export function adminRouter(
  checkConsistency: CheckStorageConsistency,
  settingsService: AppSettingsService,
  resetAll: ResetAll,
): Router {
  const router = Router();

  router.get(
    "/storage/consistency",
    async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await checkConsistency.execute();
        const ok = result.orphanFiles.length === 0 && result.missingFiles.length === 0;
        res.json({ ok, ...result });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/settings",
    async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const settings = await settingsService.getSettings();
        res.json(settings);
      } catch (err) {
        next(err);
      }
    },
  );

  router.put(
    "/settings",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const updated = await settingsService.updateSettings(req.body as AppSettingsPatch);
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/reset",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { newSettings } = req.body as { newSettings?: AppSettingsPatch };
        await resetAll.execute(newSettings);
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

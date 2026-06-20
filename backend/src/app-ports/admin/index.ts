export * from "./IAppSettingsService";
export * from "./ICheckStorageConsistency";
export * from "./IResetAll";

import type { IAppSettingsService } from "./IAppSettingsService";
import type { ICheckStorageConsistency } from "./ICheckStorageConsistency";
import type { IResetAll } from "./IResetAll";

export interface ArgosAdmin {
  settingsService: IAppSettingsService;
  checkStorageConsistency: ICheckStorageConsistency;
  resetAll: IResetAll;
}

import type { AppSettingsPatch } from "./IAppSettingsService";

export interface IResetAll {
  execute(newSettings?: AppSettingsPatch): Promise<void>;
}

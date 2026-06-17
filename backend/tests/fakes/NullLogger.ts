import type { ILogger } from "../../src/domain/ports/ILogger";

export const nullLogger: ILogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

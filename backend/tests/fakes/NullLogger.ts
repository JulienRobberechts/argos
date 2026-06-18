import type { ILogger } from "../../src/infra-ports/ILogger";

export const nullLogger: ILogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

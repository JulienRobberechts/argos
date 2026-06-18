export interface ILogger {
  debug(msg: string, context?: object): void;
  info(msg: string, context?: object): void;
  warn(msg: string, context?: object): void;
  error(msg: string, context?: object | Error): void;
}

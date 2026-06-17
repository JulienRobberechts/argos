export function setupProcessHandlers(): void {
  process.on("uncaughtException", (err) => {
    console.error("[uncaughtException]", err);
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection]", reason);
    process.exit(1);
  });
  process.on("SIGTERM", () => {
    console.log("[SIGTERM] received — Stopping the container");
    process.exit(0);
  });
}

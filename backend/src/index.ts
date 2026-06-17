import { setupProcessHandlers } from "./processHandlers";
import config from "./config";
import app from "./app";

setupProcessHandlers();

const PORT = config.server.port;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

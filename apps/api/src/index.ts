import { createApiApp } from "./app.js";
import { loadApiEnv } from "./config/env.js";

const env = loadApiEnv();
const app = createApiApp();

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

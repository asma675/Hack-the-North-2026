import { spawn } from "node:child_process";

const env = {
  ...process.env,
  NODE_ENV: "development",
};

const api = spawn(
  process.execPath,
  ["server/dev-api.mjs"],
  {
    stdio: "inherit",
    env,
  }
);

const vite = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "0.0.0.0"],
  {
    stdio: "inherit",
    env,
  }
);

const stop = () => {
  api.kill();
  vite.kill();
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

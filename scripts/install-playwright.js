const { spawnSync } = require("node:child_process");

const env = {
  ...process.env,
  PLAYWRIGHT_BROWSERS_PATH: "0",
};

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npxCommand, ["playwright", "install", "chromium"], {
  stdio: "inherit",
  env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

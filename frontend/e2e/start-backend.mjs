import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const backend = resolve(here, "../../backend");
const repoRoot = resolve(backend, "..");
const venvPython =
  process.platform === "win32"
    ? resolve(repoRoot, ".venv/Scripts/python.exe")
    : resolve(repoRoot, ".venv/bin/python");
const python = process.env.PYTHON ?? (existsSync(venvPython) ? venvPython : "python");

const database = join(mkdtempSync(join(tmpdir(), "compis-e2e-")), "e2e.db").replaceAll("\\", "/");

const env = {
  ...process.env,
  JWT_SECRET_KEY: "e2e-secret-key-e2e-secret-key-e2e-1234",
  DATABASE_URL: `sqlite:///${database}`,
  CORS_ORIGINS: "http://localhost:3001",
  PAYPAL_DEMO_CLIENT_ID: "",
  PAYPAL_DEMO_CLIENT_SECRET: "",
  CLOUDINARY_CLOUD_NAME: "",
  MAIL_SERVER: "",
  CRON_SECRET: "",
};

const flask = (...args) => ["-m", "flask", "--app", "compis.bootstrap:create_app", ...args];

for (const step of [["db", "upgrade"], ["seed-demo"]]) {
  const result = spawnSync(python, flask(...step), { cwd: backend, env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const server = spawn(python, flask("run", "--port", "5001"), {
  cwd: backend,
  env,
  stdio: "inherit",
});

const stop = () => server.kill();
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.on("exit", stop);
server.on("exit", (code) => process.exit(code ?? 0));

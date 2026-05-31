import fs from "node:fs/promises";
import { spawn } from "node:child_process";

const port = 64919;
const baseUrl = `http://127.0.0.1:${port}`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/index.html`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await delay(1000);
  }
  throw new Error("Servidor local nao iniciou a tempo");
}

async function fetchJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

async function main() {
  await fs.mkdir("data", { recursive: true });

  const server = spawn(process.execPath, ["server.cjs"], {
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  server.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer();

    const externalCeo = await fetchJson("/api/external-ceo");
    externalCeo.origem = "snapshot-diario-github-actions";
    await fs.writeFile("data/external-ceo-static.json", `${JSON.stringify(externalCeo, null, 2)}\n`, "utf8");

    const externalMetrics = await fetchJson("/api/external-brand-metrics");
    await fs.writeFile("data/external-brand-metrics-static.json", `${JSON.stringify(externalMetrics, null, 2)}\n`, "utf8");

    console.log(JSON.stringify({
      updatedAt: new Date().toISOString(),
      brands: externalCeo.brands?.length || 0,
      sites: externalCeo.sites?.length || 0,
      externalRows: externalMetrics.table?.rows?.length || 0,
    }, null, 2));
  } finally {
    server.kill();
  }

  if (stderr.trim()) console.warn(stderr.trim());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

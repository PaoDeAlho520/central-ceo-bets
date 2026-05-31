import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(root, "data", "journey-screenshots");
const reportPath = path.join(root, "data", "public-journey-audits.json");

const brands = [
  { id: "maxima", name: "Maxima Bet", url: "https://www.maxima.bet.br/" },
  { id: "ultra", name: "Ultra Bet", url: "https://www.ultra.bet.br/" },
  { id: "suprema", name: "Suprema Bet", url: "https://www.suprema.bet.br/" },
];

const steps = [
  { id: "home", label: "home", patterns: [/./i] },
  { id: "cadastro", label: "cadastro", patterns: [/cadastro/i, /register/i, /criar conta/i] },
  { id: "login", label: "login", patterns: [/login/i, /entrar/i] },
  { id: "cassino", label: "cassino", patterns: [/cassino/i, /casino/i] },
  { id: "sportsbook", label: "sportsbook", patterns: [/esportes/i, /sports/i, /sportsbook/i] },
  { id: "promocoes", label: "promocoes", patterns: [/promo/i, /bonus/i, /bônus/i] },
  { id: "suporte", label: "suporte", patterns: [/suporte/i, /ajuda/i, /help/i, /support/i] },
  { id: "termos", label: "termos", patterns: [/termos/i, /terms/i] },
  { id: "privacidade", label: "privacidade", patterns: [/privacidade/i, /privacy/i] },
  { id: "jogo-responsavel", label: "jogo responsavel", patterns: [/jogo respons/i, /responsible gaming/i] },
];

async function readExisting() {
  try {
    return JSON.parse(await fs.readFile(reportPath, "utf8"));
  } catch {
    return { runs: [] };
  }
}

async function clickByPatterns(page, patterns) {
  for (const pattern of patterns) {
    const locator = page.getByText(pattern).first();
    if ((await locator.count()) > 0) {
      await locator.click({ timeout: 5000 });
      await page.waitForTimeout(1200);
      return true;
    }
  }
  return false;
}

async function auditBrand(browser, brand) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const networkErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    networkErrors.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ""}`);
  });

  const runDir = path.join(outputDir, brand.id, new Date().toISOString().slice(0, 10));
  await fs.mkdir(runDir, { recursive: true });

  const results = [];
  await page.goto(brand.url, { waitUntil: "domcontentloaded", timeout: 45000 });

  for (const step of steps) {
    let ok = true;
    if (step.id !== "home") {
      await page.goto(brand.url, { waitUntil: "domcontentloaded", timeout: 45000 });
      ok = await clickByPatterns(page, step.patterns);
    }
    const screenshot = path.join(runDir, `${step.id}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    results.push({ step: step.id, ok, url: page.url(), screenshot });
  }

  await context.close();
  return {
    brandId: brand.id,
    brandName: brand.name,
    collectedAt: new Date().toISOString(),
    results,
    consoleErrors,
    networkErrors,
  };
}

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = await readExisting();
for (const brand of brands) {
  report.runs.push(await auditBrand(browser, brand));
}
await browser.close();
report.runs = report.runs.slice(-90);
await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(`Auditoria publica salva em ${reportPath}`);

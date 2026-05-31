import fs from "node:fs/promises";

const SITES = [
  { id: "maxima", name: "Maxima Bet", url: "https://www.maxima.bet.br" },
  { id: "ultra", name: "Ultra Bet", url: "https://www.ultra.bet.br" },
  { id: "suprema", name: "Suprema Bet", url: "https://www.suprema.bet.br" },
];

const categories = ["performance", "accessibility", "best-practices", "seo"];
const headers = {
  "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
};

function clamp(value, min = 0, max = 100) {
  if (!Number.isFinite(value)) return null;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function decodeHtml(text = "") {
  return String(text)
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMeta(html, name) {
  const direct = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, "i");
  const reverse = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, "i");
  return decodeHtml(html.match(direct)?.[1] || html.match(reverse)?.[1] || "");
}

function htmlFallback(url, strategy, html, elapsedMs, status) {
  const bytes = Buffer.byteLength(html || "", "utf8");
  const scripts = (html.match(/<script\b/gi) || []).length;
  const styles = (html.match(/<link\b[^>]+stylesheet/gi) || []).length;
  const images = (html.match(/<img\b/gi) || []).length;
  const requests = scripts + styles + images + 1;
  const hasTitle = /<title>[^<]+<\/title>/i.test(html);
  const hasDescription = Boolean(extractMeta(html, "description"));
  const hasCanonical = /rel=["']canonical["']/i.test(html);
  const hasViewport = /name=["']viewport["']/i.test(html);
  const hasAlt = images === 0 || /<img\b[^>]+alt=["'][^"']+/i.test(html);
  const assetPenalty = Math.min(requests, 90) * 0.35;
  const performance = clamp(95 - elapsedMs / 80 - assetPenalty - bytes / 300000);
  const accessibility = clamp((hasAlt ? 45 : 20) + (hasTitle ? 25 : 0) + (hasViewport ? 20 : 0) + 10);
  const bestPractices = clamp(82 + (url.startsWith("https://") ? 10 : 0) - Math.min(scripts, 45) * 0.55);
  const seo = clamp((hasTitle ? 30 : 0) + (hasDescription ? 30 : 0) + (hasCanonical ? 20 : 0) + (hasViewport ? 20 : 0));

  return {
    strategy,
    collectedAt: new Date().toISOString(),
    performance,
    accessibility,
    bestPractices,
    seo,
    coreWebVitals: {
      fcp: `${(elapsedMs / 1000).toFixed(1)} s`,
      lcp: `${(Math.max(elapsedMs * 1.4, elapsedMs + 350) / 1000).toFixed(1)} s`,
      cls: "estimado",
      tbt: "estimado",
      speedIndex: `${(Math.max(elapsedMs * 1.8, elapsedMs + 650) / 1000).toFixed(1)} s`,
    },
    requests,
    pageBytes: bytes,
    htmlBytes: bytes,
    statusHttp: status,
    source: "html_fallback",
    technicalErrors: [
      hasDescription ? null : "Meta description ausente",
      hasCanonical ? null : "Canonical ausente",
      requests > 60 ? "Muitos assets detectados no HTML" : null,
    ].filter(Boolean),
    reportUrl: url,
  };
}

async function fetchHtml(site, strategy) {
  const started = Date.now();
  const response = await fetch(site.url, { headers, redirect: "follow", signal: AbortSignal.timeout(45000) });
  const html = await response.text();
  return htmlFallback(response.url || site.url, strategy, html, Date.now() - started, response.status);
}

async function runPageSpeed(site, strategy) {
  const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  apiUrl.searchParams.set("url", site.url);
  apiUrl.searchParams.set("strategy", strategy);
  for (const category of categories) apiUrl.searchParams.append("category", category);
  if (process.env.PAGESPEED_API_KEY) apiUrl.searchParams.set("key", process.env.PAGESPEED_API_KEY);

  const response = await fetch(apiUrl, { signal: AbortSignal.timeout(60000) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || `PageSpeed HTTP ${response.status}`);

  const lighthouse = payload.lighthouseResult || {};
  const lighthouseCategories = lighthouse.categories || {};
  const audits = lighthouse.audits || {};
  const requests = audits["network-requests"]?.details?.items?.length || null;
  const totalBytes = audits["total-byte-weight"]?.numericValue || null;

  return {
    strategy,
    collectedAt: new Date().toISOString(),
    performance: clamp((lighthouseCategories.performance?.score ?? 0) * 100),
    accessibility: clamp((lighthouseCategories.accessibility?.score ?? 0) * 100),
    bestPractices: clamp((lighthouseCategories["best-practices"]?.score ?? 0) * 100),
    seo: clamp((lighthouseCategories.seo?.score ?? 0) * 100),
    coreWebVitals: {
      fcp: audits["first-contentful-paint"]?.displayValue || "",
      lcp: audits["largest-contentful-paint"]?.displayValue || "",
      cls: audits["cumulative-layout-shift"]?.displayValue || "",
      tbt: audits["total-blocking-time"]?.displayValue || "",
      speedIndex: audits["speed-index"]?.displayValue || "",
    },
    requests,
    pageBytes: totalBytes,
    source: "pagespeed_insights",
    technicalErrors: [
      audits["errors-in-console"]?.score === 1 ? null : "Erros no console detectados pelo Lighthouse",
      audits["server-response-time"]?.score === 1 ? null : "Tempo de resposta elevado",
      audits.redirects?.score === 1 ? null : "Redirecionamentos impactando carregamento",
    ].filter(Boolean),
    reportUrl: payload.id || site.url,
  };
}

async function collectStrategy(site, strategy) {
  try {
    return await runPageSpeed(site, strategy);
  } catch (error) {
    const fallback = await fetchHtml(site, strategy);
    return {
      ...fallback,
      warning: error.message,
    };
  }
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await fs.readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

const collectedAt = new Date().toISOString();
const cache = {
  updatedAt: collectedAt,
  brands: {},
};

for (const site of SITES) {
  cache.brands[site.id] = {
    mobile: await collectStrategy(site, "mobile"),
    desktop: await collectStrategy(site, "desktop"),
  };
}

await fs.mkdir("data", { recursive: true });
await fs.writeFile("data/pagespeed-cache.json", `${JSON.stringify(cache, null, 2)}\n`, "utf8");

const history = await readJson("data/pagespeed-history.json", { updatedAt: null, checks: [] });
history.updatedAt = collectedAt;
history.checks = [...(history.checks || []), cache];
await fs.writeFile("data/pagespeed-history.json", `${JSON.stringify(history, null, 2)}\n`, "utf8");

console.log(JSON.stringify(cache, null, 2));

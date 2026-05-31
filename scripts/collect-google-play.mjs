import fs from "node:fs/promises";

const BRANDS = [
  {
    id: "maxima",
    name: "Maxima Bet",
    detailsUrl: "https://play.google.com/store/apps/details?id=br.bet.maxima&hl=pt_BR",
  },
  {
    id: "ultra",
    name: "Ultra Bet",
    searchUrl: "https://play.google.com/store/search?q=ultra%20bet&c=apps&hl=pt_BR",
  },
  {
    id: "suprema",
    name: "Suprema Bet",
    searchUrl: "https://play.google.com/store/search?q=suprema%20bet&c=apps&hl=pt_BR",
  },
];

const headers = {
  "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
};

function decodeHtml(text = "") {
  return String(text)
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(text = "") {
  return decodeHtml(String(text).replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function parsePtMagnitude(text = "") {
  const normalized = stripTags(text).toLowerCase().replace(/\u00a0/g, " ");
  const match = normalized.match(/([\d.,]+)\s*(mil|mi|milh[aã]o|milh[oõ]es)?/i);
  if (!match) return null;
  const value = Number(match[1].replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(value)) return null;
  const unit = match[2] || "";
  if (unit === "mil") return Math.round(value * 1_000);
  if (unit === "mi" || unit.startsWith("milh")) return Math.round(value * 1_000_000);
  return Math.round(value);
}

function parseRating(text = "") {
  const match = stripTags(text).replace("star", "").match(/[\d.,]+/);
  if (!match) return null;
  const value = Number(match[0].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

async function fetchText(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

function firstAppIdFromSearch(html) {
  const ids = [...html.matchAll(/\/store\/apps\/details\?id=([^"&\\]+)/g)].map((match) => decodeURIComponent(match[1]));
  return ids.find((id, index) => ids.indexOf(id) === index) || null;
}

function extractStats(html) {
  const stats = [...html.matchAll(/<div class="ClM7O">([\s\S]*?)<\/div><div class="g1rdde">([\s\S]*?)<\/div>/g)]
    .map((match) => ({
      value: stripTags(match[1]),
      label: stripTags(match[2]),
    }));

  const ratingStat = stats.find((stat) => /avalia/i.test(stat.label));
  const downloadStat = stats.find((stat) => /download/i.test(stat.label));

  return {
    ratingText: ratingStat?.value.replace(/star/i, "").trim() || "",
    reviewsText: ratingStat?.label || "",
    downloadsText: downloadStat?.value || "",
    rating: parseRating(ratingStat?.value),
    reviewsApprox: parsePtMagnitude(ratingStat?.label),
    downloadsApprox: parsePtMagnitude(downloadStat?.value),
  };
}

async function collectBrand(brand) {
  let appId = null;
  let detailsUrl = brand.detailsUrl;

  if (brand.searchUrl) {
    const searchHtml = await fetchText(brand.searchUrl);
    appId = firstAppIdFromSearch(searchHtml);
    if (!appId) throw new Error("App nao encontrado na busca da Play Store");
    detailsUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(appId)}&hl=pt_BR`;
  } else {
    appId = new URL(detailsUrl).searchParams.get("id");
  }

  const detailsHtml = await fetchText(detailsUrl);
  return {
    ...brand,
    appId,
    detailsUrl,
    collectedOk: true,
    ...extractStats(detailsHtml),
  };
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await fs.readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

const collectedAt = new Date().toISOString();
const results = [];

for (const brand of BRANDS) {
  try {
    results.push(await collectBrand(brand));
  } catch (error) {
    results.push({
      ...brand,
      collectedOk: false,
      error: error.message,
    });
  }
}

const payload = {
  collectedAt,
  cadence: "daily",
  source: "Google Play public pages",
  brands: results,
};

await fs.mkdir("data", { recursive: true });
await fs.writeFile("data/google-play-metrics.json", `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const history = await readJson("data/google-play-history.json", { updatedAt: null, checks: [] });
history.updatedAt = collectedAt;
history.checks = [...(history.checks || []), payload].slice(-60);
await fs.writeFile("data/google-play-history.json", `${JSON.stringify(history, null, 2)}\n`, "utf8");

console.log(JSON.stringify(payload, null, 2));

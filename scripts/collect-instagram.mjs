import fs from "node:fs/promises";

const BRANDS = [
  { id: "maxima", name: "Maxima Bet", username: "maximabet.br", url: "https://www.instagram.com/maximabet.br/" },
  { id: "ultra", name: "Ultra Bet", username: "ultrabet.br", url: "https://www.instagram.com/ultrabet.br/" },
  { id: "suprema", name: "Suprema Bet", username: "supremabet.br", url: "https://www.instagram.com/supremabet.br/" },
];

const headers = {
  accept: "*/*",
  "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
  "x-ig-app-id": "936619743392459",
  "x-requested-with": "XMLHttpRequest",
};

function daysAgo(days) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function asIso(timestamp) {
  if (!timestamp) return null;
  return new Date(Number(timestamp) * 1000).toISOString();
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return null;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

function pct(value) {
  return value === null || value === undefined ? null : Number(value.toFixed(2));
}

async function collectBrand(brand) {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(brand.username)}`;
  const response = await fetch(url, {
    headers: {
      ...headers,
      referer: brand.url,
    },
  });
  if (!response.ok) throw new Error(`${brand.username}: HTTP ${response.status}`);

  const payload = await response.json();
  const user = payload.data?.user;
  if (!user) throw new Error(`${brand.username}: perfil nao encontrado`);

  const media = (user.edge_owner_to_timeline_media?.edges || [])
    .map((edge) => edge.node)
    .filter(Boolean);
  const followers = Number(user.edge_followed_by?.count || 0);
  const now7 = daysAgo(7);
  const now30 = daysAgo(30);
  const recentMedia = media.filter((item) => Number(item.taken_at_timestamp) * 1000 >= now30);
  const engagementItems = recentMedia.length ? recentMedia : media;
  const engagementTotal = engagementItems.reduce(
    (sum, item) => sum + Number(item.edge_liked_by?.count || 0) + Number(item.edge_media_to_comment?.count || 0),
    0,
  );
  const avgEngagement = engagementItems.length && followers ? (engagementTotal / engagementItems.length / followers) * 100 : null;
  const videoViews = recentMedia
    .map((item) => Number(item.video_view_count || item.video_play_count || NaN))
    .filter((value) => Number.isFinite(value));
  const lastTimestamp = Math.max(...media.map((item) => Number(item.taken_at_timestamp || 0)));

  return {
    ...brand,
    collectedOk: true,
    followers,
    mediaCount: Number(user.edge_owner_to_timeline_media?.count || 0),
    posts7: media.filter((item) => Number(item.taken_at_timestamp) * 1000 >= now7).length,
    posts30: recentMedia.length,
    avgViews: average(videoViews),
    engagementRate: pct(avgEngagement),
    lastPostDate: asIso(lastTimestamp),
    sampledPosts: media.length,
    source: "instagram_public_web_profile_info",
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
const brands = [];

for (const brand of BRANDS) {
  try {
    brands.push(await collectBrand(brand));
  } catch (error) {
    brands.push({
      ...brand,
      collectedOk: false,
      error: error.message,
    });
  }
}

const payload = {
  collectedAt,
  cadence: "daily",
  source: "Instagram public web profile endpoint",
  note: "posts7/posts30 e avgViews usam a amostra publica retornada pelo endpoint web do Instagram.",
  brands,
};

await fs.mkdir("data", { recursive: true });
await fs.writeFile("data/instagram-metrics.json", `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const history = await readJson("data/instagram-history.json", { updatedAt: null, checks: [] });
history.updatedAt = collectedAt;
history.checks = [...(history.checks || []), payload];
await fs.writeFile("data/instagram-history.json", `${JSON.stringify(history, null, 2)}\n`, "utf8");

console.log(JSON.stringify(payload, null, 2));

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SOURCES = [
  "instagram_graph",
  "youtube_data",
  "tiktok_business",
  "hugme_reclame_aqui",
  "google_play",
  "app_store_connect",
  "news_risk",
  "manual",
];

const TABLE_FIELDS = [
  "brand_id",
  "source",
  "followers",
  "engagement_rate",
  "posts_7d",
  "posts_30d",
  "avg_views",
  "last_post_date",
  "social_score",
  "reputation_score",
  "complaints_7d",
  "complaints_30d",
  "google_reviews",
  "app_name",
  "app_rating",
  "app_reviews",
  "app_version",
  "app_last_update",
  "sentiment_score",
  "risk_terms",
  "raw_payload",
  "collected_at",
];

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function envNameFor(brandId, suffix) {
  return `${suffix}_${brandId.toUpperCase()}`;
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp(value, min = 0, max = 100) {
  const number = asNumber(value);
  if (number === null) return null;
  return Math.max(min, Math.min(max, number));
}

function scoreFromSocial({ followers, engagement_rate, posts_30d, avg_views }) {
  const followerScore = Math.min(35, (Number(followers || 0) / 100000) * 35);
  const engagementScore = Math.min(30, Number(engagement_rate || 0) * 6);
  const postingScore = Math.min(20, Number(posts_30d || 0) * 2);
  const viewsScore = Math.min(15, (Number(avg_views || 0) / 100000) * 15);
  return Math.round(followerScore + engagementScore + postingScore + viewsScore);
}

function scoreFromReputation({ complaints_30d, sentiment_score }) {
  const complaints = Number(complaints_30d || 0);
  const sentiment = asNumber(sentiment_score);
  const base = sentiment !== null ? (sentiment + 1) * 50 : 75;
  return clamp(Math.round(base - Math.min(45, complaints * 2)), 0, 100);
}

function emptyRow(brandId, source, rawPayload = {}, status = "not_connected") {
  return {
    brand_id: brandId,
    source,
    followers: null,
    engagement_rate: null,
    posts_7d: null,
    posts_30d: null,
    avg_views: null,
    last_post_date: null,
    social_score: null,
    reputation_score: null,
    complaints_7d: null,
    complaints_30d: null,
    google_reviews: null,
    app_name: null,
    app_rating: null,
    app_reviews: null,
    app_version: null,
    app_last_update: null,
    sentiment_score: null,
    risk_terms: [],
    raw_payload: { status, ...rawPayload },
    collected_at: new Date().toISOString(),
  };
}

function normalizeRow(row) {
  const normalized = Object.fromEntries(TABLE_FIELDS.map((field) => [field, row[field] ?? null]));
  normalized.risk_terms = Array.isArray(row.risk_terms) ? row.risk_terms : [];
  normalized.raw_payload = row.raw_payload || {};
  normalized.collected_at = row.collected_at || new Date().toISOString();
  return normalized;
}

function dateDaysAgo(days) {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

function postsSince(items, days, dateGetter) {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return items.filter((item) => new Date(dateGetter(item)).getTime() >= since).length;
}

function latestDate(items, dateGetter) {
  const dates = items.map((item) => new Date(dateGetter(item)).getTime()).filter(Number.isFinite);
  if (!dates.length) return null;
  return new Date(Math.max(...dates)).toISOString().slice(0, 10);
}

function getEnvOrConfig(config, key, fallback = "") {
  const value = config?.[key];
  if (typeof value === "string" && value.startsWith("env:")) return process.env[value.slice(4)] || fallback;
  return value || fallback;
}

function getBrandValue(globalConfig, brand, key, envPrefix) {
  const brandConfig = globalConfig?.brands?.[brand.id] || {};
  return brandConfig[key] || process.env[envNameFor(brand.id, envPrefix)] || "";
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(options.timeoutMs || 25000),
  });
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { text };
  }
  if (!response.ok) {
    throw new Error(payload.error?.message || payload.message || `HTTP ${response.status}`);
  }
  return payload;
}

function buildAppStoreJwt({ keyId, issuerId, privateKey }) {
  const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: issuerId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60,
      aud: "appstoreconnect-v1",
    }),
  ).toString("base64url");
  const signer = crypto.createSign("SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = signer.sign(privateKey).toString("base64url");
  return `${header}.${payload}.${signature}`;
}

function createIntegrationService({ dataDir, sites, manualPath }) {
  const tablePath = path.join(dataDir, "external_brand_metrics.json");
  const configPath = path.join(dataDir, "integration-config.json");

  function readTable() {
    return readJson(tablePath, {
      table: "external_brand_metrics",
      schemaVersion: 1,
      fields: TABLE_FIELDS,
      updatedAt: null,
      rows: [],
    });
  }

  function writeTable(table) {
    table.table = "external_brand_metrics";
    table.schemaVersion = 1;
    table.fields = TABLE_FIELDS;
    table.updatedAt = new Date().toISOString();
    table.rows = (table.rows || []).map(normalizeRow).slice(-10000);
    writeJson(tablePath, table);
  }

  function readConfig() {
    return readJson(configPath, {
      updatedAt: null,
      sources: {
        instagram_graph: { enabled: true, tokenEnv: "INSTAGRAM_GRAPH_TOKEN" },
        youtube_data: { enabled: true, apiKeyEnv: "YOUTUBE_API_KEY" },
        tiktok_business: { enabled: true, tokenEnv: "TIKTOK_BUSINESS_TOKEN", endpoint: "" },
        hugme_reclame_aqui: { enabled: true, tokenEnv: "HUGME_API_TOKEN", endpoint: "" },
        google_play: { enabled: true, tokenEnv: "GOOGLE_PLAY_ACCESS_TOKEN" },
        app_store_connect: {
          enabled: true,
          keyIdEnv: "APP_STORE_CONNECT_KEY_ID",
          issuerIdEnv: "APP_STORE_CONNECT_ISSUER_ID",
          privateKeyEnv: "APP_STORE_CONNECT_PRIVATE_KEY",
          privateKeyPathEnv: "APP_STORE_CONNECT_PRIVATE_KEY_PATH",
        },
        news_risk: { enabled: true, newsApiKeyEnv: "NEWS_API_KEY", serpApiKeyEnv: "SERPAPI_KEY" },
      },
      brands: Object.fromEntries(
        sites.map((site) => [
          site.id,
          {
            search_query: `${site.alias || site.nome} saque bloqueado reclamação não paga suporte`,
          },
        ]),
      ),
    });
  }

  function sourceStatus() {
    const config = readConfig();
    return SOURCES.map((source) => {
      if (source === "manual") {
        return { source, enabled: true, connected: true, mode: "fallback_manual" };
      }
      const sourceConfig = config.sources?.[source] || {};
      const envKeys = Object.entries(sourceConfig)
        .filter(([key]) => /Env$/.test(key))
        .map(([, value]) => value)
        .filter(Boolean);
      const hasAnySecret = envKeys.some((envKey) => Boolean(process.env[envKey]));
      const brandFields = {
        instagram_graph: "instagram_business_id",
        youtube_data: "youtube_channel_id",
        tiktok_business: "tiktok_business_id",
        hugme_reclame_aqui: "hugme_company_id",
        google_play: "google_play_package",
        app_store_connect: "app_store_app_id",
        news_risk: "search_query",
      }[source];
      const configuredBrands = sites.filter((brand) => Boolean(config.brands?.[brand.id]?.[brandFields])).map((brand) => brand.id);
      const connected = source === "news_risk" ? hasAnySecret : hasAnySecret && configuredBrands.length > 0;
      return {
        source,
        enabled: sourceConfig.enabled !== false,
        connected,
        configuredBrands,
        envKeys,
        mode: connected ? "api" : "manual_fallback",
      };
    });
  }

  async function collectInstagram(brand, config) {
    const source = "instagram_graph";
    const sourceConfig = config.sources?.[source] || {};
    const token = process.env[sourceConfig.tokenEnv || "INSTAGRAM_GRAPH_TOKEN"];
    const accountId = getBrandValue(config, brand, "instagram_business_id", "INSTAGRAM_BUSINESS_ID");
    if (!token || !accountId) return emptyRow(brand.id, source, { missing: ["INSTAGRAM_GRAPH_TOKEN", "instagram_business_id"] });

    const url = new URL(`https://graph.facebook.com/v19.0/${accountId}`);
    url.searchParams.set("fields", "followers_count,media_count,media.limit(50){timestamp,like_count,comments_count,media_type,permalink}");
    url.searchParams.set("access_token", token);
    const payload = await fetchJson(url);
    const media = payload.media?.data || [];
    const engagementTotal = media.reduce((sum, item) => sum + Number(item.like_count || 0) + Number(item.comments_count || 0), 0);
    const avgEngagement = media.length && payload.followers_count ? (engagementTotal / media.length / payload.followers_count) * 100 : null;
    return normalizeRow({
      ...emptyRow(brand.id, source, payload, "connected"),
      followers: asNumber(payload.followers_count),
      engagement_rate: avgEngagement === null ? null : Number(avgEngagement.toFixed(2)),
      posts_7d: postsSince(media, 7, (item) => item.timestamp),
      posts_30d: postsSince(media, 30, (item) => item.timestamp),
      avg_views: null,
      last_post_date: latestDate(media, (item) => item.timestamp),
      social_score: scoreFromSocial({
        followers: payload.followers_count,
        engagement_rate: avgEngagement,
        posts_30d: postsSince(media, 30, (item) => item.timestamp),
      }),
    });
  }

  async function collectYoutube(brand, config) {
    const source = "youtube_data";
    const sourceConfig = config.sources?.[source] || {};
    const apiKey = process.env[sourceConfig.apiKeyEnv || "YOUTUBE_API_KEY"];
    const channelId = getBrandValue(config, brand, "youtube_channel_id", "YOUTUBE_CHANNEL_ID");
    if (!apiKey || !channelId) return emptyRow(brand.id, source, { missing: ["YOUTUBE_API_KEY", "youtube_channel_id"] });

    const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelUrl.searchParams.set("part", "statistics,snippet");
    channelUrl.searchParams.set("id", channelId);
    channelUrl.searchParams.set("key", apiKey);
    const channelPayload = await fetchJson(channelUrl);
    const channel = channelPayload.items?.[0] || {};

    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("channelId", channelId);
    searchUrl.searchParams.set("publishedAfter", dateDaysAgo(30));
    searchUrl.searchParams.set("maxResults", "50");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("order", "date");
    searchUrl.searchParams.set("key", apiKey);
    const searchPayload = await fetchJson(searchUrl);
    const videos = searchPayload.items || [];
    const videoIds = videos.map((item) => item.id?.videoId).filter(Boolean);
    let avgViews = null;
    if (videoIds.length) {
      const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      videosUrl.searchParams.set("part", "statistics");
      videosUrl.searchParams.set("id", videoIds.join(","));
      videosUrl.searchParams.set("key", apiKey);
      const videosPayload = await fetchJson(videosUrl);
      const views = (videosPayload.items || []).map((item) => Number(item.statistics?.viewCount || 0));
      avgViews = views.length ? Math.round(views.reduce((sum, value) => sum + value, 0) / views.length) : null;
    }
    const followers = asNumber(channel.statistics?.subscriberCount);
    const posts30 = postsSince(videos, 30, (item) => item.snippet?.publishedAt);
    return normalizeRow({
      ...emptyRow(brand.id, source, { channel: channelPayload, videos: searchPayload }, "connected"),
      followers,
      posts_7d: postsSince(videos, 7, (item) => item.snippet?.publishedAt),
      posts_30d: posts30,
      avg_views: avgViews,
      last_post_date: latestDate(videos, (item) => item.snippet?.publishedAt),
      social_score: scoreFromSocial({ followers, posts_30d: posts30, avg_views: avgViews }),
    });
  }

  async function collectGenericBusiness(brand, config, source, tokenEnv, idKey, envPrefix, parser) {
    const sourceConfig = config.sources?.[source] || {};
    const token = process.env[sourceConfig.tokenEnv || tokenEnv];
    const id = getBrandValue(config, brand, idKey, envPrefix);
    const endpoint = sourceConfig.endpoint || "";
    if (!token || !id || !endpoint) return emptyRow(brand.id, source, { missing: [sourceConfig.tokenEnv || tokenEnv, idKey, "endpoint"] });
    const endpointUrl = new URL(endpoint);
    endpointUrl.searchParams.set(idKey, id);
    const payload = await fetchJson(endpointUrl, { headers: { Authorization: `Bearer ${token}` } });
    return normalizeRow({ ...emptyRow(brand.id, source, payload, "connected"), ...parser(payload) });
  }

  async function collectTikTok(brand, config) {
    return collectGenericBusiness(brand, config, "tiktok_business", "TIKTOK_BUSINESS_TOKEN", "tiktok_business_id", "TIKTOK_BUSINESS_ID", (payload) => {
      const data = payload.data || payload;
      const followers = asNumber(data.followers || data.followers_count);
      const posts30 = asNumber(data.posts_30d || data.video_count_30d);
      return {
        followers,
        engagement_rate: asNumber(data.engagement_rate),
        posts_7d: asNumber(data.posts_7d),
        posts_30d: posts30,
        avg_views: asNumber(data.avg_views || data.average_views),
        last_post_date: data.last_post_date || null,
        social_score: scoreFromSocial({ followers, engagement_rate: data.engagement_rate, posts_30d: posts30, avg_views: data.avg_views }),
      };
    });
  }

  async function collectHugMe(brand, config) {
    return collectGenericBusiness(brand, config, "hugme_reclame_aqui", "HUGME_API_TOKEN", "hugme_company_id", "HUGME_COMPANY_ID", (payload) => {
      const data = payload.data || payload;
      const complaints7 = asNumber(data.complaints_7d || data.complaintsLast7Days);
      const complaints30 = asNumber(data.complaints_30d || data.complaintsLast30Days);
      const sentiment = asNumber(data.sentiment_score || data.sentiment);
      return {
        reputation_score: asNumber(data.reputation_score) || scoreFromReputation({ complaints_30d: complaints30, sentiment_score: sentiment }),
        complaints_7d: complaints7,
        complaints_30d: complaints30,
        sentiment_score: sentiment,
        risk_terms: Array.isArray(data.risk_terms) ? data.risk_terms : [],
      };
    });
  }

  async function collectGooglePlay(brand, config) {
    const source = "google_play";
    const sourceConfig = config.sources?.[source] || {};
    const token = process.env[sourceConfig.tokenEnv || "GOOGLE_PLAY_ACCESS_TOKEN"];
    const packageName = getBrandValue(config, brand, "google_play_package", "GOOGLE_PLAY_PACKAGE");
    if (!token || !packageName) return emptyRow(brand.id, source, { missing: ["GOOGLE_PLAY_ACCESS_TOKEN", "google_play_package"] });
    const url = new URL(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/reviews`);
    url.searchParams.set("maxResults", "100");
    const payload = await fetchJson(url, { headers: { Authorization: `Bearer ${token}` } });
    const reviews = payload.reviews || [];
    const ratings = reviews
      .map((review) => review.comments?.find((comment) => comment.userComment)?.userComment?.starRating)
      .filter((rating) => Number.isFinite(Number(rating)))
      .map(Number);
    const appRating = ratings.length ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2)) : null;
    return normalizeRow({
      ...emptyRow(brand.id, source, payload, "connected"),
      app_name: packageName,
      app_rating: appRating,
      app_reviews: reviews.length,
      app_last_update: latestDate(reviews, (review) => review.comments?.[0]?.userComment?.lastModified?.seconds ? Number(review.comments[0].userComment.lastModified.seconds) * 1000 : null),
      sentiment_score: appRating ? Number(((appRating - 3) / 2).toFixed(2)) : null,
    });
  }

  async function collectAppStore(brand, config) {
    const source = "app_store_connect";
    const sourceConfig = config.sources?.[source] || {};
    const appId = getBrandValue(config, brand, "app_store_app_id", "APP_STORE_APP_ID");
    const keyId = process.env[sourceConfig.keyIdEnv || "APP_STORE_CONNECT_KEY_ID"];
    const issuerId = process.env[sourceConfig.issuerIdEnv || "APP_STORE_CONNECT_ISSUER_ID"];
    const privateKeyPath = process.env[sourceConfig.privateKeyPathEnv || "APP_STORE_CONNECT_PRIVATE_KEY_PATH"];
    const privateKeyRaw = process.env[sourceConfig.privateKeyEnv || "APP_STORE_CONNECT_PRIVATE_KEY"] || (privateKeyPath && fs.existsSync(privateKeyPath) ? fs.readFileSync(privateKeyPath, "utf8") : "");
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
    if (!appId || !keyId || !issuerId || !privateKey) return emptyRow(brand.id, source, { missing: ["app_store_app_id", "APP_STORE_CONNECT_KEY_ID", "APP_STORE_CONNECT_ISSUER_ID", "APP_STORE_CONNECT_PRIVATE_KEY"] });
    const jwt = buildAppStoreJwt({ keyId, issuerId, privateKey });
    const reviewsUrl = new URL(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/customerReviews`);
    reviewsUrl.searchParams.set("limit", "200");
    reviewsUrl.searchParams.set("sort", "-createdDate");
    const payload = await fetchJson(reviewsUrl, { headers: { Authorization: `Bearer ${jwt}` } });
    const reviews = payload.data || [];
    const ratings = reviews.map((review) => Number(review.attributes?.rating)).filter(Number.isFinite);
    const appRating = ratings.length ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2)) : null;
    return normalizeRow({
      ...emptyRow(brand.id, source, payload, "connected"),
      app_name: brand.nome,
      app_rating: appRating,
      app_reviews: reviews.length,
      app_last_update: latestDate(reviews, (review) => review.attributes?.createdDate),
      sentiment_score: appRating ? Number(((appRating - 3) / 2).toFixed(2)) : null,
    });
  }

  async function collectNewsRisk(brand, config) {
    const source = "news_risk";
    const sourceConfig = config.sources?.[source] || {};
    const query = getBrandValue(config, brand, "search_query", "NEWS_QUERY") || `${brand.alias || brand.nome} reclamação saque bloqueado não paga`;
    const newsApiKey = process.env[sourceConfig.newsApiKeyEnv || "NEWS_API_KEY"];
    const serpApiKey = process.env[sourceConfig.serpApiKeyEnv || "SERPAPI_KEY"];
    if (!newsApiKey && !serpApiKey) return emptyRow(brand.id, source, { missing: ["NEWS_API_KEY or SERPAPI_KEY"], query });
    let payload;
    if (newsApiKey) {
      const url = new URL("https://newsapi.org/v2/everything");
      url.searchParams.set("q", query);
      url.searchParams.set("language", "pt");
      url.searchParams.set("sortBy", "publishedAt");
      url.searchParams.set("pageSize", "30");
      url.searchParams.set("apiKey", newsApiKey);
      payload = await fetchJson(url);
    } else {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "google_news");
      url.searchParams.set("q", query);
      url.searchParams.set("api_key", serpApiKey);
      payload = await fetchJson(url);
    }
    const articles = payload.articles || payload.news_results || [];
    const riskTerms = ["golpe", "saque", "bloqueado", "reclamação", "reclamacao", "não paga", "nao paga", "demora", "suporte"];
    const text = JSON.stringify(articles).toLowerCase();
    const found = riskTerms.filter((term) => text.includes(term.toLowerCase()));
    const sentiment = found.length ? -Math.min(1, found.length / 5) : 0.15;
    return normalizeRow({
      ...emptyRow(brand.id, source, payload, "connected"),
      reputation_score: scoreFromReputation({ complaints_30d: articles.length, sentiment_score: sentiment }),
      complaints_7d: null,
      complaints_30d: articles.length,
      sentiment_score: sentiment,
      risk_terms: found,
    });
  }

  function collectManual(brand) {
    const manual = readJson(manualPath, { brands: {} }).brands?.[brand.id] || {};
    const followers = asNumber(manual.followers);
    const engagement = asNumber(manual.engagement);
    const hasSocialInput = [manual.followers, manual.engagement, manual.posts30, manual.avgViews, manual.socialScore].some((value) => value !== undefined && value !== null && value !== "");
    const socialScore = asNumber(manual.socialScore) ?? (hasSocialInput
      ? scoreFromSocial({
          followers,
          engagement_rate: engagement,
          posts_30d: manual.posts30,
          avg_views: manual.avgViews,
        })
      : null);
    const appRating = asNumber(manual.appRating);
    return normalizeRow({
      ...emptyRow(brand.id, "manual", manual, "manual"),
      followers,
      engagement_rate: engagement,
      posts_7d: asNumber(manual.posts7),
      posts_30d: asNumber(manual.posts30),
      avg_views: asNumber(manual.avgViews),
      last_post_date: manual.lastPost || null,
      social_score: asNumber(manual.socialScore) ?? socialScore,
      reputation_score: asNumber(manual.reputationScore),
      complaints_7d: asNumber(manual.complaints7),
      complaints_30d: asNumber(manual.complaints30),
      google_reviews: asNumber(manual.googleReviews),
      app_name: manual.appName || null,
      app_rating: appRating,
      app_reviews: asNumber(manual.appReviews),
      app_version: manual.appVersion || null,
      app_last_update: manual.appUpdatedAt || null,
      sentiment_score: asNumber(manual.sentimentScore),
      risk_terms: String(manual.riskNotes || "")
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    });
  }

  async function runSourceForBrand(source, brand, config) {
    try {
      if (source === "instagram_graph") return await collectInstagram(brand, config);
      if (source === "youtube_data") return await collectYoutube(brand, config);
      if (source === "tiktok_business") return await collectTikTok(brand, config);
      if (source === "hugme_reclame_aqui") return await collectHugMe(brand, config);
      if (source === "google_play") return await collectGooglePlay(brand, config);
      if (source === "app_store_connect") return await collectAppStore(brand, config);
      if (source === "news_risk") return await collectNewsRisk(brand, config);
      if (source === "manual") return collectManual(brand);
      return emptyRow(brand.id, source, { message: "Fonte desconhecida" }, "error");
    } catch (error) {
      return emptyRow(brand.id, source, { error: error.message }, "error");
    }
  }

  async function runAll({ persist = true } = {}) {
    const config = readConfig();
    const enabledSources = SOURCES.filter((source) => source === "manual" || config.sources?.[source]?.enabled !== false);
    const rows = [];
    for (const source of enabledSources) {
      for (const brand of sites) {
        rows.push(await runSourceForBrand(source, brand, config));
      }
    }
    if (persist) {
      const table = readTable();
      table.rows = [...(table.rows || []), ...rows];
      writeTable(table);
    }
    return {
      collectedAt: new Date().toISOString(),
      rows,
      status: sourceStatus(),
      table: persist ? readTable() : undefined,
    };
  }

  function latestByBrandSource() {
    const table = readTable();
    const latest = {};
    for (const row of table.rows || []) {
      const key = `${row.brand_id}:${row.source}`;
      const current = latest[key];
      if (!current || new Date(row.collected_at) > new Date(current.collected_at)) latest[key] = row;
    }
    return latest;
  }

  function aggregateLatestMetrics() {
    const latest = latestByBrandSource();
    const output = {};
    for (const brand of sites) {
      const rows = SOURCES.map((source) => latest[`${brand.id}:${source}`]).filter(Boolean);
      const merged = { brand_id: brand.id, sources: rows.map((row) => row.source) };
      for (const field of TABLE_FIELDS) {
        if (["brand_id", "source", "raw_payload", "collected_at"].includes(field)) continue;
        const best = rows.find((row) => row[field] !== null && row[field] !== undefined && row[field] !== "" && !(Array.isArray(row[field]) && !row[field].length));
        if (best) merged[field] = best[field];
      }
      output[brand.id] = merged;
    }
    return output;
  }

  function comparativePayload() {
    return {
      table: readTable(),
      status: sourceStatus(),
      latestByBrandSource: latestByBrandSource(),
      latestByBrand: aggregateLatestMetrics(),
      fields: TABLE_FIELDS,
    };
  }

  return {
    tablePath,
    configPath,
    sources: SOURCES,
    fields: TABLE_FIELDS,
    readConfig,
    readTable,
    sourceStatus,
    runAll,
    latestByBrandSource,
    aggregateLatestMetrics,
    comparativePayload,
  };
}

module.exports = { createIntegrationService, SOURCES, TABLE_FIELDS };

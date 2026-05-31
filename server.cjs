const http = require("http");
const fs = require("fs");
const path = require("path");
const dns = require("dns");
const tls = require("tls");
const crypto = require("crypto");
const { createIntegrationService } = require("./integrations.cjs");

const root = __dirname;
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 64869);
const dataDir = path.join(root, "data");
const benchmarkPath = path.join(dataDir, "benchmarking.json");
const historyPath = path.join(dataDir, "external-ceo-history.json");
const manualPath = path.join(dataDir, "manual-inputs.json");
const pagespeedPath = path.join(dataDir, "pagespeed-cache.json");

const SCORE_WEIGHTS = {
  tecnico: 0.25,
  social: 0.2,
  seo: 0.15,
  reputacao: 0.15,
  jornada: 0.1,
  promocoes: 0.1,
  compliance: 0.05,
};

const sites = [
  { id: "maxima", nome: "Maxima Bet", alias: "maxima.bet", url: "https://www.maxima.bet.br/" },
  { id: "ultra", nome: "Ultra Bet", alias: "ultra.bet", url: "https://www.ultra.bet.br/" },
  { id: "suprema", nome: "Suprema Bet", alias: "suprema.bet", url: "https://www.suprema.bet.br/" },
];

const integrationService = createIntegrationService({ dataDir, sites, manualPath });

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
};

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function send(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload, null, 2), "application/json; charset=utf-8");
}

function lerBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Payload muito grande"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function clamp(valor, min = 0, max = 100) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return min;
  return Math.max(min, Math.min(max, numero));
}

function media(valores) {
  const validos = valores.filter((valor) => Number.isFinite(Number(valor)));
  if (!validos.length) return null;
  return validos.reduce((soma, valor) => soma + Number(valor), 0) / validos.length;
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function decodeEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function textoLimpo(text) {
  return decodeEntities(String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function extrairPrimeiro(html, regex) {
  const match = html.match(regex);
  return textoLimpo(match?.[1] || "");
}

function extrairMeta(html, chave, atributo = "name") {
  const direto = new RegExp(`<meta[^>]+${atributo}=["']${chave}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i");
  const inverso = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${atributo}=["']${chave}["'][^>]*>`, "i");
  return textoLimpo(html.match(direto)?.[1] || html.match(inverso)?.[1] || "");
}

function normalizarValorMoeda(valor) {
  const limpo = String(valor || "")
    .replace(/[^\d,.]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : 0;
}

function somarValores(regex, html) {
  let total = 0;
  let match;
  while ((match = regex.exec(html))) {
    total += normalizarValorMoeda(match[1]);
  }
  return total;
}

function somarJogos(html) {
  let total = 0;
  let match;
  const regexes = [
    /Show\s+([\d,.]+)\s+games?/gi,
    /games_count[^0-9]{1,18}(\d+)/gi,
  ];

  for (const regex of regexes) {
    while ((match = regex.exec(html))) {
      total += Number(String(match[1]).replace(/[^\d]/g, "")) || 0;
    }
  }

  return total;
}

function coletarCategorias(html) {
  const categorias = new Set();
  const termos = [
    ["Slots", "Slots"],
    ["Live Casino", "Cassino ao vivo"],
    ["Sports", "Esportes"],
    ["Live Sports", "Esportes ao vivo"],
    ["Top Paying Today", "Pagou mais hoje"],
    ["Popular Games", "Jogos populares"],
    ["Crash Games", "Jogos crash"],
    ["New Games", "Novos jogos"],
    ["Top 10 Brazil", "Top 10 Brasil"],
    ["Responsible Gaming", "Jogo responsavel"],
  ];

  for (const [termo, rotulo] of termos) {
    if (new RegExp(termo, "i").test(html)) categorias.add(rotulo);
  }

  return Array.from(categorias);
}

function contarLinksLegais(html) {
  const termos = [
    "General Terms",
    "Terms",
    "Privacy Policy",
    "Cookie Policy",
    "Bonus Terms",
    "Sports Betting Rules",
    "Anti-Money Laundering",
    "Responsible Gaming",
    "Ombudsman",
  ];

  return termos.reduce((total, termo) => total + (new RegExp(termo, "i").test(html) ? 1 : 0), 0);
}

function extrairLinks(html) {
  const links = [];
  const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) && links.length < 400) {
    links.push({ href: decodeEntities(match[1]), texto: textoLimpo(match[2]) });
  }
  return links;
}

function linkContem(links, termos) {
  const regex = new RegExp(termos.join("|"), "i");
  return links.some((link) => regex.test(`${link.href} ${link.texto}`));
}

function extrairSocialLinks(html) {
  const mapa = {
    instagram: /instagram\.com/i,
    tiktok: /tiktok\.com/i,
    twitter: /(twitter\.com|x\.com)/i,
    youtube: /youtube\.com/i,
    linkedin: /linkedin\.com/i,
  };
  const links = extrairLinks(html);
  return Object.fromEntries(
    Object.entries(mapa).map(([rede, regex]) => {
      const achado = links.find((link) => regex.test(link.href));
      return [rede, achado?.href || ""];
    }),
  );
}

function extrairBanners(html, baseUrl) {
  const banners = [];
  const regex = /<img\b[^>]*(?:alt=["']([^"']*)["'])?[^>]*(?:src=["']([^"']+)["'])?[^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) && banners.length < 10) {
    const alt = textoLimpo(match[1] || "");
    const src = match[2] || "";
    const texto = `${alt} ${src}`;
    if (/promo|bonus|banner|cassino|casino|sport|aposta|bet/i.test(texto)) {
      try {
        banners.push({ alt, src: src ? new URL(src, baseUrl).href : "" });
      } catch {
        banners.push({ alt, src });
      }
    }
  }
  return banners;
}

function contarTermos(html, termos) {
  return termos.map((termo) => {
    const regex = new RegExp(termo, "gi");
    return { termo, total: (html.match(regex) || []).length };
  });
}

function extrairSeo(html, baseUrl) {
  const links = extrairLinks(html);
  const title = extrairPrimeiro(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = extrairMeta(html, "description");
  const h1 = extrairPrimeiro(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || "";
  const schema = /application\/ld\+json|schema\.org/i.test(html);
  const openGraph = (html.match(/property=["']og:/gi) || []).length;
  const scoreChecks = [
    Boolean(title),
    Boolean(metaDescription),
    Boolean(h1),
    Boolean(canonical),
    schema,
    openGraph > 0,
    linkContem(links, ["robots.txt", "sitemap.xml"]),
  ];

  return {
    title,
    metaDescription,
    h1,
    canonical: canonical ? new URL(canonical, baseUrl).href : "",
    schemaOrg: schema,
    openGraph,
    scoreBase: Math.round((scoreChecks.filter(Boolean).length / scoreChecks.length) * 100),
  };
}

function extrairCompliance(html, links) {
  const texto = textoLimpo(html);
  const checks = {
    cnpj: /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/.test(texto),
    licenca: /SPA\/MF|Secretaria|Ministry of Finance|autorizad|licen[cç]a/i.test(texto),
    termos: /Terms|Termos|Condicoes|Condi[cç][oõ]es/i.test(texto) || linkContem(links, ["terms", "termos"]),
    privacidade: /Privacy|Privacidade/i.test(texto) || linkContem(links, ["privacy", "privacidade"]),
    cookies: /Cookie/i.test(texto) || linkContem(links, ["cookie"]),
    jogoResponsavel: /Responsible Gaming|Jogo Responsavel|Jogo Responsável/i.test(texto) || linkContem(links, ["responsible", "responsavel"]),
    regrasBonus: /Bonus Terms|Regras de Bonus|B[oô]nus/i.test(texto) || linkContem(links, ["bonus"]),
    regrasSaque: /Withdrawal|Saque|Withdraw/i.test(texto) || linkContem(links, ["withdraw", "saque"]),
    suporte: /Support|Suporte|Ajuda|Help/i.test(texto) || linkContem(links, ["support", "help", "ajuda"]),
    aviso18: /18\+|maiores de 18|underage/i.test(texto),
  };
  const total = Object.values(checks).filter(Boolean).length;
  return {
    checks,
    score: Math.round((total / Object.keys(checks).length) * 100),
  };
}

function extrairJornada(html, links) {
  const checks = {
    home: true,
    cadastro: /Register|Cadastro|Cadastre|Criar conta/i.test(html) || linkContem(links, ["register", "cadastro", "signup"]),
    login: /Login|Entrar/i.test(html) || linkContem(links, ["login", "entrar"]),
    cassino: /Casino|Cassino/i.test(html) || linkContem(links, ["casino", "cassino"]),
    sportsbook: /Sports|Esportes|Apostas esportivas/i.test(html) || linkContem(links, ["sports", "esportes", "sportbook", "sportsbook"]),
    promocoes: /Promo|Bonus|B[oô]nus/i.test(html) || linkContem(links, ["promo", "bonus"]),
    suporte: /Support|Suporte|Help|Ajuda/i.test(html) || linkContem(links, ["support", "help", "ajuda"]),
    termos: /Terms|Termos/i.test(html) || linkContem(links, ["terms", "termos"]),
    privacidade: /Privacy|Privacidade/i.test(html) || linkContem(links, ["privacy", "privacidade"]),
    jogoResponsavel: /Responsible Gaming|Jogo Responsavel|Jogo Responsável/i.test(html) || linkContem(links, ["responsible", "responsavel"]),
  };
  const total = Object.values(checks).filter(Boolean).length;
  return {
    checks,
    score: Math.round((total / Object.keys(checks).length) * 100),
    playwright: {
      status: "pendente",
      runner: "public-journey-audit.mjs",
      passos: ["home", "cadastro", "login", "cassino", "sportsbook", "promocoes", "suporte", "termos", "privacidade", "jogo responsavel"],
    },
  };
}

function extrairPromocoes(html, baseUrl) {
  const termos = contarTermos(html, ["bonus", "bônus", "promo", "promocao", "promoção", "freebet", "cassino", "casino", "sportsbook"]);
  const totalTermos = termos.reduce((soma, item) => soma + item.total, 0);
  const banners = extrairBanners(html, baseUrl);
  return {
    banners,
    termos,
    bonusCadastro: /welcome bonus|bonus de cadastro|b[oô]nus de cadastro|register bonus/i.test(html),
    campanhasCassino: /casino|cassino|slots/i.test(html),
    campanhasSportsbook: /sportsbook|sports|esportes/i.test(html),
    contentHash: crypto.createHash("sha1").update(html.slice(0, 250_000)).digest("hex"),
    score: clamp(Math.round(Math.min(100, banners.length * 12 + totalTermos * 2))),
  };
}

function extrairMetricas(html, baseUrl) {
  const links = extrairLinks(html);
  const titulo = extrairPrimeiro(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const totalPagoHoje =
    somarValores(/Paid today\s*R\$\s*([\d.,\s\u00a0]+)/gi, html) +
    somarValores(/Pagou hoje[\s\S]{0,140}?R\$\s*([\d.,\s\u00a0]+)/gi, html);
  const totalJogosDetectados = somarJogos(html);
  const categorias = coletarCategorias(html);
  const linksLegais = contarLinksLegais(html);
  const possuiLogin = /Login/i.test(html);
  const possuiCadastro = /Register|Cadastre|Cadastro/i.test(html);
  const possuiSuporte = /Live Support|Help Center|Ajuda|Suporte/i.test(html);
  const possuiLicenca = /SPA\/MF|Ministry of Finance|Secretariat|Autoriz/i.test(html);
  const alertas = [];

  if (!totalJogosDetectados) alertas.push("Nenhum total publico de jogos detectado");
  if (!linksLegais) alertas.push("Links legais nao detectados no HTML publico");
  if (!possuiLicenca) alertas.push("Texto de licenca nao detectado no HTML publico");

  return {
    titulo,
    totalPagoHoje,
    totalJogosDetectados,
    categorias,
    linksLegais,
    possuiLogin,
    possuiCadastro,
    possuiSuporte,
    possuiLicenca,
    seo: extrairSeo(html, baseUrl),
    compliance: extrairCompliance(html, links),
    jornada: extrairJornada(html, links),
    promocoes: extrairPromocoes(html, baseUrl),
    socialLinks: extrairSocialLinks(html),
    termosRisco: contarTermos(html, ["golpe", "saque", "bloqueado", "reclamacao", "reclamação", "nao paga", "não paga", "demora", "suporte"]),
    alertas,
  };
}

async function fetchStatus(url) {
  const inicio = Date.now();
  try {
    const resposta = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(9000),
      headers: {
        "User-Agent": "BetOps-CEO-Command/1.0 (+local dashboard)",
        Accept: "text/html,application/xhtml+xml,text/plain",
      },
    });
    return { ok: resposta.ok, status: resposta.status, latenciaMs: Date.now() - inicio, urlFinal: resposta.url };
  } catch (error) {
    return { ok: false, status: 0, latenciaMs: Date.now() - inicio, erro: error.message };
  }
}

async function checarDns(siteUrl) {
  const inicio = Date.now();
  const hostname = new URL(siteUrl).hostname;
  try {
    const records = await dns.promises.resolve4(hostname);
    return { ok: records.length > 0, hostname, records: records.slice(0, 4), latenciaMs: Date.now() - inicio };
  } catch (error) {
    return { ok: false, hostname, records: [], latenciaMs: Date.now() - inicio, erro: error.message };
  }
}

function checarSsl(siteUrl) {
  const hostname = new URL(siteUrl).hostname;
  return new Promise((resolve) => {
    const inicio = Date.now();
    const socket = tls.connect({ host: hostname, port: 443, servername: hostname, timeout: 9000 }, () => {
      const cert = socket.getPeerCertificate();
      resolve({
        ok: Boolean(socket.authorized || cert.valid_to),
        hostname,
        autorizado: socket.authorized,
        erro: socket.authorizationError || "",
        validoAte: cert.valid_to || "",
        emissor: cert.issuer?.O || cert.issuer?.CN || "",
        latenciaMs: Date.now() - inicio,
      });
      socket.end();
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ ok: false, hostname, erro: "timeout SSL", latenciaMs: Date.now() - inicio });
    });
    socket.on("error", (error) => {
      resolve({ ok: false, hostname, erro: error.message, latenciaMs: Date.now() - inicio });
    });
  });
}

async function checarSite(site) {
  const inicio = Date.now();

  try {
    const [dnsInfo, sslInfo] = await Promise.all([checarDns(site.url), checarSsl(site.url)]);
    const resposta = await fetch(site.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "BetOps-CEO-Command/1.0 (+local dashboard)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const html = await resposta.text();
    const latenciaMs = Date.now() - inicio;
    const metricas = extrairMetricas(html, resposta.url || site.url);
    const [robots, sitemap] = await Promise.all([
      fetchStatus(new URL("/robots.txt", site.url).href),
      fetchStatus(new URL("/sitemap.xml", site.url).href),
    ]);

    metricas.seo.robots = robots.ok;
    metricas.seo.sitemap = sitemap.ok;
    metricas.seo.score = Math.round(
      media([
        metricas.seo.scoreBase,
        robots.ok ? 100 : 0,
        sitemap.ok ? 100 : 0,
      ]),
    );

    const headers = Object.fromEntries(resposta.headers.entries());

    return {
      id: site.id,
      nome: site.nome,
      alias: site.alias,
      url: site.url,
      urlFinal: resposta.url,
      ok: resposta.ok,
      statusHttp: resposta.status,
      latenciaMs,
      redirects: resposta.redirected ? 1 : 0,
      htmlBytes: Buffer.byteLength(html, "utf8"),
      headers: {
        server: headers.server || "",
        contentType: headers["content-type"] || "",
        cache: headers["cache-control"] || "",
        cfCache: headers["cf-cache-status"] || "",
      },
      cdn: /cloudflare|akamai|fastly|cloudfront|cdn/i.test(JSON.stringify(headers)),
      dns: dnsInfo,
      ssl: sslInfo,
      robots,
      sitemap,
      metricas,
      alertas: metricas.alertas,
      coletadoEm: new Date().toISOString(),
    };
  } catch (error) {
    return {
      id: site.id,
      nome: site.nome,
      alias: site.alias,
      url: site.url,
      ok: false,
      statusHttp: 0,
      latenciaMs: Date.now() - inicio,
      redirects: 0,
      htmlBytes: 0,
      cdn: false,
      dns: { ok: false, erro: "nao coletado" },
      ssl: { ok: false, erro: "nao coletado" },
      erro: error.message,
      metricas: {
        titulo: "",
        totalPagoHoje: 0,
        totalJogosDetectados: 0,
        categorias: [],
        linksLegais: 0,
        possuiLogin: false,
        possuiCadastro: false,
        possuiSuporte: false,
        possuiLicenca: false,
        seo: { score: 0 },
        compliance: { score: 0, checks: {} },
        jornada: { score: 0, checks: {}, playwright: { status: "pendente" } },
        promocoes: { score: 0, banners: [], termos: [] },
        socialLinks: {},
        termosRisco: [],
        alertas: [error.message],
      },
      alertas: [error.message],
      coletadoEm: new Date().toISOString(),
    };
  }
}

function carregarManualInputs() {
  return readJson(manualPath, { updatedAt: null, brands: {} });
}

function salvarManualInputs(payload) {
  const atual = carregarManualInputs();
  const brandId = payload.brandId;
  if (!sites.some((site) => site.id === brandId)) throw new Error("Marca invalida");
  atual.brands[brandId] = {
    ...(atual.brands[brandId] || {}),
    ...payload.values,
    updatedAt: new Date().toISOString(),
  };
  atual.updatedAt = new Date().toISOString();
  writeJson(manualPath, atual);
  return atual;
}

function carregarPageSpeed() {
  return readJson(pagespeedPath, { updatedAt: null, brands: {} });
}

function salvarPageSpeed(cache) {
  cache.updatedAt = new Date().toISOString();
  writeJson(pagespeedPath, cache);
}

function calcularUptime(history, brandId, dias) {
  const desde = Date.now() - dias * 24 * 60 * 60 * 1000;
  const checks = (history.checks || []).filter((check) => check.brandId === brandId && new Date(check.at).getTime() >= desde);
  if (!checks.length) return null;
  const ok = checks.filter((check) => check.ok).length;
  return Math.round((ok / checks.length) * 1000) / 10;
}

function scoreTecnico(site, pageSpeed, history) {
  const mobile = pageSpeed?.mobile;
  const desktop = pageSpeed?.desktop;
  const psiScore = media([mobile?.performance, desktop?.performance, mobile?.bestPractices, desktop?.bestPractices]);
  const uptime = media([
    calcularUptime(history, site.id, 1),
    calcularUptime(history, site.id, 7),
    calcularUptime(history, site.id, 30),
  ]);
  const latenciaScore = site.latenciaMs
    ? site.latenciaMs < 800
      ? 100
      : site.latenciaMs < 1500
        ? 82
        : site.latenciaMs < 3000
          ? 62
          : 38
    : 0;
  return Math.round(
    media([
      site.ok ? 100 : 0,
      uptime,
      latenciaScore,
      site.ssl?.ok ? 100 : 0,
      site.dns?.ok ? 100 : 0,
      psiScore,
    ]),
  );
}

function scoreSocial(site, manual) {
  if (Number.isFinite(Number(manual?.socialScore))) return clamp(manual.socialScore);
  const links = Object.values(site.metricas.socialLinks || {}).filter(Boolean).length;
  const seguidores = Number(manual?.followers || 0);
  const engajamento = Number(manual?.engagement || 0);
  return clamp(Math.round(links * 11 + Math.min(30, seguidores / 10000) + Math.min(15, engajamento * 5)));
}

function scoreReputacao(site, manual) {
  if (Number.isFinite(Number(manual?.reputationScore))) return clamp(manual.reputationScore);
  const termos = (site.metricas.termosRisco || []).reduce((soma, item) => soma + item.total, 0);
  return clamp(78 - termos * 8);
}

function scoreAppStore(manual) {
  if (Number.isFinite(Number(manual?.appScore))) return clamp(manual.appScore);
  const rating = Number(manual?.appRating || 0);
  return rating ? clamp(Math.round((rating / 5) * 100)) : null;
}

function normalizarSinaisExternos(externalMetrics, manual) {
  const rating = externalMetrics?.app_rating ?? manual?.appRating;
  return {
    ...externalMetrics,
    ...manual,
    followers: manual?.followers || externalMetrics?.followers,
    engagement: manual?.engagement || externalMetrics?.engagement_rate,
    posts7: manual?.posts7 || externalMetrics?.posts_7d,
    posts30: manual?.posts30 || externalMetrics?.posts_30d,
    avgViews: manual?.avgViews || externalMetrics?.avg_views,
    lastPost: manual?.lastPost || externalMetrics?.last_post_date,
    socialScore: manual?.socialScore || externalMetrics?.social_score,
    reputationScore: manual?.reputationScore || externalMetrics?.reputation_score,
    googleReviews: manual?.googleReviews || externalMetrics?.google_reviews,
    appName: manual?.appName || externalMetrics?.app_name,
    appRating: rating,
    appReviews: manual?.appReviews || externalMetrics?.app_reviews,
    appVersion: manual?.appVersion || externalMetrics?.app_version,
    appUpdatedAt: manual?.appUpdatedAt || externalMetrics?.app_last_update,
    appScore: manual?.appScore || (rating ? Math.round((Number(rating) / 5) * 100) : null),
    sentimentScore: manual?.sentimentScore || externalMetrics?.sentiment_score,
    riskNotes: manual?.riskNotes || (externalMetrics?.risk_terms || []).join(", "),
  };
}

function calcularScores(site, manual, pageSpeed, history) {
  const componentes = {
    tecnico: scoreTecnico(site, pageSpeed, history),
    social: scoreSocial(site, manual),
    seo: clamp(site.metricas.seo?.score || 0),
    reputacao: scoreReputacao(site, manual),
    jornada: clamp(site.metricas.jornada?.score || 0),
    promocoes: clamp(site.metricas.promocoes?.score || 0),
    compliance: clamp(site.metricas.compliance?.score || 0),
    appStore: scoreAppStore(manual),
  };
  const final = Math.round(
    componentes.tecnico * SCORE_WEIGHTS.tecnico +
      componentes.social * SCORE_WEIGHTS.social +
      componentes.seo * SCORE_WEIGHTS.seo +
      componentes.reputacao * SCORE_WEIGHTS.reputacao +
      componentes.jornada * SCORE_WEIGHTS.jornada +
      componentes.promocoes * SCORE_WEIGHTS.promocoes +
      componentes.compliance * SCORE_WEIGHTS.compliance,
  );
  return { final, componentes };
}

function registrarHistorico(sitesColetados, brands) {
  const history = readJson(historyPath, { updatedAt: null, checks: [], daily: {} });
  const now = new Date().toISOString();
  for (const site of sitesColetados) {
    history.checks.push({
      at: now,
      brandId: site.id,
      ok: site.ok,
      statusHttp: site.statusHttp,
      latenciaMs: site.latenciaMs,
      finalScore: brands.find((brand) => brand.id === site.id)?.scoreFinal || 0,
    });
  }
  history.checks = history.checks.slice(-5000);
  history.daily[hoje()] = {
    at: now,
    brands: Object.fromEntries(
      brands.map((brand) => [
        brand.id,
        {
          scoreFinal: brand.scoreFinal,
          componentes: brand.componentes,
          statusHttp: brand.site.statusHttp,
          latenciaMs: brand.site.latenciaMs,
        },
      ]),
    ),
  };
  history.updatedAt = now;
  writeJson(historyPath, history);
  return history;
}

function prepararHistoricoGrafico(history) {
  return Object.entries(history.daily || {})
    .slice(-30)
    .map(([date, item]) => ({
      date,
      maxima: item.brands?.maxima?.scoreFinal || null,
      ultra: item.brands?.ultra?.scoreFinal || null,
      suprema: item.brands?.suprema?.scoreFinal || null,
    }));
}

async function coletarExternalCeo({ registrar = true } = {}) {
  const externalMetricsByBrand = integrationService.aggregateLatestMetrics();
  const [sitesColetados, manual, pagespeed] = await Promise.all([
    Promise.all(sites.map(checarSite)),
    Promise.resolve(carregarManualInputs()),
    Promise.resolve(carregarPageSpeed()),
  ]);
  const historyAntes = readJson(historyPath, { updatedAt: null, checks: [], daily: {} });
  const brands = sitesColetados.map((site) => {
    const externalMetrics = externalMetricsByBrand[site.id] || {};
    const manualBrand = normalizarSinaisExternos(externalMetrics, manual.brands?.[site.id] || {});
    const psiBrand = pagespeed.brands?.[site.id] || {};
    const scores = calcularScores(site, manualBrand, psiBrand, historyAntes);
    return {
      id: site.id,
      nome: site.nome,
      alias: site.alias,
      url: site.url,
      scoreFinal: scores.final,
      componentes: scores.componentes,
      site,
      manual: manualBrand,
      externalMetrics,
      pagespeed: psiBrand,
      uptime: {
        h24: calcularUptime(historyAntes, site.id, 1),
        d7: calcularUptime(historyAntes, site.id, 7),
        d30: calcularUptime(historyAntes, site.id, 30),
      },
    };
  });
  const ranking = [...brands].sort((a, b) => b.scoreFinal - a.scoreFinal).map((brand, index) => ({ id: brand.id, posicao: index + 1, score: brand.scoreFinal }));
  const history = registrar ? registrarHistorico(sitesColetados, brands) : historyAntes;

  return {
    atualizadoEm: new Date().toISOString(),
    origem: "HTML publico, DNS, SSL, inputs manuais e PageSpeed opcional",
    pesos: SCORE_WEIGHTS,
    sites: sitesColetados,
    brands,
    ranking,
    historico: prepararHistoricoGrafico(history),
    manualInputs: manual,
    pagespeed,
  };
}

async function runPageSpeed(site, strategy) {
  const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  apiUrl.searchParams.set("url", site.url);
  apiUrl.searchParams.set("strategy", strategy);
  for (const category of ["performance", "accessibility", "best-practices", "seo"]) {
    apiUrl.searchParams.append("category", category);
  }
  if (process.env.PAGESPEED_API_KEY) apiUrl.searchParams.set("key", process.env.PAGESPEED_API_KEY);

  const resposta = await fetch(apiUrl, { signal: AbortSignal.timeout(45_000) });
  const payload = await resposta.json();
  if (!resposta.ok) throw new Error(payload.error?.message || `PageSpeed HTTP ${resposta.status}`);
  const lighthouse = payload.lighthouseResult || {};
  const categorias = lighthouse.categories || {};
  const audits = lighthouse.audits || {};
  const requests = audits["network-requests"]?.details?.items?.length || null;
  const totalBytes = audits["total-byte-weight"]?.numericValue || null;
  const technicalErrors = [
    audits["errors-in-console"]?.score === 1 ? null : "Erros no console detectados pelo Lighthouse",
    audits["server-response-time"]?.score === 1 ? null : "Tempo de resposta do servidor elevado",
    audits["redirects"]?.score === 1 ? null : "Redirecionamentos impactando carregamento",
  ].filter(Boolean);

  return {
    strategy,
    collectedAt: new Date().toISOString(),
    performance: Math.round((categorias.performance?.score ?? 0) * 100),
    accessibility: Math.round((categorias.accessibility?.score ?? 0) * 100),
    bestPractices: Math.round((categorias["best-practices"]?.score ?? 0) * 100),
    seo: Math.round((categorias.seo?.score ?? 0) * 100),
    coreWebVitals: {
      fcp: audits["first-contentful-paint"]?.displayValue || "",
      lcp: audits["largest-contentful-paint"]?.displayValue || "",
      cls: audits["cumulative-layout-shift"]?.displayValue || "",
      tbt: audits["total-blocking-time"]?.displayValue || "",
      speedIndex: audits["speed-index"]?.displayValue || "",
    },
    requests,
    pageBytes: totalBytes,
    technicalErrors,
    reportUrl: payload.id || site.url,
  };
}

async function coletarPageSpeedTodos() {
  const cache = carregarPageSpeed();
  cache.brands = cache.brands || {};
  for (const site of sites) {
    cache.brands[site.id] = cache.brands[site.id] || {};
    for (const strategy of ["mobile", "desktop"]) {
      try {
        cache.brands[site.id][strategy] = await runPageSpeed(site, strategy);
      } catch (error) {
        cache.brands[site.id][strategy] = {
          strategy,
          collectedAt: new Date().toISOString(),
          erro: error.message,
        };
      }
    }
  }
  salvarPageSpeed(cache);
  return cache;
}

let coletaEmAndamento = null;
function agendarColeta() {
  if (coletaEmAndamento) return coletaEmAndamento;
  coletaEmAndamento = coletarExternalCeo({ registrar: true })
    .catch(() => null)
    .finally(() => {
      coletaEmAndamento = null;
    });
  return coletaEmAndamento;
}

let integracoesEmAndamento = null;
function agendarIntegracoesExternas() {
  if (integracoesEmAndamento) return integracoesEmAndamento;
  integracoesEmAndamento = integrationService
    .runAll({ persist: true })
    .catch(() => null)
    .finally(() => {
      integracoesEmAndamento = null;
    });
  return integracoesEmAndamento;
}

setInterval(agendarColeta, 5 * 60 * 1000);
setInterval(agendarIntegracoesExternas, 24 * 60 * 60 * 1000);
setTimeout(agendarColeta, 1500);
setTimeout(agendarIntegracoesExternas, 5000);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/sites") {
    try {
      const payload = await coletarExternalCeo({ registrar: true });
      sendJson(res, 200, {
        atualizadoEm: payload.atualizadoEm,
        origem: "HTML publico das paginas iniciais",
        sites: payload.sites,
      });
    } catch (error) {
      sendJson(res, 500, { erro: error.message });
    }
    return;
  }

  if (url.pathname === "/api/external-ceo") {
    try {
      const payload = await coletarExternalCeo({ registrar: true });
      sendJson(res, 200, payload);
    } catch (error) {
      sendJson(res, 500, { erro: error.message });
    }
    return;
  }

  if (url.pathname === "/api/manual-inputs" && req.method === "GET") {
    sendJson(res, 200, carregarManualInputs());
    return;
  }

  if (url.pathname === "/api/manual-inputs" && req.method === "POST") {
    try {
      const payload = JSON.parse(await lerBody(req));
      sendJson(res, 200, salvarManualInputs(payload));
    } catch (error) {
      sendJson(res, 400, { erro: error.message });
    }
    return;
  }

  if (url.pathname === "/api/pagespeed/all") {
    try {
      sendJson(res, 200, await coletarPageSpeedTodos());
    } catch (error) {
      sendJson(res, 500, { erro: error.message });
    }
    return;
  }

  if (url.pathname === "/api/integrations/status") {
    sendJson(res, 200, {
      updatedAt: new Date().toISOString(),
      configPath: integrationService.configPath,
      tablePath: integrationService.tablePath,
      sources: integrationService.sourceStatus(),
      fields: integrationService.fields,
    });
    return;
  }

  if (url.pathname === "/api/integrations/run") {
    try {
      sendJson(res, 200, await integrationService.runAll({ persist: true }));
    } catch (error) {
      sendJson(res, 500, { erro: error.message });
    }
    return;
  }

  if (url.pathname === "/api/external-brand-metrics") {
    sendJson(res, 200, integrationService.comparativePayload());
    return;
  }

  if (url.pathname === "/api/benchmarking") {
    fs.readFile(benchmarkPath, "utf8", (error, data) => {
      if (error) {
        sendJson(res, 404, { erro: "Base de benchmarking nao encontrada" });
        return;
      }
      send(res, 200, data, "application/json; charset=utf-8");
    });
    return;
  }

  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(root, requested));

  if (!filePath.startsWith(root)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, "Not found");
      return;
    }
    send(res, 200, data, mime[path.extname(filePath)] || "application/octet-stream");
  });
});

server.listen(port, host, () => {
  ensureDataDir();
  console.log(`Central CEO de Bets rodando em http://${host}:${port}`);
});

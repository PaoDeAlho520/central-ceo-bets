import fs from "node:fs/promises";

function texto(valor) {
  return valor === null || valor === undefined ? "" : String(valor).trim();
}

function normalizarImagem(url) {
  const textoUrl = texto(url);
  if (!/^https?:\/\//i.test(textoUrl)) return "";
  try {
    const parsed = new URL(textoUrl);
    if (parsed.hostname === "app.blask.com" && parsed.pathname === "/_next/image") {
      const original = parsed.searchParams.get("url");
      if (original) return original;
    }
  } catch {
    return textoUrl;
  }
  return textoUrl;
}

const bc = JSON.parse(await fs.readFile("data/bc.json", "utf8"));
const logos = {};
const byName = {};
const byDomain = {};

function chave(valor) {
  return texto(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+logo\s*$/i, "")
    .replace(/^(https?:\/\/)?(www\.)?/i, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9]/g, "");
}

function sheetByName(name) {
  return (bc.sheets || []).find((sheet) => sheet.name === name);
}

function addNamedLogo(row, src) {
  const names = [row?.Nome, row?.Brand, row?.Marca, row?.MARCAS, row?.truncate, row?.Plataforma];
  for (const name of names) {
    const key = chave(name);
    if (key && src) byName[key] = src;
  }
  const domains = [row?.Empresa, row?.Endereco, row?.["Endereço"], row?.["Endere莽o"], row?.["DOMÍNIOS"], row?.DOMINIOS, row?.["DOM脥NIOS"]];
  for (const domain of domains) {
    const key = chave(domain);
    if (key && src) byDomain[key] = src;
  }
}

for (const sheet of bc.sheets || []) {
  if (!/^img_/i.test(sheet.name)) continue;
  for (const row of sheet.records || []) {
    const href = texto(row["flex href"] || row.href || row.URL || row.Url);
    const src = normalizarImagem(row["data-[loaded=false]:animate-pulse src"] || row.src || row.Imagem || row.Image);
    if (/^https?:\/\//i.test(href) && /^https?:\/\//i.test(src)) {
      logos[href] = src;
    }
  }
}

const geral = sheetByName("Geral")?.records || [];
const imgGeral = sheetByName("img_geral")?.records || [];
for (let index = 0; index < Math.min(geral.length, imgGeral.length); index += 1) {
  const src = normalizarImagem(imgGeral[index]["data-[loaded=false]:animate-pulse src"]);
  addNamedLogo(geral[index], src);
}

const umAno = sheetByName("1 ano")?.records || [];
const imgUmAno = sheetByName("img_1ano")?.records || [];
for (let index = 0; index < Math.min(umAno.length, imgUmAno.length); index += 1) {
  const src = normalizarImagem(imgUmAno[index]["data-[loaded=false]:animate-pulse src"]);
  addNamedLogo(umAno[index], src);
}

const payload = {
  generatedAt: new Date().toISOString(),
  count: Object.keys(logos).length,
  logos,
  byUrl: logos,
  byName,
  byDomain,
};

await fs.writeFile("data/brand-logos.json", `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output: "data/brand-logos.json", count: payload.count }, null, 2));

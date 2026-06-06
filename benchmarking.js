const ROTULOS_BENCHMARK = {
  "Country ID": "ID do pais",
  "#": "#",
  Country: "Pais",
  Brands: "Marcas",
  YoY: "Ano a ano",
  MoM: "Mes a mes",
  APS: "APS",
  "CEB (US$)": "CEB(BRL)",
  MI: "MI",
  Casino: "Cassino",
  Betting: "Apostas",
  URL: "URL",
  Brand: "Marca",
  "Platform/Vertical": "Plataforma/vertical",
  BAP: "BAP",
  "Brand URL": "URL da marca",
};

const NOMES_ABAS_BENCHMARK = {
  Brazil: "Brasil",
  Ranking: "Ranking",
};

const LOGOS_MARCAS_BENCHMARK = {
  "7games": "https://blask-prod.ams3.cdn.digitaloceanspaces.com/strapi/d2394ce77a6564ef2542db16e059dd5a.png",
  bet365: "https://blask-prod.ams3.cdn.digitaloceanspaces.com/strapi/11ecccae2576a04db82cd50815fb9785.png",
  betano: "https://blask-prod.ams3.cdn.digitaloceanspaces.com/strapi/438f137c810f6b9e59366943e0def39e.png",
  sportingbet: "https://blask-prod.ams3.cdn.digitaloceanspaces.com/strapi/be706ed1df17f920262623c169f8b0cf.png",
  superbet: "https://blask-prod.ams3.cdn.digitaloceanspaces.com/strapi/fbbd73008425a7cf2e25eff11641d1f9.png",
};

const CAMPOS_LOGO_BENCHMARK = ["Logo", "Logo URL", "Image", "Image URL", "Brand Logo", "Brand logo", "Logo link"];
const DOLAR_BENCHMARK_BRL = 5;

let dadosBenchmark = null;
let logosBenchmark = {};
let abaBenchmarkAtual = "Brazil";

const seletorBenchmark = document.querySelector("#benchmark-sheet-select");
const botaoSeletorBenchmark = document.querySelector("#benchmark-sheet-button");
const menuSeletorBenchmark = document.querySelector("#benchmark-sheet-menu");
const buscaBenchmark = document.querySelector("#benchmark-search");
const cabecalhoBenchmark = document.querySelector("#benchmark-table-head");
const corpoBenchmark = document.querySelector("#benchmark-table-body");
const resumoBenchmark = document.querySelector("#benchmark-summary");
const estadoBenchmark = document.querySelector("#benchmark-state");
const fonteBenchmark = document.querySelector("#benchmark-source");

function formatarNumero(valor) {
  return new Intl.NumberFormat("pt-BR").format(valor || 0);
}

function textoCelula(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  return String(valor);
}

function escaparHtml(valor) {
  return textoCelula(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function nomeMarcaBenchmark(valor) {
  return textoCelula(valor).replace(/\s+Logo\s*$/i, "").trim();
}

function chaveMarcaBenchmark(valor) {
  return nomeMarcaBenchmark(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function monogramaMarcaBenchmark(nome) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase() || "BM";
}

function rotuloCabecalhoBenchmark(cabecalho) {
  const texto = textoCelula(cabecalho);
  return ROTULOS_BENCHMARK[texto] || texto;
}

function nomeAbaBenchmark(nome) {
  const texto = textoCelula(nome);
  return NOMES_ABAS_BENCHMARK[texto] || texto;
}

function formatarCelula(valor) {
  const texto = textoCelula(valor);
  if (/^https?:\/\//i.test(texto)) {
    return `<a href="${escaparHtml(texto)}" target="_blank" rel="noreferrer">Abrir link</a>`;
  }
  return escaparHtml(texto);
}

function valorUsdBenchmark(valor) {
  const texto = textoCelula(valor).replace(/\s/g, "");
  const match = texto.match(/-?[\d.,]+/);
  if (!match) return null;
  const numero = Number(match[0].replace(/,/g, ""));
  if (!Number.isFinite(numero)) return null;
  if (/B/i.test(texto)) return numero * 1_000_000_000;
  if (/M/i.test(texto)) return numero * 1_000_000;
  if (/K/i.test(texto)) return numero * 1_000;
  return numero;
}

function formatarBrlBenchmark(valorUsd) {
  const brl = valorUsd * DOLAR_BENCHMARK_BRL;
  const abs = Math.abs(brl);
  if (abs >= 1_000_000_000) return `R$ ${(brl / 1_000_000_000).toFixed(2).replace(".", ",")} bi`;
  if (abs >= 1_000_000) return `R$ ${(brl / 1_000_000).toFixed(2).replace(".", ",")} mi`;
  if (abs >= 1_000) return `R$ ${(brl / 1_000).toFixed(2).replace(".", ",")} mil`;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(brl);
}

function formatarCebBrlBenchmark(valor) {
  const usd = valorUsdBenchmark(valor);
  if (usd === null) return formatarCelula(valor);
  return `<span class="benchmark-money">${escaparHtml(formatarBrlBenchmark(usd))}</span>`;
}

function logoDoRegistroBenchmark(registro, valor) {
  const logoPlanilha = CAMPOS_LOGO_BENCHMARK.map((campo) => textoCelula(registro?.[campo])).find((texto) => /^https?:\/\//i.test(texto));
  const logoPorUrl = logosBenchmark[textoCelula(registro?.["Brand URL"])] || logosBenchmark[textoCelula(registro?.URL)];
  return logoPlanilha || logoPorUrl || LOGOS_MARCAS_BENCHMARK[chaveMarcaBenchmark(valor)] || "";
}

function formatarMarcaBenchmark(valor, registro) {
  const nome = nomeMarcaBenchmark(valor);
  const logo = logoDoRegistroBenchmark(registro, valor);
  const imagem = logo
    ? `<img class="benchmark-brand-logo" src="${escaparHtml(logo)}" alt="${escaparHtml(nome)}" loading="lazy" />`
    : `<span class="benchmark-brand-logo benchmark-brand-logo-fallback" aria-hidden="true">${escaparHtml(monogramaMarcaBenchmark(nome))}</span>`;
  return `
    <span class="benchmark-brand-cell">
      ${imagem}
      <span>${escaparHtml(nome)}</span>
    </span>
  `;
}

function formatarCelulaBenchmark(registro, cabecalho) {
  if (cabecalho === "Brand") return formatarMarcaBenchmark(registro[cabecalho], registro);
  if (cabecalho === "CEB (US$)") return formatarCebBrlBenchmark(registro[cabecalho]);
  return formatarCelula(registro[cabecalho]);
}

function planilhaAtual() {
  if (!dadosBenchmark) return null;
  return dadosBenchmark.sheets.find((aba) => aba.name === abaBenchmarkAtual) || dadosBenchmark.sheets[0] || null;
}

function registrosDaAba(aba) {
  if (!aba) return [];
  if (Array.isArray(aba.records) && aba.records.length) return aba.records;
  const linhas = aba.raw || [];
  const cabecalhos = linhas[0] || [];
  return linhas.slice(1).map((linha) => Object.fromEntries(cabecalhos.map((cabecalho, indice) => [cabecalho || `Coluna ${indice + 1}`, linha[indice]])));
}

function cabecalhosDaAba(aba, registros) {
  if (Array.isArray(aba?.headers) && aba.headers.length) return aba.headers.filter((item) => item !== null && item !== "");
  return Object.keys(registros[0] || {});
}

function preencherResumoBenchmark(aba, registrosFiltrados) {
  const metadata = aba?.metadata || {};
  const cards = [
    ["Pais selecionado", nomeAbaBenchmark(aba?.name || "--")],
    ["Linhas exibidas", formatarNumero(registrosFiltrados.length)],
    ["Pais", metadata.Country ? nomeAbaBenchmark(metadata.Country) : aba?.name === "Ranking" ? "Ranking global" : nomeAbaBenchmark(aba?.name || "--")],
    ["Coleta", metadata["Scraped at"] || dadosBenchmark?.generatedAt || "--"],
  ];

  resumoBenchmark.innerHTML = cards
    .map(
      ([rotulo, valor]) => `
        <article class="benchmark-summary-card">
          <span>${escaparHtml(rotulo)}</span>
          <strong>${escaparHtml(valor)}</strong>
        </article>
      `,
    )
    .join("");
}

function fecharMenuBenchmark() {
  menuSeletorBenchmark.hidden = true;
  botaoSeletorBenchmark.setAttribute("aria-expanded", "false");
}

function abrirMenuBenchmark() {
  menuSeletorBenchmark.hidden = false;
  botaoSeletorBenchmark.setAttribute("aria-expanded", "true");
}

function atualizarRotuloSeletorBenchmark() {
  const opcao = seletorBenchmark.selectedOptions[0];
  botaoSeletorBenchmark.textContent = opcao?.textContent || "Selecionar pais";
}

function selecionarAbaBenchmark(nome) {
  abaBenchmarkAtual = nome;
  seletorBenchmark.value = nome;
  buscaBenchmark.value = "";
  atualizarRotuloSeletorBenchmark();
  renderizarMenuBenchmark();
  renderizarTabelaBenchmark();
  fecharMenuBenchmark();
}

function renderizarMenuBenchmark() {
  const opcoes = Array.from(seletorBenchmark.options);
  menuSeletorBenchmark.innerHTML = opcoes
    .map(
      (opcao) => `
        <button
          class="benchmark-select-option${opcao.value === abaBenchmarkAtual ? " is-active" : ""}"
          type="button"
          role="option"
          aria-selected="${opcao.value === abaBenchmarkAtual ? "true" : "false"}"
          data-value="${escaparHtml(opcao.value)}"
        >${escaparHtml(opcao.textContent)}</button>
      `,
    )
    .join("");
}

function renderizarTabelaBenchmark() {
  const aba = planilhaAtual();
  if (!aba) {
    cabecalhoBenchmark.innerHTML = "";
    corpoBenchmark.innerHTML = `<tr><td class="benchmark-empty">Base ainda nao carregada.</td></tr>`;
    return;
  }

  const termo = buscaBenchmark.value.trim().toLowerCase();
  const registros = registrosDaAba(aba);
  const filtrados = termo
    ? registros.filter((registro) => Object.values(registro).some((valor) => textoCelula(valor).toLowerCase().includes(termo)))
    : registros;
  const cabecalhos = cabecalhosDaAba(aba, filtrados.length ? filtrados : registros);

  cabecalhoBenchmark.innerHTML = `<tr>${cabecalhos.map((cabecalho) => `<th>${escaparHtml(rotuloCabecalhoBenchmark(cabecalho))}</th>`).join("")}</tr>`;
  corpoBenchmark.innerHTML = filtrados.length
    ? filtrados
        .map((registro) => `<tr>${cabecalhos.map((cabecalho) => `<td>${formatarCelulaBenchmark(registro, cabecalho)}</td>`).join("")}</tr>`)
        .join("")
    : `<tr><td class="benchmark-empty" colspan="${Math.max(cabecalhos.length, 1)}">Nenhuma linha encontrada para a busca atual.</td></tr>`;

  preencherResumoBenchmark(aba, filtrados);
}

function preencherSeletorBenchmark() {
  const abas = dadosBenchmark?.sheets || [];
  const ordenadas = [...abas].sort((a, b) => {
    if (a.name === "Ranking") return -1;
    if (b.name === "Ranking") return 1;
    if (a.name === "Brazil") return -1;
    if (b.name === "Brazil") return 1;
    return a.name.localeCompare(b.name);
  });

  seletorBenchmark.innerHTML = ordenadas
    .map((aba) => `<option value="${escaparHtml(aba.name)}">${escaparHtml(nomeAbaBenchmark(aba.name))} (${formatarNumero(aba.records?.length || aba.raw?.length || 0)} linhas)</option>`)
    .join("");

  abaBenchmarkAtual = ordenadas.some((aba) => aba.name === "Brazil") ? "Brazil" : ordenadas[0]?.name || "Ranking";
  seletorBenchmark.value = abaBenchmarkAtual;
  atualizarRotuloSeletorBenchmark();
  renderizarMenuBenchmark();
}

function preencherKpisBenchmark() {
  const brasil = dadosBenchmark?.countries?.find((pais) => pais.name === "Brazil");
  document.querySelector("#benchmark-sheets").textContent = formatarNumero(dadosBenchmark?.sheetCount || 0);
  document.querySelector("#benchmark-rows").textContent = formatarNumero(dadosBenchmark?.rowCount || 0);
  document.querySelector("#benchmark-countries").textContent = formatarNumero(dadosBenchmark?.countries?.length || 0);
  document.querySelector("#benchmark-brazil").textContent = formatarNumero(brasil?.records?.length || 0);
  estadoBenchmark.textContent = "Base carregada";
  fonteBenchmark.textContent = dadosBenchmark?.sourceFile ? "Planilha atualizada" : "Planilha local";
}

async function buscarBaseBenchmarking() {
  const caminhos = ["/api/benchmarking", "data/benchmarking.json"];
  let ultimoErro = null;

  for (const caminho of caminhos) {
    try {
      const separador = caminho.includes("?") ? "&" : "?";
      const resposta = await fetch(`${caminho}${separador}ts=${Date.now()}`);
      if (!resposta.ok) throw new Error(`${caminho}: HTTP ${resposta.status}`);
      return await resposta.json();
    } catch (erro) {
      ultimoErro = erro;
    }
  }

  throw ultimoErro || new Error("Base indisponivel");
}

async function carregarBenchmarking() {
  try {
    const [base, logos] = await Promise.all([
      buscarBaseBenchmarking(),
      carregarLogosBenchmark(),
    ]);
    dadosBenchmark = base;
    logosBenchmark = logos;
    preencherKpisBenchmark();
    preencherSeletorBenchmark();
    renderizarTabelaBenchmark();
  } catch (erro) {
    window.__benchmarkErrors = [...(window.__benchmarkErrors || []), erro.message];
    estadoBenchmark.textContent = "Falha ao carregar";
    cabecalhoBenchmark.innerHTML = "";
    corpoBenchmark.innerHTML = `<tr><td class="benchmark-empty">Nao foi possivel carregar a base: ${escaparHtml(erro.message)}</td></tr>`;
  }
}

async function carregarLogosBenchmark() {
  try {
    const resposta = await fetch(`data/brand-logos.json?ts=${Date.now()}`);
    if (!resposta.ok) throw new Error(`brand-logos: HTTP ${resposta.status}`);
    const payload = await resposta.json();
    return payload.logos || {};
  } catch {
    return {};
  }
}

seletorBenchmark.addEventListener("change", () => {
  abaBenchmarkAtual = seletorBenchmark.value;
  atualizarRotuloSeletorBenchmark();
  renderizarMenuBenchmark();
  renderizarTabelaBenchmark();
});

botaoSeletorBenchmark.addEventListener("click", () => {
  if (menuSeletorBenchmark.hidden) abrirMenuBenchmark();
  else fecharMenuBenchmark();
});

menuSeletorBenchmark.addEventListener("click", (evento) => {
  const opcao = evento.target.closest(".benchmark-select-option");
  if (!opcao) return;
  selecionarAbaBenchmark(opcao.dataset.value);
});

document.addEventListener("click", (evento) => {
  if (evento.target.closest(".benchmark-select")) return;
  fecharMenuBenchmark();
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") fecharMenuBenchmark();
});

buscaBenchmark.addEventListener("input", renderizarTabelaBenchmark);

document.querySelector("#benchmark-brazil-button").addEventListener("click", () => {
  if (!dadosBenchmark?.sheets?.some((aba) => aba.name === "Brazil")) return;
  selecionarAbaBenchmark("Brazil");
});

document.querySelector("#benchmark-ranking-button").addEventListener("click", () => {
  if (!dadosBenchmark?.sheets?.some((aba) => aba.name === "Ranking")) return;
  selecionarAbaBenchmark("Ranking");
});

carregarBenchmarking();

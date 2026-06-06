let dadosBc = null;
let logosBc = {};
let guiaAtualBc = "";

const tabsBc = document.querySelector("#bc-tabs");
const buscaBc = document.querySelector("#bc-search");
const limparBc = document.querySelector("#bc-clear");
const cabecalhoBc = document.querySelector("#bc-table-head");
const corpoBc = document.querySelector("#bc-table-body");
const resumoBc = document.querySelector("#bc-summary");
const estadoBc = document.querySelector("#bc-state");
const fonteBc = document.querySelector("#bc-source");
const tituloBc = document.querySelector("#bc-title");
const subtituloBc = document.querySelector("#bc-subtitle");

function textoBc(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  return String(valor);
}

function escaparBc(valor) {
  return textoBc(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function numeroBc(valor) {
  return new Intl.NumberFormat("pt-BR").format(valor || 0);
}

function chaveBc(valor) {
  return textoBc(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+logo\s*$/i, "")
    .replace(/^(https?:\/\/)?(www\.)?/i, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9]/g, "");
}

function nomeMarcaBc(valor) {
  return textoBc(valor).replace(/\s+Logo\s*$/i, "").trim();
}

function guiaBc() {
  return (dadosBc?.sheets || []).find((sheet) => sheet.name === guiaAtualBc) || dadosBc?.sheets?.[0] || null;
}

function valorPrimeiro(row, campos) {
  for (const campo of campos) {
    const valor = textoBc(row?.[campo]);
    if (valor) return valor;
  }
  return "";
}

function logoRowBc(row) {
  const url = valorPrimeiro(row, ["Brand URL", "flex href", "URL", "Url", "href"]);
  if (url && logosBc.byUrl?.[url]) return logosBc.byUrl[url];

  const logo = valorPrimeiro(row, ["Logo", "Logo URL", "Imagem", "IMG", "Image", "Image URL", "src", "data-[loaded=false]:animate-pulse src"]);
  if (/^https?:\/\//i.test(logo)) return logo;

  const nome = valorPrimeiro(row, ["Nome", "Brand", "Marca", "MARCAS", "Casa de Aposta", "Agregador", "truncate", "Plataforma"]);
  if (nome && logosBc.byName?.[chaveBc(nome)]) return logosBc.byName[chaveBc(nome)];

  const dominio = valorPrimeiro(row, ["Empresa", "Endereco", "Endereço", "Endere莽o", "DOMÍNIOS", "DOMINIOS", "DOM脥NIOS", "URL"]);
  if (dominio && logosBc.byDomain?.[chaveBc(dominio)]) return logosBc.byDomain[chaveBc(dominio)];

  return "";
}

function monogramaBc(nome) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase() || "BC";
}

function marcaCellBc(row, cabecalho) {
  const nome = nomeMarcaBc(row[cabecalho]);
  const logo = logoRowBc(row);
  const imagem = logo
    ? `<img class="benchmark-brand-logo" src="${escaparBc(logo)}" alt="${escaparBc(nome)}" loading="lazy" />`
    : `<span class="benchmark-brand-logo benchmark-brand-logo-fallback" aria-hidden="true">${escaparBc(monogramaBc(nome))}</span>`;
  return `<span class="benchmark-brand-cell">${imagem}<span>${escaparBc(nome)}</span></span>`;
}

function deveMostrarMarca(cabecalho) {
  return ["Nome", "Brand", "Marca", "MARCAS", "Casa de Aposta", "Agregador", "truncate", "Plataforma"].includes(cabecalho);
}

function formatarCelulaBc(row, cabecalho) {
  const valor = textoBc(row[cabecalho]);
  if (deveMostrarMarca(cabecalho) && valor) return marcaCellBc(row, cabecalho);
  if (/^https?:\/\//i.test(valor)) return `<a href="${escaparBc(valor)}" target="_blank" rel="noreferrer">Abrir link</a>`;
  return escaparBc(valor);
}

function renderizarTabsBc() {
  tabsBc.innerHTML = (dadosBc?.sheets || [])
    .map((sheet) => `
      <button class="bc-tab${sheet.name === guiaAtualBc ? " is-active" : ""}" type="button" role="tab" data-sheet="${escaparBc(sheet.name)}">
        ${escaparBc(sheet.name)}
        <span>${numeroBc(sheet.recordCount || sheet.records?.length || 0)}</span>
      </button>
    `)
    .join("");
}

function renderizarResumoBc(sheet, filtrados) {
  const cards = [
    ["Guia", sheet?.name || "--"],
    ["Linhas exibidas", numeroBc(filtrados.length)],
    ["Colunas", numeroBc(sheet?.headers?.length || 0)],
    ["Atualizado", dadosBc?.generatedAt ? new Date(dadosBc.generatedAt).toLocaleString("pt-BR") : "--"],
  ];
  resumoBc.innerHTML = cards
    .map(([rotulo, valor]) => `
      <article class="benchmark-summary-card">
        <span>${escaparBc(rotulo)}</span>
        <strong>${escaparBc(valor)}</strong>
      </article>
    `)
    .join("");
}

function renderizarTabelaBc() {
  const sheet = guiaBc();
  if (!sheet) {
    cabecalhoBc.innerHTML = "";
    corpoBc.innerHTML = `<tr><td class="benchmark-empty">Base BC ainda nao carregada.</td></tr>`;
    return;
  }

  const termo = buscaBc.value.trim().toLowerCase();
  const registros = sheet.records || [];
  const filtrados = termo
    ? registros.filter((row) => Object.values(row).some((valor) => textoBc(valor).toLowerCase().includes(termo)))
    : registros;
  const headers = sheet.headers || Object.keys(filtrados[0] || registros[0] || {});

  tituloBc.textContent = sheet.name;
  subtituloBc.textContent = `${numeroBc(registros.length)} linhas na guia selecionada.`;
  document.querySelector("#bc-current").textContent = sheet.name;
  cabecalhoBc.innerHTML = `<tr>${headers.map((header) => `<th>${escaparBc(header)}</th>`).join("")}</tr>`;
  corpoBc.innerHTML = filtrados.length
    ? filtrados.map((row) => `<tr>${headers.map((header) => `<td>${formatarCelulaBc(row, header)}</td>`).join("")}</tr>`).join("")
    : `<tr><td class="benchmark-empty" colspan="${Math.max(headers.length, 1)}">Nenhuma linha encontrada.</td></tr>`;

  renderizarResumoBc(sheet, filtrados);
  renderizarTabsBc();
}

async function carregarJsonBc(caminho) {
  const resposta = await fetch(`${caminho}?ts=${Date.now()}`);
  if (!resposta.ok) throw new Error(`${caminho}: HTTP ${resposta.status}`);
  return resposta.json();
}

async function carregarBc() {
  try {
    const [bc, logos] = await Promise.all([
      carregarJsonBc("data/bc.json"),
      carregarJsonBc("data/brand-logos.json").catch(() => ({ byUrl: {}, byName: {}, byDomain: {}, count: 0 })),
    ]);
    dadosBc = bc;
    logosBc = {
      byUrl: logos.byUrl || logos.logos || {},
      byName: logos.byName || {},
      byDomain: logos.byDomain || {},
    };
    guiaAtualBc = bc.sheets?.find((sheet) => sheet.name === "Geral")?.name || bc.sheets?.[0]?.name || "";
    document.querySelector("#bc-sheets").textContent = numeroBc(bc.sheetCount || bc.sheets?.length || 0);
    document.querySelector("#bc-rows").textContent = numeroBc(bc.rowCount || 0);
    document.querySelector("#bc-logos").textContent = numeroBc(logos.count || Object.keys(logos.byUrl || {}).length || 0);
    estadoBc.textContent = "Base carregada";
    fonteBc.textContent = "Planilha online";
    renderizarTabsBc();
    renderizarTabelaBc();
  } catch (error) {
    estadoBc.textContent = "Falha ao carregar";
    cabecalhoBc.innerHTML = "";
    corpoBc.innerHTML = `<tr><td class="benchmark-empty">Nao foi possivel carregar BC: ${escaparBc(error.message)}</td></tr>`;
  }
}

tabsBc.addEventListener("click", (event) => {
  const tab = event.target.closest(".bc-tab");
  if (!tab) return;
  guiaAtualBc = tab.dataset.sheet;
  buscaBc.value = "";
  renderizarTabelaBc();
});

buscaBc.addEventListener("input", renderizarTabelaBc);
limparBc.addEventListener("click", () => {
  buscaBc.value = "";
  renderizarTabelaBc();
});

carregarBc();

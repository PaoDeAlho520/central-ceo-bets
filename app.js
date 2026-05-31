const marcas = [
  {
    id: "maxima",
    nome: "Maxima Bet",
    dominio: "maxima.bet.br",
    url: "https://www.maxima.bet.br",
    cor: "#28e38b",
  },
  {
    id: "suprema",
    nome: "Suprema Bet",
    dominio: "suprema.bet.br",
    url: "https://www.suprema.bet.br",
    cor: "#f4bf4f",
  },
  {
    id: "ultra",
    nome: "Ultra Bet",
    dominio: "ultra.bet.br",
    url: "https://www.ultra.bet.br",
    cor: "#35c6ff",
  },
];

const agentes = [
  {
    nome: "Monitor de Sites",
    funcao: "Coleta disponibilidade, latencia, titulo, jogos e links publicos das tres marcas.",
    status: "active",
    grupo: "site",
    carga: 78,
    cor: "#28e38b",
    sigla: "MS",
    acoes: 36,
  },
  {
    nome: "Analista de Catalogo",
    funcao: "Compara jogos, provedores, cassino ao vivo, esportes e categorias detectadas.",
    status: "active",
    grupo: "site",
    carga: 62,
    cor: "#f4bf4f",
    sigla: "AC",
    acoes: 24,
  },
  {
    nome: "Sentinela de Risco",
    funcao: "Sinaliza falhas de coleta, baixa disponibilidade e divergencias entre marcas.",
    status: "review",
    grupo: "risco",
    carga: 71,
    cor: "#ff8b45",
    sigla: "SR",
    acoes: 19,
  },
  {
    nome: "Radar de Fraude",
    funcao: "Pronto para plugar dados internos de bonus, contas duplicadas, device e saques.",
    status: "active",
    grupo: "risco",
    carga: 49,
    cor: "#ff5c6a",
    sigla: "RF",
    acoes: 14,
  },
  {
    nome: "Oficial de Verificacao e PLD",
    funcao: "Preparado para integrar filas internas de verificacao, prevencao a lavagem de dinheiro e origem de fundos.",
    status: "review",
    grupo: "compliance",
    carga: 57,
    cor: "#35c6ff",
    sigla: "KY",
    acoes: 21,
  },
  {
    nome: "Guardiao do Jogo Responsavel",
    funcao: "Confere presenca publica de paginas e politicas de jogo responsavel.",
    status: "active",
    grupo: "compliance",
    carga: 44,
    cor: "#a77dff",
    sigla: "JR",
    acoes: 18,
  },
  {
    nome: "Capitao de Pagamentos",
    funcao: "Base pronta para conectar PIX, saques, chargeback e conciliacao autorizada.",
    status: "active",
    grupo: "risco",
    carga: 52,
    cor: "#b7f85d",
    sigla: "PG",
    acoes: 17,
  },
  {
    nome: "Mesa de CRM",
    funcao: "Compara sinais publicos e prepara campanhas com travas de conformidade.",
    status: "active",
    grupo: "site",
    carga: 38,
    cor: "#f7a7ff",
    sigla: "CV",
    acoes: 22,
  },
];

const rotina = [
  { hora: "08:00", titulo: "Abertura das tres marcas", detalhe: "Disponibilidade, latencia, redirecionamentos e banners principais.", estado: "feito" },
  { hora: "07:20", titulo: "Google Play diario", detalhe: "Downloads, nota media e quantidade de avaliacoes dos apps Maxima, Ultra e Suprema.", estado: "diario" },
  { hora: "10:30", titulo: "Revisao legal e jogo responsavel", detalhe: "Termos, politica de privacidade, prevencao a lavagem de dinheiro e paginas de ajuda.", estado: "agora" },
  { hora: "13:00", titulo: "Catalogo e provedores", detalhe: "Jogos visiveis, cassino ao vivo, esportes e categorias em destaque.", estado: "proximo" },
  { hora: "16:00", titulo: "Mesa de risco", detalhe: "Cruzar sinais publicos com APIs internas assim que credenciais forem conectadas.", estado: "proximo" },
  { hora: "21:30", titulo: "Fechamento executivo", detalhe: "Gerar resumo do CEO com comparativo e pendencias de integracao.", estado: "proximo" },
];

const prioridades = [
  {
    titulo: "Conectar APIs internas autorizadas",
    dono: "Para receita bruta, receita liquida, saques, verificacao, bonus e margem real, e necessario token oficial das tres operacoes.",
    score: "CEO",
  },
  {
    titulo: "Monitorar disponibilidade publica",
    dono: "Coleta em tempo real mede HTTP, latencia e campos visiveis das paginas iniciais.",
    score: "P0",
  },
  {
    titulo: "Auditar paginas legais",
    dono: "Conferir termos, privacidade, prevencao a lavagem de dinheiro e jogo responsavel para cada marca.",
    score: "P1",
  },
  {
    titulo: "Padronizar comandos externos",
    dono: "Acoes atuais abrem paginas publicas; comandos administrativos exigem autorizacao.",
    score: "P1",
  },
];

const controles = [
  { titulo: "Disponibilidade publica", detalhe: "Status HTTP e tempo de resposta por marca", valor: "tempo real", largura: 82 },
  { titulo: "Catalogo publico", detalhe: "Jogos e categorias detectados nas paginas iniciais", valor: "tempo real", largura: 68 },
  { titulo: "Conformidade publica", detalhe: "Links legais, prevencao a lavagem de dinheiro e jogo responsavel", valor: "ativo", largura: 74 },
  { titulo: "Metricas internas", detalhe: "Aguardando credenciais e APIs oficiais", valor: "pendente", largura: 34 },
];

let atividades = [
  { agente: "Monitor de Sites", evento: "aguardando primeira coleta publica", tempo: "agora" },
  { agente: "Oficial de Verificacao e PLD", evento: "campos internos dependem de API autorizada", tempo: "fixo" },
  { agente: "Guardiao do Jogo Responsavel", evento: "validara links publicos de protecao ao usuario", tempo: "fixo" },
];

let dadosSites = [];
let dadosExternal = null;
let dadosIntegracoes = null;
let dadosGooglePlay = null;
let dadosInstagram = null;
let filtroAtual = "all";

const gradeMarcas = document.querySelector("#brand-grid");
const quadroSites = document.querySelector("#site-board");
const listaRotina = document.querySelector("#day-list");
const gradeAgentes = document.querySelector("#agent-grid");
const listaPrioridades = document.querySelector("#priority-list");
const trilhasRisco = document.querySelector("#risk-lanes");
const listaAtividades = document.querySelector("#activity-list");
const comandosExternos = document.querySelector("#external-commands");
const busca = document.querySelector("#agent-search");
const terminal = document.querySelector("#terminal-output");
const rankingTable = document.querySelector("#ranking-table");
const scoreGrid = document.querySelector("#score-grid");
const historyChart = document.querySelector("#history-chart");
const websitePerformanceBoard = document.querySelector("#website-performance-board");
const socialBoard = document.querySelector("#social-board");
const seoBoard = document.querySelector("#seo-board");
const reputationBoard = document.querySelector("#reputation-board");
const journeyBoard = document.querySelector("#journey-board");
const promotionsBoard = document.querySelector("#promotions-board");
const appStoreBoard = document.querySelector("#app-store-board");
const complianceBoard = document.querySelector("#compliance-board");
const manualInputGrid = document.querySelector("#manual-input-grid");
const manualState = document.querySelector("#manual-state");
const pagespeedState = document.querySelector("#pagespeed-state");
const integrationStatusBoard = document.querySelector("#integration-status-board");
const integrationsState = document.querySelector("#integrations-state");
const externalMetricsTable = document.querySelector("#external-metrics-table");
const externalMetricsFootnote = document.querySelector("#external-metrics-footnote");

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

function formatarNumero(valor) {
  return new Intl.NumberFormat("pt-BR").format(valor || 0);
}

async function carregarJsonComFallback(caminhos) {
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
  throw ultimoErro || new Error("Dados indisponiveis");
}

function formatarPercentual(valor) {
  if (valor === null || valor === undefined || valor === "") return "--";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(Number(valor) || 0)}%`;
}

function media(valores) {
  const validos = valores.filter((valor) => Number.isFinite(Number(valor)));
  if (!validos.length) return null;
  return validos.reduce((soma, valor) => soma + Number(valor), 0) / validos.length;
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusScore(score) {
  if (score >= 80) return "is-good";
  if (score >= 60) return "is-mid";
  return "is-bad";
}

function brandPayload(id) {
  return dadosExternal?.brands?.find((brand) => brand.id === id);
}

function googlePlayPayload(id) {
  return dadosGooglePlay?.brands?.find((brand) => brand.id === id);
}

function instagramPayload(id) {
  return dadosInstagram?.brands?.find((brand) => brand.id === id);
}

function googlePlayDiarioAtivo() {
  return (dadosGooglePlay?.brands || []).some((brand) => brand.collectedOk);
}

function instagramDiarioAtivo() {
  return (dadosInstagram?.brands || []).some((brand) => brand.collectedOk);
}

function rotuloStatus(status) {
  return {
    active: "ativo",
    review: "revisao",
    blocked: "bloqueado",
  }[status];
}

function resumoSite(site) {
  if (!site) return "Aguardando coleta";
  if (!site.ok) return site.erro || "Falha na coleta";
  return site.titulo || "Site acessivel";
}

function statusClasse(site) {
  return site?.ok ? "online" : "offline";
}

function renderizarMarcas() {
  gradeMarcas.innerHTML = marcas
    .map((marca) => {
      const site = dadosSites.find((item) => item.id === marca.id);
      const externo = brandPayload(marca.id);
      const jogos = site?.metricas?.totalJogosDetectados || 0;
      const pago = site?.metricas?.totalPagoHoje || 0;
      const links = site?.metricas?.linksLegais || 0;
      const latencia = site?.latenciaMs ? `${site.latenciaMs}ms` : "--";
      const score = externo?.scoreFinal ?? 0;

      return `
        <article class="brand-card" style="--brand-color: ${marca.cor}">
          <div class="brand-card-head">
            <div>
              <h3>${marca.nome}</h3>
              <span class="brand-url">${marca.dominio}</span>
            </div>
            <span class="brand-status ${statusClasse(site)}">${site?.ok ? "ativo" : "aguardando"}</span>
          </div>
          <div class="score-line">
            <span>Score CEO</span>
            <strong>${score || "--"}</strong>
            <span class="meter"><span style="width: ${score}%"></span></span>
          </div>
          <div class="brand-metrics">
            <div class="brand-metric">
              <span>Latencia</span>
              <strong>${latencia}</strong>
            </div>
            <div class="brand-metric">
              <span>Jogos detectados</span>
              <strong>${formatarNumero(jogos)}</strong>
            </div>
            <div class="brand-metric">
              <span>Pago hoje visivel</span>
              <strong>${formatarMoeda(pago)}</strong>
            </div>
            <div class="brand-metric">
              <span>Links legais</span>
              <strong>${links}</strong>
            </div>
          </div>
          <p class="site-note">${resumoSite(site)}</p>
          <div class="brand-links">
            <a class="brand-link" href="${marca.url}" target="_blank" rel="noreferrer">Abrir site</a>
            <a class="brand-link" href="${marca.url}/sports" target="_blank" rel="noreferrer">Esportes</a>
            <a class="brand-link" href="${marca.url}/casino" target="_blank" rel="noreferrer">Cassino</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderizarQuadroSites() {
  quadroSites.innerHTML = marcas
    .map((marca) => {
      const site = dadosSites.find((item) => item.id === marca.id);
      const externo = brandPayload(marca.id);
      const metricas = site?.metricas || {};
      const categorias = (metricas.categorias || []).slice(0, 5).join(", ") || "Aguardando";
      const destino = site?.urlFinal || marca.url;
      const uptime = externo?.uptime || {};

      return `
        <article class="site-row">
          <div>
            <strong>${marca.nome}</strong>
            <span>${destino}</span>
          </div>
          <div>
            <strong>${site?.statusHttp || "--"}</strong>
            <span>Status HTTP</span>
          </div>
          <div>
            <strong>${site?.latenciaMs ? `${site.latenciaMs}ms` : "--"}</strong>
            <span>Latencia</span>
          </div>
          <div class="site-status ${statusClasse(site)}">${site?.ok ? "ativo" : "sem coleta"}</div>
          <div class="site-note">
            Uptime 24h ${formatarPercentual(uptime.h24)} | SSL ${site?.ssl?.ok ? "ok" : "pendente"} | DNS ${site?.dns?.ok ? "ok" : "falha"} | CDN ${site?.cdn ? "sim" : "nao"}
            <br />${categorias}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderizarRotina() {
  listaRotina.innerHTML = rotina
    .map(
      (item) => `
        <article class="day-item">
          <div class="day-time">${item.hora}</div>
          <div class="day-main">
            <strong>${item.titulo}</strong>
            <span>${item.detalhe}</span>
          </div>
          <div class="day-state">${item.estado}</div>
        </article>
      `,
    )
    .join("");
}

function renderizarAgentes() {
  const termo = busca.value.trim().toLowerCase();
  const visiveis = agentes.filter((agente) => {
    const bateFiltro = filtroAtual === "all" || agente.grupo === filtroAtual;
    const bateBusca = `${agente.nome} ${agente.funcao} ${agente.grupo}`.toLowerCase().includes(termo);
    return bateFiltro && bateBusca;
  });

  gradeAgentes.innerHTML = visiveis
    .map(
      (agente, indice) => `
        <article class="agent-card ${indice === 0 ? "is-selected" : ""}" style="--agent-color: ${agente.cor}">
          <div class="agent-top">
            <div class="avatar">${agente.sigla}</div>
            <span class="status ${agente.status}">${rotuloStatus(agente.status)}</span>
          </div>
          <h3>${agente.nome}</h3>
          <p>${agente.funcao}</p>
          <div class="agent-meta">
            <span>${agente.acoes} acoes hoje</span>
            <span class="meter" aria-label="Carga ${agente.carga}%"><span style="width: ${agente.carga}%"></span></span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderizarPrioridades() {
  listaPrioridades.innerHTML = prioridades
    .map(
      (item) => `
        <article class="priority-item">
          <div class="priority-main">
            <strong>${item.titulo}</strong>
            <span>${item.dono}</span>
          </div>
          <div class="priority-score">${item.score}</div>
        </article>
      `,
    )
    .join("");
}

function renderizarControles() {
  trilhasRisco.innerHTML = controles
    .map(
      (item) => `
        <article class="risk-row">
          <div class="risk-main">
            <strong>${item.titulo}</strong>
            <span>${item.detalhe}</span>
            <span class="meter" aria-label="Nivel ${item.largura}%"><span style="width: ${item.largura}%"></span></span>
          </div>
          <div class="risk-value">${item.valor}</div>
        </article>
      `,
    )
    .join("");
}

function renderizarAtividades() {
  listaAtividades.innerHTML = atividades
    .map(
      (item) => `
        <article class="activity-item">
          <span class="activity-dot" aria-hidden="true"></span>
          <div class="activity-main">
            <strong>${item.agente}</strong>
            <span>${item.evento}</span>
          </div>
          <span class="activity-time">${item.tempo}</span>
        </article>
      `,
    )
    .join("");
}

function renderizarComandos() {
  comandosExternos.innerHTML = marcas
    .flatMap((marca) => [
      { marca, tipo: "Site", url: marca.url },
      { marca, tipo: "Ajuda", url: `${marca.url}/help` },
      { marca, tipo: "Jogo responsavel", url: `${marca.url}/responsible-gaming` },
    ])
    .map(
      (acao) => `
        <button class="command-button" type="button" data-url="${acao.url}" data-command="${acao.marca.nome} - ${acao.tipo}">
          <span>${acao.marca.id.slice(0, 2).toUpperCase()}</span>
          ${acao.marca.nome}: ${acao.tipo}
        </button>
      `,
    )
    .join("");

  document.querySelectorAll(".command-button").forEach((botao) => {
    botao.addEventListener("click", () => {
      const url = botao.dataset.url;
      const comando = botao.dataset.command;
      window.open(url, "_blank", "noopener,noreferrer");
      escreverTerminal(`comando externo publico aberto: ${comando}`);
    });
  });
}

function atualizarMetricas() {
  const online = dadosSites.filter((site) => site.ok).length;
  const latencias = dadosSites.filter((site) => site.latenciaMs).map((site) => site.latenciaMs);
  const mediaLatencia = latencias.length
    ? Math.round(latencias.reduce((soma, valor) => soma + valor, 0) / latencias.length)
    : 0;
  const totalJogos = dadosSites.reduce((soma, site) => soma + (site.metricas?.totalJogosDetectados || 0), 0);
  const totalPago = dadosSites.reduce((soma, site) => soma + (site.metricas?.totalPagoHoje || 0), 0);
  const linksLegais = dadosSites.reduce((soma, site) => soma + (site.metricas?.linksLegais || 0), 0);
  const alertas = marcas.length - online + dadosSites.filter((site) => site.alertas?.length).length;

  document.querySelector("#online-count").textContent = `${online}/3`;
  document.querySelector("#latency-count").textContent = mediaLatencia ? `${mediaLatencia}ms` : "--ms";
  document.querySelector("#games-count").textContent = formatarNumero(totalJogos);
  document.querySelector("#paid-count").textContent = formatarMoeda(totalPago);
  document.querySelector("#legal-count").textContent = linksLegais;
  document.querySelector("#alert-count").textContent = alertas;
  document.querySelector("#global-status").textContent = online === 3 ? "Todos ativos" : `${online}/3 ativos`;
  document.querySelector("#online-trend").textContent = online === 3 ? "normal" : "atencao";
}

function atualizarRelogio() {
  const agora = new Date();
  document.querySelector("#clock").textContent = agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escreverTerminal(linha) {
  terminal.textContent = `${terminal.textContent}\ncentral-bets$ ${linha}`;
  terminal.scrollTop = terminal.scrollHeight;
}

function formatarBytes(valor) {
  const numero = Number(valor || 0);
  if (!numero) return "--";
  if (numero > 1_000_000) return `${(numero / 1_000_000).toFixed(2)} MB`;
  if (numero > 1_000) return `${Math.round(numero / 1_000)} KB`;
  return `${numero} B`;
}

function valorOu(valor, fallback = "--") {
  return valor === null || valor === undefined || valor === "" ? fallback : valor;
}

function valorNumeroOu(valor, fallback = "--") {
  return valor === null || valor === undefined || valor === "" ? fallback : formatarNumero(valor);
}

function dataHoraOu(valor, fallback = "--") {
  if (!valor) return fallback;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return fallback;
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function percentualOu(valor, fallback = "--") {
  if (valor === null || valor === undefined || valor === "") return fallback;
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Number(valor) || 0)}%`;
}

function numeroCompacto(valor, fallback = "--") {
  if (valor === null || valor === undefined || valor === "") return fallback;
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(valor) || 0);
}

function larguraBarra(valor, maximo) {
  const numero = Number(valor || 0);
  const max = Number(maximo || 0);
  if (!max) return 0;
  return Math.max(4, Math.min(100, Math.round((numero / max) * 100)));
}

function componente(brand, chave) {
  return brand?.componentes?.[chave] ?? 0;
}

function renderizarScoreGrid() {
  const brands = dadosExternal?.brands || [];
  scoreGrid.innerHTML = brands
    .map((brand) => {
      const ranking = dadosExternal?.ranking?.find((item) => item.id === brand.id)?.posicao || "-";
      return `
        <article class="score-card ${statusScore(brand.scoreFinal)}">
          <div>
            <span>#${ranking} ${brand.alias}</span>
            <strong>${brand.scoreFinal}</strong>
          </div>
          <div class="score-ring" style="--score: ${brand.scoreFinal}%">${brand.scoreFinal}</div>
          <p>Tecnico ${componente(brand, "tecnico")} | Social ${componente(brand, "social")} | SEO ${componente(brand, "seo")}</p>
        </article>
      `;
    })
    .join("");
}

function renderizarRanking() {
  const brands = [...(dadosExternal?.brands || [])].sort((a, b) => b.scoreFinal - a.scoreFinal);
  rankingTable.innerHTML = brands
    .map(
      (brand, index) => `
        <tr>
          <td>#${index + 1}</td>
          <td><strong>${escaparHtml(brand.nome)}</strong><span>${escaparHtml(brand.alias)}</span></td>
          <td><span class="score-pill ${statusScore(brand.scoreFinal)}">${brand.scoreFinal}</span></td>
          <td>${componente(brand, "tecnico")}</td>
          <td>${componente(brand, "social")}</td>
          <td>${componente(brand, "seo")}</td>
          <td>${componente(brand, "reputacao")}</td>
          <td>${componente(brand, "jornada")}</td>
          <td>${componente(brand, "promocoes")}</td>
          <td>${componente(brand, "compliance")}</td>
        </tr>
      `,
    )
    .join("");
}

function renderizarHistorico() {
  const historico = dadosExternal?.historico || [];
  const ultimo = historico.at(-1) || {};
  const barras = marcas
    .map((marca) => {
      const valor = ultimo[marca.id] || brandPayload(marca.id)?.scoreFinal || 0;
      return `
        <div class="history-row">
          <span>${marca.alias}</span>
          <div class="history-bar"><span style="width: ${valor}%; background: ${marca.cor}"></span></div>
          <strong>${valor || "--"}</strong>
        </div>
      `;
    })
    .join("");
  historyChart.innerHTML = `
    <div class="history-head">
      <strong>Evolucao diaria</strong>
      <span>${historico.length ? historico.at(-1).date : "sem historico"}</span>
    </div>
    ${barras}
  `;
}

function renderizarWebsitePerformance() {
  websitePerformanceBoard.innerHTML = (dadosExternal?.brands || [])
    .map((brand) => {
      const mobile = brand.pagespeed?.mobile || {};
      const desktop = brand.pagespeed?.desktop || {};
      const site = brand.site || {};
      const erros = [...(mobile.technicalErrors || []), ...(desktop.technicalErrors || []), ...(site.alertas || [])].slice(0, 3);
      return `
        <article class="module-card">
          <div class="module-card-head">
            <strong>${escaparHtml(brand.nome)}</strong>
            <span class="score-pill ${statusScore(componente(brand, "tecnico"))}">${componente(brand, "tecnico")}</span>
          </div>
          <div class="mini-grid">
            <span>Mobile <strong>${valorOu(mobile.performance)}</strong></span>
            <span>Desktop <strong>${valorOu(desktop.performance)}</strong></span>
            <span>SEO PSI <strong>${valorOu(media([mobile.seo, desktop.seo])?.toFixed(0))}</strong></span>
            <span>A11y <strong>${valorOu(media([mobile.accessibility, desktop.accessibility])?.toFixed(0))}</strong></span>
            <span>Best practices <strong>${valorOu(media([mobile.bestPractices, desktop.bestPractices])?.toFixed(0))}</strong></span>
            <span>Requests <strong>${valorOu(mobile.requests || desktop.requests)}</strong></span>
            <span>Tamanho <strong>${formatarBytes(mobile.pageBytes || desktop.pageBytes || site.htmlBytes)}</strong></span>
            <span>HTML <strong>${formatarBytes(site.htmlBytes)}</strong></span>
          </div>
          <p class="module-note">${erros.length ? erros.map(escaparHtml).join(" | ") : "Sem erros tecnicos publicos no ultimo ciclo local."}</p>
        </article>
      `;
    })
    .join("");
}

function renderizarSocial() {
  socialBoard.innerHTML = (dadosExternal?.brands || [])
    .map((brand) => {
      const links = brand.site?.metricas?.socialLinks || {};
      const manual = brand.manual || {};
      const instagram = instagramPayload(brand.id) || {};
      const redes = ["instagram", "tiktok", "twitter", "youtube", "linkedin"]
        .map((rede) => `<span class="${links[rede] ? "check-ok" : "check-miss"}">${rede}</span>`)
        .join("");
      return `
        <article class="module-row app-store-row">
          <div>
            <strong>${escaparHtml(brand.nome)}</strong>
            <span>${redes}${instagram.url ? ` <a href="${escaparHtml(instagram.url)}" target="_blank" rel="noreferrer">@${escaparHtml(instagram.username)}</a>` : ""}</span>
          </div>
          <div><strong>${valorNumeroOu(instagram.followers ?? manual.followers)}</strong><span>seguidores</span></div>
          <div><strong>${valorNumeroOu(instagram.posts7 ?? manual.posts7)}</strong><span>posts 7d</span></div>
          <div><strong>${valorNumeroOu(instagram.posts30 ?? manual.posts30)}</strong><span>posts 30d</span></div>
          <div><strong>${percentualOu(instagram.engagementRate ?? manual.engagement)}</strong><span>engajamento</span></div>
          <div><strong>${valorNumeroOu(instagram.avgViews ?? manual.avgViews)}</strong><span>views medias</span></div>
          <div><strong>${dataHoraOu(instagram.lastPostDate ?? manual.lastPost)}</strong><span>ultimo post</span></div>
          <div><strong>${componente(brand, "social")}</strong><span>score social</span></div>
        </article>
      `;
    })
    .join("");
}

function renderizarSeo() {
  seoBoard.innerHTML = (dadosExternal?.brands || [])
    .map((brand) => {
      const seo = brand.site?.metricas?.seo || {};
      return `
        <article class="module-row seo-row">
          <div>
            <strong>${escaparHtml(brand.nome)}</strong>
            <span>${escaparHtml(seo.title || "Titulo nao detectado")}</span>
          </div>
          <div><strong>${seo.metaDescription ? "ok" : "falha"}</strong><span>meta description</span></div>
          <div><strong>${seo.h1 ? "ok" : "falha"}</strong><span>H1</span></div>
          <div><strong>${seo.canonical ? "ok" : "falha"}</strong><span>canonical</span></div>
          <div><strong>${seo.robots ? "ok" : "falha"}</strong><span>robots.txt</span></div>
          <div><strong>${seo.sitemap ? "ok" : "falha"}</strong><span>sitemap.xml</span></div>
          <div><strong>${seo.schemaOrg ? "ok" : "falha"}</strong><span>schema.org</span></div>
          <div><strong>${seo.openGraph || 0}</strong><span>open graph</span></div>
          <div><strong>${componente(brand, "seo")}</strong><span>score SEO</span></div>
        </article>
      `;
    })
    .join("");
}

function renderizarReputacao() {
  reputationBoard.innerHTML = (dadosExternal?.brands || [])
    .map((brand) => {
      const termos = brand.site?.metricas?.termosRisco || [];
      const manual = brand.manual || {};
      const riscos = termos.filter((item) => item.total).map((item) => `${item.termo}: ${item.total}`).join(" | ") || "sem termos de risco na home";
      return `
        <article class="module-row">
          <div>
            <strong>${escaparHtml(brand.nome)}</strong>
            <span>${escaparHtml(riscos)}</span>
          </div>
          <div><strong>${valorOu(manual.sentiment, "neutro")}</strong><span>sentimento</span></div>
          <div><strong>${valorOu(manual.reclameAqui, "--")}</strong><span>Reclame Aqui</span></div>
          <div><strong>${valorOu(manual.googleReviews, "--")}</strong><span>Google reviews</span></div>
          <div><strong>${valorOu(manual.riskNotes, "--")}</strong><span>notas risco</span></div>
          <div><strong>${componente(brand, "reputacao")}</strong><span>score reputacao</span></div>
        </article>
      `;
    })
    .join("");
}

function renderizarJourney() {
  journeyBoard.innerHTML = (dadosExternal?.brands || [])
    .map((brand) => {
      const jornada = brand.site?.metricas?.jornada || {};
      const checks = jornada.checks || {};
      const itens = Object.entries(checks)
        .map(([nome, ok]) => `<span class="${ok ? "check-ok" : "check-miss"}">${nome}</span>`)
        .join("");
      return `
        <article class="module-row journey-row">
          <div>
            <strong>${escaparHtml(brand.nome)}</strong>
            <span>${itens}</span>
          </div>
          <div><strong>${componente(brand, "jornada")}</strong><span>score jornada</span></div>
          <div><strong>${jornada.playwright?.status || "pendente"}</strong><span>Playwright</span></div>
          <div><strong>${jornada.playwright?.runner || "public-journey-audit.mjs"}</strong><span>runner</span></div>
        </article>
      `;
    })
    .join("");
}

function renderizarPromocoes() {
  promotionsBoard.innerHTML = (dadosExternal?.brands || [])
    .map((brand) => {
      const promo = brand.site?.metricas?.promocoes || {};
      const termos = (promo.termos || []).filter((item) => item.total).map((item) => `${item.termo}: ${item.total}`).join(" | ") || "sem termos fortes";
      return `
        <article class="module-row">
          <div>
            <strong>${escaparHtml(brand.nome)}</strong>
            <span>${escaparHtml(termos)}</span>
          </div>
          <div><strong>${promo.banners?.length || 0}</strong><span>banners</span></div>
          <div><strong>${promo.bonusCadastro ? "sim" : "nao"}</strong><span>bonus cadastro</span></div>
          <div><strong>${promo.campanhasCassino ? "sim" : "nao"}</strong><span>campanha cassino</span></div>
          <div><strong>${promo.campanhasSportsbook ? "sim" : "nao"}</strong><span>campanha sportsbook</span></div>
          <div><strong>${componente(brand, "promocoes")}</strong><span>score conteudo</span></div>
        </article>
      `;
    })
    .join("");
}

function renderizarAppStore() {
  appStoreBoard.innerHTML = (dadosExternal?.brands || [])
    .map((brand) => {
      const manual = brand.manual || {};
      const googlePlay = googlePlayPayload(brand.id) || {};
      const appNome = googlePlay.appId || manual.appName || "App ainda nao informado";
      const nota = googlePlay.ratingText || manual.appRating;
      const avaliacoes = googlePlay.reviewsText || manual.appReviews;
      const downloads = googlePlay.downloadsText || "--";
      const coleta = googlePlay.collectedOk ? dataHoraOu(dadosGooglePlay?.collectedAt) : googlePlay.error || "sem coleta";
      const link = googlePlay.detailsUrl || "#";
      return `
        <article class="module-row">
          <div>
            <strong>${escaparHtml(brand.nome)}</strong>
            <span>${link === "#" ? escaparHtml(appNome) : `<a href="${escaparHtml(link)}" target="_blank" rel="noreferrer">${escaparHtml(appNome)}</a>`}</span>
          </div>
          <div><strong>${valorOu(downloads)}</strong><span>downloads</span></div>
          <div><strong>${valorOu(nota)}</strong><span>nota media</span></div>
          <div><strong>${valorOu(avaliacoes)}</strong><span>avaliacoes</span></div>
          <div><strong>${valorOu(manual.appVersion)}</strong><span>versao</span></div>
          <div><strong>${valorOu(coleta)}</strong><span>coleta Play</span></div>
          <div><strong>${valorOu(componente(brand, "appStore"))}</strong><span>score app</span></div>
        </article>
      `;
    })
    .join("");
}

function renderizarCompliance() {
  complianceBoard.innerHTML = (dadosExternal?.brands || [])
    .map((brand) => {
      const compliance = brand.site?.metricas?.compliance || {};
      const checks = compliance.checks || {};
      const itens = Object.entries(checks)
        .map(([nome, ok]) => `<span class="${ok ? "check-ok" : "check-miss"}">${nome}</span>`)
        .join("");
      return `
        <article class="module-card">
          <div class="module-card-head">
            <strong>${escaparHtml(brand.nome)}</strong>
            <span class="score-pill ${statusScore(componente(brand, "compliance"))}">${componente(brand, "compliance")}</span>
          </div>
          <div class="check-cloud">${itens}</div>
        </article>
      `;
    })
    .join("");
}

function renderizarManualInputs() {
  manualInputGrid.innerHTML = marcas
    .map((marca) => {
      const manual = brandPayload(marca.id)?.manual || {};
      const campo = (nome, rotulo, tipo = "text") => `
        <label>
          ${rotulo}
          <input name="${nome}" type="${tipo}" value="${escaparHtml(manual[nome] ?? "")}" />
        </label>
      `;
      return `
        <form class="manual-card" data-brand="${marca.id}">
          <div class="module-card-head">
            <strong>${marca.nome}</strong>
            <span>${marca.alias || marca.dominio}</span>
          </div>
          <div class="manual-fields">
            ${campo("followers", "Seguidores", "number")}
            ${campo("engagement", "Engajamento %", "number")}
            ${campo("socialScore", "Score social", "number")}
            ${campo("posts7", "Posts 7d", "number")}
            ${campo("posts30", "Posts 30d", "number")}
            ${campo("avgViews", "Views medias", "number")}
            ${campo("lastPost", "Ultimo post", "date")}
            ${campo("reputationScore", "Score reputacao", "number")}
            ${campo("complaints7", "Reclamacoes 7d", "number")}
            ${campo("complaints30", "Reclamacoes 30d", "number")}
            ${campo("sentimentScore", "Score sentimento", "number")}
            ${campo("sentiment", "Sentimento")}
            ${campo("reclameAqui", "Reclame Aqui")}
            ${campo("googleReviews", "Google reviews")}
            ${campo("appName", "Nome do app")}
            ${campo("appScore", "Score app", "number")}
            ${campo("appRating", "Nota app", "number")}
            ${campo("appReviews", "Reviews app", "number")}
            ${campo("appVersion", "Versao app")}
            ${campo("appUpdatedAt", "Atualizacao app", "date")}
          </div>
          <label>
            Observacoes
            <textarea name="notes">${escaparHtml(manual.notes ?? "")}</textarea>
          </label>
          <label>
            Termos de risco / noticias / reviews recentes
            <textarea name="riskNotes">${escaparHtml(manual.riskNotes ?? "")}</textarea>
          </label>
          <button class="primary-button manual-save" type="button">Salvar inputs</button>
        </form>
      `;
    })
    .join("");

  document.querySelectorAll(".manual-save").forEach((botao) => {
    botao.addEventListener("click", () => salvarInputManual(botao.closest("form")));
  });
}

function nomeFonte(source) {
  return {
    instagram_graph: "Instagram Graph",
    instagram_public_daily: "Instagram diario",
    youtube_data: "YouTube Data",
    tiktok_business: "TikTok Business",
    hugme_reclame_aqui: "HugMe/Reclame Aqui",
    google_play: "Google Play",
    google_play_daily: "Google Play diario",
    app_store_connect: "App Store Connect",
    news_risk: "Noticias/Risco",
    manual: "Manual",
  }[source] || source;
}

function resumoInstagram(brand) {
  if (!brand?.collectedOk) return `${brand?.name || "--"}: sem coleta`;
  return `${brand.name}: ${formatarNumero(brand.followers)} seg. | ${formatarNumero(brand.posts7)} posts 7d | ${formatarNumero(brand.posts30)} posts 30d | ${percentualOu(brand.engagementRate)} eng.`;
}

function resumoGooglePlay(brand) {
  if (!brand?.collectedOk) return `${brand?.name || "--"}: sem coleta`;
  return `${brand.name}: ${brand.downloadsText || "--"} downloads | nota ${brand.ratingText || "--"} | ${brand.reviewsText || "--"}`;
}

function renderizarBarrasFonte(brands, metrica, maximo, formatador) {
  return brands
    .map(
      (brand) => `
        <div class="source-bar-row">
          <span>${escaparHtml(brand.name || brand.id)}</span>
          <div class="source-bar-track"><i style="width: ${larguraBarra(brand[metrica], maximo)}%"></i></div>
          <strong>${escaparHtml(formatador(brand[metrica], brand))}</strong>
        </div>
      `,
    )
    .join("");
}

function renderizarStatusIntegracoes() {
  const instagramBrands = dadosInstagram?.brands || [];
  const googlePlayBrands = dadosGooglePlay?.brands || [];
  const instagramHistory = dadosInstagram?.historyCount || "--";
  const googlePlayHistory = dadosGooglePlay?.historyCount || "--";
  const totalSeguidores = instagramBrands.reduce((sum, brand) => sum + Number(brand.followers || 0), 0);
  const totalPosts7 = instagramBrands.reduce((sum, brand) => sum + Number(brand.posts7 || 0), 0);
  const mediaEngajamento = media(instagramBrands.map((brand) => brand.engagementRate));
  const maxSeguidores = Math.max(...instagramBrands.map((brand) => Number(brand.followers || 0)), 0);
  const liderInstagram = [...instagramBrands].sort((a, b) => Number(b.followers || 0) - Number(a.followers || 0))[0];
  const totalDownloads = googlePlayBrands.reduce((sum, brand) => sum + Number(brand.downloadsApprox || 0), 0);
  const totalReviews = googlePlayBrands.reduce((sum, brand) => sum + Number(brand.reviewsApprox || 0), 0);
  const mediaRating = media(googlePlayBrands.map((brand) => brand.rating));
  const maxDownloads = Math.max(...googlePlayBrands.map((brand) => Number(brand.downloadsApprox || 0)), 0);
  const liderGooglePlay = [...googlePlayBrands].sort((a, b) => Number(b.downloadsApprox || 0) - Number(a.downloadsApprox || 0))[0];

  integrationStatusBoard.innerHTML = `
    <article class="source-dashboard is-instagram">
      <div class="integration-metric-head">
        <div>
          <span>Redes sociais</span>
          <strong>Instagram</strong>
        </div>
        <small>1x por dia</small>
      </div>

      <div class="source-kpi-grid">
        <div><span>Seguidores</span><strong>${numeroCompacto(totalSeguidores)}</strong></div>
        <div><span>Posts 7d</span><strong>${formatarNumero(totalPosts7)}</strong></div>
        <div><span>Engajamento medio</span><strong>${percentualOu(mediaEngajamento)}</strong></div>
        <div><span>Lider</span><strong>${escaparHtml(liderInstagram?.name || "--")}</strong></div>
      </div>

      <div class="source-chart-panel">
        <div class="source-chart-head">
          <span>Seguidores por marca</span>
          <strong>${escaparHtml(liderInstagram?.username || "")}</strong>
        </div>
        ${renderizarBarrasFonte(instagramBrands, "followers", maxSeguidores, (valor) => numeroCompacto(valor))}
      </div>

      <div class="source-mini-table">
        ${instagramBrands
          .map(
            (brand) => `
              <a href="${escaparHtml(brand.url || "#")}" target="_blank" rel="noreferrer">
                <strong>${escaparHtml(brand.name)}</strong>
                <span>${formatarNumero(brand.posts30)} posts 30d</span>
                <span>${percentualOu(brand.engagementRate)}</span>
                <span>${dataHoraOu(brand.lastPostDate)}</span>
              </a>
            `,
          )
          .join("")}
      </div>

      <div class="integration-metric-foot">
        <span>Ultima coleta: ${dataHoraOu(dadosInstagram?.collectedAt)}</span>
        <span>Historico: ${escaparHtml(instagramHistory)}</span>
      </div>
    </article>

    <article class="source-dashboard is-google-play">
      <div class="integration-metric-head">
        <div>
          <span>Apps</span>
          <strong>Google Play</strong>
        </div>
        <small>1x por dia</small>
      </div>

      <div class="source-kpi-grid">
        <div><span>Downloads</span><strong>${numeroCompacto(totalDownloads)}</strong></div>
        <div><span>Avaliacoes</span><strong>${numeroCompacto(totalReviews)}</strong></div>
        <div><span>Nota media</span><strong>${mediaRating === null ? "--" : mediaRating.toFixed(1).replace(".", ",")}</strong></div>
        <div><span>Lider</span><strong>${escaparHtml(liderGooglePlay?.name || "--")}</strong></div>
      </div>

      <div class="source-chart-panel">
        <div class="source-chart-head">
          <span>Downloads por app</span>
          <strong>${escaparHtml(liderGooglePlay?.appId || "")}</strong>
        </div>
        ${renderizarBarrasFonte(googlePlayBrands, "downloadsApprox", maxDownloads, (_valor, brand) => brand.downloadsText || "--")}
      </div>

      <div class="source-mini-table">
        ${googlePlayBrands
          .map(
            (brand) => `
              <a href="${escaparHtml(brand.detailsUrl || "#")}" target="_blank" rel="noreferrer">
                <strong>${escaparHtml(brand.name)}</strong>
                <span>${escaparHtml(brand.appId || "--")}</span>
                <span>nota ${escaparHtml(brand.ratingText || "--")}</span>
                <span>${escaparHtml(brand.reviewsText || "--")}</span>
              </a>
            `,
          )
          .join("")}
      </div>

      <div class="integration-metric-foot">
        <span>Ultima coleta: ${dataHoraOu(dadosGooglePlay?.collectedAt)}</span>
        <span>Historico: ${escaparHtml(googlePlayHistory)}</span>
      </div>
    </article>
  `;
}

function renderizarTabelaIntegracoes() {
  const latestByBrand = dadosIntegracoes?.latestByBrand || {};
  externalMetricsTable.innerHTML = marcas
    .map((marca) => {
      const metricas = latestByBrand[marca.id] || {};
      const googlePlay = googlePlayPayload(marca.id) || {};
      const instagram = instagramPayload(marca.id) || {};
      const fontesSet = new Set();
      if (instagram.collectedOk) fontesSet.add("instagram_public_daily");
      if (googlePlay.collectedOk) fontesSet.add("google_play_daily");
      const fontes = Array.from(fontesSet).map(nomeFonte).join(", ") || "Manual pendente";
      const termos = Array.isArray(metricas.risk_terms) ? metricas.risk_terms.join(", ") : "";
      const appNome = googlePlay.appId || metricas.app_name;
      const appNota = googlePlay.ratingText || metricas.app_rating;
      const appReviews = googlePlay.reviewsText || metricas.app_reviews;
      const appAtualizado = googlePlay.collectedOk ? dataHoraOu(dadosGooglePlay?.collectedAt) : metricas.app_last_update;
      return `
        <tr>
          <td><strong>${marca.nome}</strong><span>${marca.dominio}</span></td>
          <td>${escaparHtml(fontes)}</td>
          <td>${instagram.url ? `<a href="${escaparHtml(instagram.url)}" target="_blank" rel="noreferrer">${valorNumeroOu(instagram.followers)}</a>` : valorNumeroOu(metricas.followers)}</td>
          <td>${percentualOu(instagram.engagementRate ?? metricas.engagement_rate)}</td>
          <td>${valorNumeroOu(instagram.posts7 ?? metricas.posts_7d)}</td>
          <td>${valorNumeroOu(instagram.posts30 ?? metricas.posts_30d)}</td>
          <td>${valorNumeroOu(instagram.avgViews ?? metricas.avg_views)}</td>
          <td>${dataHoraOu(instagram.lastPostDate ?? metricas.last_post_date)}</td>
          <td>${valorOu(metricas.social_score)}</td>
          <td>${valorOu(metricas.reputation_score)}</td>
          <td>${valorNumeroOu(metricas.complaints_7d)}</td>
          <td>${valorNumeroOu(metricas.complaints_30d)}</td>
          <td>${valorNumeroOu(metricas.google_reviews)}</td>
          <td>${escaparHtml(valorOu(googlePlay.downloadsText))}</td>
          <td>${googlePlay.detailsUrl ? `<a href="${escaparHtml(googlePlay.detailsUrl)}" target="_blank" rel="noreferrer">${escaparHtml(valorOu(appNome))}</a>` : escaparHtml(valorOu(appNome))}</td>
          <td>${valorOu(appNota)}</td>
          <td>${valorOu(appReviews)}</td>
          <td>${escaparHtml(valorOu(metricas.app_version))}</td>
          <td>${valorOu(appAtualizado)}</td>
          <td>${valorOu(metricas.sentiment_score)}</td>
          <td>${escaparHtml(termos || "--")}</td>
        </tr>
      `;
    })
    .join("");
  const rows = dadosIntegracoes?.table?.rows?.length || 0;
  const coletaPlay = dadosGooglePlay?.collectedAt ? ` Google Play diario: ${dataHoraOu(dadosGooglePlay.collectedAt)}.` : "";
  const coletaInstagram = dadosInstagram?.collectedAt ? ` Instagram diario: ${dataHoraOu(dadosInstagram.collectedAt)}.` : "";
  externalMetricsFootnote.textContent = `${formatarNumero(rows)} registros em external_brand_metrics. Snapshots online atualizados 1x por dia.${coletaInstagram}${coletaPlay}`;
}

async function carregarIntegracoesExternas() {
  try {
    dadosIntegracoes = await carregarJsonComFallback([
      "/api/external-brand-metrics",
      "data/external-brand-metrics-static.json",
    ]);
    integrationsState.textContent = dadosIntegracoes?.table ? "Snapshots carregados" : "Tabela carregada";
    renderizarStatusIntegracoes();
    renderizarTabelaIntegracoes();
  } catch (erro) {
    integrationsState.textContent = "Falha nas integracoes";
    integrationStatusBoard.innerHTML = "";
    externalMetricsTable.innerHTML = `<tr><td colspan="21">Nao foi possivel carregar external_brand_metrics: ${escaparHtml(erro.message)}</td></tr>`;
  }
}

async function carregarGooglePlayMetrics() {
  try {
    dadosGooglePlay = await carregarJsonComFallback(["data/google-play-metrics.json"]);
    const historicoGooglePlay = await carregarJsonComFallback(["data/google-play-history.json"]).catch(() => null);
    dadosGooglePlay.historyCount = historicoGooglePlay?.checks?.length || 0;
    renderizarAppStore();
    if (dadosIntegracoes) {
      renderizarStatusIntegracoes();
      renderizarTabelaIntegracoes();
    }
  } catch (erro) {
    dadosGooglePlay = { brands: [] };
    escreverTerminal(`Google Play diario indisponivel: ${erro.message}`);
    renderizarAppStore();
  }
}

async function carregarInstagramMetrics() {
  try {
    dadosInstagram = await carregarJsonComFallback(["data/instagram-metrics.json"]);
    const historicoInstagram = await carregarJsonComFallback(["data/instagram-history.json"]).catch(() => null);
    dadosInstagram.historyCount = historicoInstagram?.checks?.length || 0;
    renderizarSocial();
    if (dadosIntegracoes) {
      renderizarStatusIntegracoes();
      renderizarTabelaIntegracoes();
    }
  } catch (erro) {
    dadosInstagram = { brands: [] };
    escreverTerminal(`Instagram diario indisponivel: ${erro.message}`);
    renderizarSocial();
  }
}

async function rodarIntegracoesExternas() {
  integrationsState.textContent = "Atualizando snapshots...";
  escreverTerminal("atualizando snapshots de integracoes externas");
  try {
    const resposta = await fetch("/api/integrations/run");
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    await resposta.json();
    integrationsState.textContent = "Integracoes atualizadas";
    escreverTerminal("external_brand_metrics atualizado");
    await carregarIntegracoesExternas();
    await coletarDados();
  } catch (erro) {
    await carregarIntegracoesExternas();
    await carregarGooglePlayMetrics();
    integrationsState.textContent = "Snapshots diarios carregados";
    escreverTerminal("site online usa snapshots diarios do GitHub Actions; APIs ao vivo ficam no servidor Node local");
  }
}

function renderizarModulosExternos() {
  renderizarScoreGrid();
  renderizarRanking();
  renderizarHistorico();
  renderizarWebsitePerformance();
  renderizarSocial();
  renderizarSeo();
  renderizarReputacao();
  renderizarJourney();
  renderizarPromocoes();
  renderizarAppStore();
  renderizarCompliance();
  renderizarManualInputs();
}

async function salvarInputManual(form) {
  if (!form) return;
  const values = Object.fromEntries(new FormData(form).entries());
  manualState.textContent = "Salvando...";
  try {
    const resposta = await fetch("/api/manual-inputs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId: form.dataset.brand, values }),
    });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    manualState.textContent = "Inputs salvos";
    escreverTerminal(`inputs manuais salvos para ${form.dataset.brand}`);
    await coletarDados();
  } catch (erro) {
    manualState.textContent = "Falha ao salvar";
    escreverTerminal(`erro ao salvar input manual: ${erro.message}`);
  }
}

async function rodarPageSpeed() {
  pagespeedState.textContent = "Rodando PageSpeed...";
  escreverTerminal("coleta PageSpeed iniciada para as tres marcas");
  try {
    const resposta = await fetch("/api/pagespeed/all");
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    pagespeedState.textContent = "PageSpeed atualizado";
    escreverTerminal("PageSpeed concluido e salvo no cache local");
    await coletarDados();
  } catch (erro) {
    pagespeedState.textContent = "Falha no PageSpeed";
    escreverTerminal(`erro PageSpeed: ${erro.message}`);
  }
}

async function coletarDados() {
  document.querySelector("#collection-state").textContent = "Coletando...";
  escreverTerminal("coletando dados publicos das tres marcas");

  try {
    const payload = await carregarJsonComFallback([
      "/api/external-ceo",
      "data/external-ceo-static.json",
    ]);
    dadosExternal = payload;
    dadosSites = payload.sites || [];
    const atualizadoEm = new Date(payload.atualizadoEm || Date.now());
    document.querySelector("#last-refresh").textContent = `Coleta em ${atualizadoEm.toLocaleTimeString("pt-BR")}`;
    document.querySelector("#collection-state").textContent = payload.origem === "fallback-estatico" ? "Snapshot carregado" : "Coleta concluida";

    atividades.unshift({
      agente: "Monitor de Sites",
      evento: `coletou ${dadosSites.length} sites publicos em tempo real`,
      tempo: "agora",
    });
    atividades = atividades.slice(0, 8);
  } catch (erro) {
    document.querySelector("#collection-state").textContent = "Falha na coleta";
    atividades.unshift({
      agente: "Monitor de Sites",
      evento: `falha ao coletar dados publicos: ${erro.message}`,
      tempo: "agora",
    });
    escreverTerminal(`erro de coleta: ${erro.message}`);
  }

  renderizarMarcas();
  renderizarQuadroSites();
  renderizarModulosExternos();
  renderizarAtividades();
  atualizarMetricas();
}

document.querySelectorAll(".segment").forEach((botao) => {
  botao.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach((item) => item.classList.remove("is-selected"));
    botao.classList.add("is-selected");
    filtroAtual = botao.dataset.filter;
    renderizarAgentes();
  });
});

busca.addEventListener("input", renderizarAgentes);

document.querySelector("#sync-button").addEventListener("click", coletarDados);
document.querySelector("#force-fetch").addEventListener("click", coletarDados);
document.querySelector("#pagespeed-button").addEventListener("click", rodarPageSpeed);
document.querySelector("#run-integrations-button").addEventListener("click", rodarIntegracoesExternas);

document.querySelector("#briefing-button").addEventListener("click", () => {
  const online = dadosSites.filter((site) => site.ok).length;
  const totalJogos = dadosSites.reduce((soma, site) => soma + (site.metricas?.totalJogosDetectados || 0), 0);
  const lider = [...(dadosExternal?.brands || [])].sort((a, b) => b.scoreFinal - a.scoreFinal)[0];
  escreverTerminal(
    `resumo do ceo: ${online}/3 sites ativos, ${formatarNumero(totalJogos)} jogos publicos, lider ${lider?.alias || "--"} com score ${lider?.scoreFinal || "--"}`,
  );
});

document.querySelector("#compact-toggle").addEventListener("click", () => {
  document.body.classList.toggle("compact-mode");
});

document.querySelector("#add-event").addEventListener("click", () => {
  const fonte = agentes[Math.floor(Math.random() * agentes.length)];
  const eventos = [
    "recalculou prioridade de coleta entre as tres marcas",
    "sinalizou pendencia de API interna para metricas financeiras",
    "detectou divergencia entre catalogos publicos",
    "registrou comando externo publico no log de auditoria",
  ];
  atividades.unshift({
    agente: fonte.nome,
    evento: eventos[Math.floor(Math.random() * eventos.length)],
    tempo: "agora",
  });
  atividades = atividades.slice(0, 8);
  renderizarAtividades();
});

renderizarMarcas();
renderizarQuadroSites();
renderizarRotina();
renderizarAgentes();
renderizarPrioridades();
renderizarControles();
renderizarAtividades();
renderizarComandos();
renderizarModulosExternos();
atualizarMetricas();
atualizarRelogio();
carregarIntegracoesExternas();
carregarGooglePlayMetrics();
carregarInstagramMetrics();
coletarDados();
setInterval(atualizarRelogio, 15_000);
setInterval(coletarDados, 120_000);

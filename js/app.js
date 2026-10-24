/* ==========================================================================
   JG MARKETING — Portfólio v8
   Um único arquivo, sem dependências. Funciona aberto direto do disco.
   ========================================================================== */
(() => {
  "use strict";

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const WA = "5586994432717";
  const IG = "https://www.instagram.com/jgmarketing__/";
  const DRAFT = "jg.brief.v8";

  /* ---------- 0. Fontes no modo local ------------------------------------
     Em produção as fontes são auto-hospedadas (rápidas, offline, sem terceiros).
     Aberto direto do disco (file://), o navegador bloqueia woff2 por CORS —
     então só nesse caso carregamos a versão de CDN para a prévia sair igual. */
  if (location.protocol === "file:") {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(l);
  }

  /* ---------- utilitários ------------------------------------------------ */
  // Liga um evento só se o elemento existir e isola a falha de cada handler,
  // para que um erro pontual nunca interrompa o restante da página.
  const on = (el, evt, fn, opts) => {
    if (!el) return;
    el.addEventListener(evt, (e) => {
      try { fn(e); } catch (err) { console.warn("[JG]", evt, err); }
    }, opts);
  };
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} }
  };

  let toastTimer;
  const toastEl = $("#toast");
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("on"), 3000);
  };

  const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
  const brNum  = (n) => n.toLocaleString("pt-BR");

  $("#yr") && ($("#yr").textContent = String(new Date().getFullYear()));

  /* ---------- 1. Mensagens de WhatsApp por contexto ---------------------- */
  const waTexts = {
    header:  "Olá, João! Vi o portfólio da JG Marketing e quero conversar sobre um projeto para a minha marca.",
    hero:    "Olá, João! Conheci o seu trabalho pelo portfólio. Quero melhorar a comunicação da minha empresa e gostaria de uma orientação inicial.",
    contact: "Olá, João! Vim pelo portfólio da JG Marketing e gostaria de pedir um orçamento. Posso te contar sobre o meu projeto?",
    footer:  "Olá, João! Cheguei ao fim do seu portfólio e quero conversar sobre uma proposta para a minha marca.",
    float:   "Olá, João! Estou navegando pelo seu portfólio e tenho uma dúvida rápida sobre os serviços.",
    dock:    "Olá, João! Vi o seu portfólio e quero falar sobre um projeto. Pode me passar mais detalhes?"
  };
  $$("[data-wa]").forEach((a) => {
    const t = waTexts[a.dataset.wa];
    if (t) a.href = waLink(t);
  });
  $$('a[href*="instagram.com"]').forEach((a) => { a.href = IG; });

  /* ---------- 2. Cabeçalho e menu ---------------------------------------- */
  const nav = $("#nav");
  const burger = $("#burger");
  const sheet = $("#sheet");

  const closeSheet = () => {
    if (!sheet.classList.contains("open")) return;
    sheet.classList.remove("open");
    burger.classList.remove("on");
    burger.setAttribute("aria-expanded", "false");
    sheet.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
  };

  on(burger, "click", () => {
    const open = !sheet.classList.contains("open");
    sheet.classList.toggle("open", open);
    burger.classList.toggle("on", open);
    burger.setAttribute("aria-expanded", String(open));
    sheet.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("is-locked", open);
  });
  $$("a", sheet).forEach((a) => on(a, "click", closeSheet));

  /* ---------- 3. Timeline de capítulos (elemento assinatura) ------------- */
  const timeline  = $("#timeline");
  const track     = $("#track");
  const trackFill = $("#trackFill");
  const trackHead = $("#trackHead");
  const tcNow     = $("#tcNow");
  const chapterNow= $("#chapterNow");
  const actNow    = $("#actNow");
  const thinBar   = $("#thinBar");
  const waFloat   = $("#waFloat");

  const chapters = $$("[data-chapter]");
  const contactSec = $("#contato");
  const dock = $("#dock");
  const DURATION = 240; // duração nominal, em segundos, para o timecode

  const docMax = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);

  // Marcadores de capítulo posicionados pela altura real de cada seção
  const buildTicks = () => {
    $$(".tick", track).forEach((t) => t.remove());
    const max = docMax();
    chapters.forEach((sec, i) => {
      if (i === 0) return;
      const pct = Math.min(100, (sec.offsetTop / max) * 100);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tick";
      b.style.left = pct + "%";
      b.dataset.pct = String(pct);
      b.dataset.id = sec.id;
      const ato = sec.dataset.act;
      const abreAto = ato !== chapters[i - 1].dataset.act;
      if (abreAto) b.classList.add("act");
      b.setAttribute("aria-label", `Ir para ${sec.dataset.chapter}`);
      b.innerHTML = `<span class="tick__lbl">${abreAto ? sec.dataset.actNome + " · " : ""}${sec.dataset.chapter}</span>`;
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        sec.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
      });
      track.appendChild(b);
    });
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  const navLinks = $$("#navLinks a");
  let activeId = "";

  // Indicador único que desliza até o link ativo e acompanha o ponteiro
  const navBox = $("#navLinks");
  const navInd = navBox ? document.createElement("span") : null;
  if (navInd) {
    navInd.className = "nav__ind";
    navInd.setAttribute("aria-hidden", "true");
    navBox.appendChild(navInd);
    navBox.classList.add("has-ind");
  }
  const activeLink = () => navLinks.find((a) => a.classList.contains("on"));
  const placeInd = (a) => {
    if (!navInd) return;
    if (!a || !a.offsetWidth) { navInd.style.opacity = "0"; return; }
    navInd.style.opacity = "1";
    navInd.style.width = Math.max(0, a.offsetWidth - 24) + "px";
    navInd.style.transform = `translateX(${a.offsetLeft + 12}px)`;
  };
  navLinks.forEach((a) => on(a, "pointerenter", () => placeInd(a)));
  on(navBox, "pointerleave", () => placeInd(activeLink()));

  const onScroll = () => {
    const y = scrollY;
    const pct = Math.min(100, Math.max(0, (y / docMax()) * 100));

    nav.classList.toggle("stuck", y > 24);
    if (thinBar) thinBar.style.width = pct + "%";
    if (trackFill) trackFill.style.width = pct + "%";
    if (trackHead) trackHead.style.left = pct + "%";
    if (tcNow) tcNow.textContent = fmtTime((pct / 100) * DURATION);
    if (track) track.setAttribute("aria-valuenow", String(Math.round(pct)));
    $$(".tick", track).forEach((t) => t.classList.toggle("done", Number(t.dataset.pct) <= pct));

    // O botão flutuante some quando a seção de contato já está na tela:
    // ali os quatro canais estão visíveis e ele só atrapalharia o formulário.
    const contactTop = contactSec ? contactSec.offsetTop - innerHeight * 0.75 : Infinity;
    const show = y > innerHeight * 0.6;
    timeline && timeline.classList.toggle("up", show);
    dock && dock.classList.toggle("up", show);
    waFloat && waFloat.classList.toggle("up", show && y < contactTop);

    // capítulo atual
    const line = y + innerHeight * 0.35;
    let current = chapters[0];
    for (const sec of chapters) if (sec.offsetTop <= line) current = sec;
    if (current && current.id !== activeId) {
      activeId = current.id;
      chapterNow && (chapterNow.textContent = current.dataset.chapter);
      actNow && (actNow.textContent = "ATO " + current.dataset.act);
      navLinks.forEach((a) => {
        const on = a.getAttribute("href") === `#${activeId}`;
        a.classList.toggle("on", on);
        on ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
      });
      placeInd(activeLink());
    }
  };

  // Arrastar / clicar na régua para navegar
  const seek = (clientX) => {
    const r = track.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    scrollTo({ top: pct * docMax(), behavior: "auto" });
  };
  let dragging = false;
  track.addEventListener("pointerdown", (e) => {
    dragging = true;
    try { track.setPointerCapture(e.pointerId); } catch { /* segue sem captura */ }
    seek(e.clientX);
  });
  track.addEventListener("pointermove", (e) => { if (dragging) seek(e.clientX); });
  track.addEventListener("pointerup",   () => { dragging = false; });
  track.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.25 : 0.05;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      scrollTo({ top: scrollY + dir * step * docMax(), behavior: calm ? "auto" : "smooth" });
    }
    if (e.key === "Home") { e.preventDefault(); scrollTo({ top: 0, behavior: "smooth" }); }
    if (e.key === "End")  { e.preventDefault(); scrollTo({ top: docMax(), behavior: "smooth" }); }
  });

  addEventListener("scroll", () => { try { onScroll(); } catch (e) { /* ignora */ } }, { passive: true });
  addEventListener("resize", () => { buildTicks(); onScroll(); placeInd(activeLink()); });
  buildTicks();
  onScroll();
  // as fontes mudam a largura dos links: reposiciona o indicador depois delas
  addEventListener("load", () => { buildTicks(); onScroll(); placeInd(activeLink()); });

  /* ---------- 4. Revelação por scroll ------------------------------------ */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("seen");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    $$(".rv").forEach((el) => io.observe(el));
    $$(".figs > div").forEach((el) => io.observe(el));
    $$(".head").forEach((el) => io.observe(el));
  } else {
    $$(".rv").forEach((el) => el.classList.add("seen"));
  }

  // índice de cada filho para o atraso encadeado da entrada
  $$(".svcs, .goals, .systems").forEach((grid) => {
    Array.from(grid.children).forEach((child, i) => child.style.setProperty("--i", i));
  });

  // sinaliza que a página carregou, para as barras do placar correrem
  requestAnimationFrame(() => document.body.classList.add("loaded"));

  /* ---------- Timecode do hero — conta até 12s, o tempo médio do Reel --- */
  const heroTc = $("#heroTc");
  if (heroTc) {
    const fim = 12;                       // 12 s de tempo médio de visualização
    const dur = calm ? 0 : 2600;
    const t0 = performance.now() + 500;
    const passo = (t) => {
      const p = dur ? Math.min(1, Math.max(0, (t - t0) / dur)) : 1;
      const s = Math.floor(p * fim);
      const f = Math.floor((p * fim - s) * 100);
      heroTc.textContent = `00:${String(s).padStart(2, "0")}` + (p < 1 ? `:${String(f).padStart(2, "0")}` : "");
      if (p < 1) requestAnimationFrame(passo);
      else heroTc.textContent = "00:12 · 9:16";
    };
    requestAnimationFrame(passo);
  }

  /* ---------- 5. Contadores ---------------------------------------------- */
  const countUp = (el, to, opts = {}) => {
    if (calm) { el.textContent = opts.format === "br" ? brNum(to) : to + (opts.suffix || ""); return; }
    const dur = 1750;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const val = Math.round(to * eased);
      el.textContent = opts.format === "br" ? brNum(val) : val + (opts.suffix || "");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const counted = new WeakSet();
  const runCounter = (el) => {
    if (counted.has(el)) return;
    counted.add(el);
    const to = Number(el.dataset.count || el.dataset.to || 0);
    countUp(el, to, { format: el.dataset.format, suffix: el.dataset.suffix });
  };

  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.5 });
    $$("[data-count]:not([data-odo])").forEach((el) => co.observe(el));
  } else {
    $$("[data-count]:not([data-odo])").forEach(runCounter);
  }

  /* ---------- 6. Sobreposições (modal, lightbox) ------------------------- */
  let lastFocus = null;

  const openOv = (el) => {
    lastFocus = document.activeElement;
    el.classList.add("on");
    el.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    const first = el.querySelector("[data-close], button, a[href]");
    first && first.focus();
  };
  const closeOv = (el) => {
    el.classList.remove("on");
    el.setAttribute("aria-hidden", "true");
    if (!$$(".ov.on, .lb.on").length) document.body.classList.remove("is-locked");
    lastFocus && lastFocus.focus();
  };

  $$(".ov, .lb").forEach((ov) => {
    ov.addEventListener("click", (e) => {
      if (e.target === ov || e.target.closest("[data-close]")) closeOv(ov);
    });
    // prende o foco dentro da caixa aberta
    ov.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', ov)
        .filter((n) => n.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  });

  addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = $(".ov.on, .lb.on");
    if (open) closeOv(open);
    closeSheet();
  });

  /* ---------- 7. Lightbox das marcas ------------------------------------- */
  // Galeria: as cinco marcas viram uma sequência navegável
  const lb = $("#lb"), lbImg = $("#lbImg"), lbCap = $("#lbCap"), lbCount = $("#lbCount");
  const shots = $$("[data-zoom]");
  let lbAt = 0;

  const showShot = (i, dir = 0) => {
    if (!shots.length) return;
    lbAt = (i + shots.length) % shots.length;
    const btn = shots[lbAt];
    // usa a própria imagem do cartão quando não há caminho separado
    lbImg.src = btn.dataset.zoom || btn.querySelector("img").src;
    lbImg.alt = btn.dataset.zoomCap || "";
    lbCap.textContent = btn.dataset.zoomCap || "";
    if (lbCount) lbCount.textContent = shots.length > 1 ? `${lbAt + 1} / ${shots.length}` : "";
    if (dir && !calm && lbImg.animate) {
      lbImg.animate([{ opacity: 0, transform: `translateX(${dir * 28}px)` }, { opacity: 1, transform: "none" }],
                    { duration: 320, easing: "cubic-bezier(.22,1,.36,1)" });
    }
  };

  shots.forEach((btn, i) => btn.addEventListener("click", () => { showShot(i); openOv(lb); }));
  on($("#lbPrev"), "click", () => showShot(lbAt - 1, -1));
  on($("#lbNext"), "click", () => showShot(lbAt + 1, 1));
  addEventListener("keydown", (e) => {
    if (!lb.classList.contains("on")) return;
    if (e.key === "ArrowLeft")  { e.preventDefault(); showShot(lbAt - 1, -1); }
    if (e.key === "ArrowRight") { e.preventDefault(); showShot(lbAt + 1, 1); }
  });

  // deslizar no toque troca de imagem; o clique que encerra o gesto não fecha a galeria
  let swX = null, swiped = false;
  lb.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") swX = e.clientX; });
  lb.addEventListener("pointerup", (e) => {
    if (swX === null) return;
    const dx = e.clientX - swX;
    swX = null;
    if (Math.abs(dx) > 48) { swiped = true; showShot(lbAt + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); }
  });
  lb.addEventListener("click", (e) => { if (swiped) { swiped = false; e.stopImmediatePropagation(); } }, true);

  /* ---------- 8. Catálogo de serviços ---------------------------------------- */
  const catalog = {
    gestao: {
      kicker: "Serviço · Estratégia e rotina",
      title: "Gestão de redes sociais",
      desc: "Organização da presença da marca para manter frequência, coerência e clareza na comunicação do dia a dia.",
      a: ["Planejamento de temas e pilares", "Calendário de publicações", "Legendas e chamadas para ação", "Direção para stories e formatos", "Ajuste de bio e organização do perfil"],
      b: ["Empresas com Instagram parado ou irregular", "Negócios que precisam organizar a comunicação", "Marcas que querem manter presença mensal"]
    },
    reels: {
      kicker: "Serviço · Conteúdo em vídeo",
      title: "Reels e vídeos curtos",
      desc: "Vídeos verticais construídos para chamar atenção nos primeiros segundos, explicar rápido e conduzir o público a uma ação.",
      a: ["Roteiro e abertura forte", "Seleção de cortes e ritmo", "Texto e legenda na tela", "Trilha e tratamento básico", "Capa e arquivo pronto para publicar"],
      b: ["Produtos e serviços que precisam ser demonstrados", "Conteúdo de venda, humor ou autoridade", "Marcas que querem melhorar retenção"]
    },
    design: {
      kicker: "Serviço · Identidade e campanha",
      title: "Design e campanhas",
      desc: "Peças visuais organizadas para destacar oferta, benefício, preço e posicionamento sem poluir a mensagem.",
      a: ["Artes para feed e stories", "Campanhas sazonais", "Banners e peças promocionais", "Adaptação da identidade visual", "Variações para WhatsApp e anúncio"],
      b: ["Lojas com oferta frequente", "Lançamentos e datas comerciais", "Marcas que precisam parecer mais profissionais"]
    },
    site: {
      kicker: "Serviço · Web e conversão",
      title: "Landing pages e sites",
      desc: "Páginas responsivas que apresentam a empresa com clareza e facilitam o contato do potencial cliente.",
      a: ["Arquitetura das seções", "Design responsivo para celular e computador", "Texto e hierarquia da informação", "Botões, formulário e WhatsApp", "SEO básico e otimização de carregamento"],
      b: ["Empresas sem site profissional", "Campanhas de captação e lançamento", "Portfólios, catálogos e apresentação de serviços"]
    },
    catalogo: {
      kicker: "Serviço · Material comercial",
      title: "Catálogos e apresentações",
      desc: "Documentos digitais que centralizam informação e ajudam o time comercial a apresentar produtos e serviços.",
      a: ["Organização de categorias", "Páginas de produto e serviço", "Aplicação da identidade visual", "Preço, diferencial e chamada", "Arquivo em PDF pronto para envio"],
      b: ["Vendedores e equipes comerciais", "Empresas com muitos produtos", "Propostas, cardápios e apresentações"]
    },
    ads: {
      kicker: "Serviço · Aquisição",
      title: "Campanhas e anúncios",
      desc: "Estrutura de campanha com mensagem, oferta e criativos alinhados ao objetivo comercial da empresa.",
      a: ["Definição da oferta principal", "Criativos para tráfego", "Texto e variações de anúncio", "Configuração básica no Meta Ads", "Direcionamento para página ou WhatsApp"],
      b: ["Negócios que querem gerar contato", "Campanhas de produto e promoção", "Empresas que precisam testar novas ofertas"]
    },
    sistemas: {
      kicker: "Serviço · Tecnologia",
      title: "Sistemas, automações e IA",
      desc: "Ferramentas sob medida para a empresa vender e atender melhor, sem planilha espalhada e sem lead esquecido no WhatsApp.",
      a: ["CRM com funil, metas e divisão de comissões", "Agendamento e atendimento para clínicas e serviços", "Integração com WhatsApp, Instagram e n8n", "Agente de IA para pré-atendimento (SDR)", "Painéis, relatórios e exportações em PDF e Excel"],
      b: ["Equipes comerciais que perdem leads no WhatsApp", "Clínicas e consultórios com agenda cheia", "Negócios que repetem tarefas manuais todo dia"]
    }
  };

  const ovDetail = $("#ovDetail");
  const showDetail = (key, sourceLabel) => {
    const d = catalog[key];
    if (!d) return;
    $("#ovDetailKicker").textContent = d.kicker;
    $("#ovDetailTitle").textContent = d.title;
    $("#ovDetailDesc").textContent = d.desc;
    $("#ovDetailA").innerHTML = d.a.map((i) => `<li>${i}</li>`).join("");
    $("#ovDetailB").innerHTML = d.b.map((i) => `<li>${i}</li>`).join("");
    $("#ovDetailWa").href = waLink(`Olá, João! Vi "${d.title}" no seu portfólio e quero saber sobre entregas, prazo e investimento para a minha empresa.`);
    ovDetail.dataset.pick = d.title;
    openOv(ovDetail);
  };

  $$("[data-svc]").forEach((b) => b.addEventListener("click", () => showDetail(b.dataset.svc)));

  on($("#ovDetailAdd"), "click", () => {
    setPack(ovDetail.dataset.pick || "");
    closeOv(ovDetail);
    toast("Adicionado ao briefing.");
    goTo("#contato");
  });

  /* ---------- 9. Busca rápida — Ctrl/⌘ + K ou "/" ------------------------ */
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const ovCmdk  = $("#ovCmdk");
  const cmdkIn  = $("#cmdkInput");
  const cmdkList = $("#cmdkList");
  const EMAIL = "joguilherme036@gmail.com";

  const copyText = async (text, ok) => {
    try { await navigator.clipboard.writeText(text); toast(ok); }
    catch { toast(`Não consegui copiar: ${text}`); }
  };

  // seções saem dos próprios capítulos da página; ações cobrem o que o visitante mais faz
  const cmds = [
    ...chapters.map((sec) => ({
      group: "Seções", label: sec.dataset.chapter, hint: sec.dataset.mark || "", kw: sec.dataset.actNome || "",
      run: () => goTo("#" + sec.id)
    })),
    { group: "Ações", label: "Falar no WhatsApp", hint: "nova aba", kw: "contato mensagem zap conversa", run: () => window.open(waLink(waTexts.header), "_blank", "noopener") },
    { group: "Ações", label: "Preencher o briefing", kw: "formulario orcamento proposta", run: () => { goTo("#contato"); setTimeout(() => $("#f-name") && $("#f-name").focus({ preventScroll: true }), calm ? 0 : 700); } },
    { group: "Ações", label: "Fazer o diagnóstico", kw: "recomendacao qual pacote", run: () => goTo("#diagnostico") },
    { group: "Ações", label: "Comparar pacotes", kw: "tabela planos formatos", run: () => openOv($("#ovCompare")) },
    { group: "Ações", label: "Copiar e-mail", hint: EMAIL, kw: "email gmail", run: () => copyText(EMAIL, "E-mail copiado.") },
    { group: "Ações", label: "Copiar link do portfólio", kw: "compartilhar url endereco", run: () => copyText(location.href.split("#")[0], "Link copiado.") },
    { group: "Ações", label: "Abrir o Instagram", hint: "@jgmarketing__", kw: "rede social perfil", run: () => window.open(IG, "_blank", "noopener") },
    { group: "Ações", label: "Baixar currículo (PDF)", kw: "cv curriculo resume imprimir experiencia", run: () => printCV() },
    { group: "Ações", label: "Salvar contato no celular", hint: "vCard", kw: "agenda vcard telefone adicionar", run: () => { location.href = "joao-guilherme.vcf"; } },
    { group: "Ações", label: "Salvar proposta em PDF", kw: "imprimir proposta portfolio", run: () => printProposal() }
  ];

  let cmdView = [], cmdAt = 0;
  const renderCmds = () => {
    const q = norm(cmdkIn.value.trim());
    cmdView = cmds.filter((c) => !q || norm(`${c.label} ${c.kw} ${c.group}`).includes(q));
    // com busca, o que começa pelo termo vem antes
    if (q) cmdView.sort((a, b) => Number(norm(b.label).startsWith(q)) - Number(norm(a.label).startsWith(q)));
    cmdAt = 0;
    let html = "", last = "";
    cmdView.forEach((c, i) => {
      if (!q && c.group !== last) { html += `<li class="cmdk__grp" role="presentation">${c.group}</li>`; last = c.group; }
      html += `<li class="cmdk__it" role="option" id="cmd-${i}" data-i="${i}" aria-selected="${i === 0}"><span>${c.label}</span>${c.hint ? `<small>${c.hint}</small>` : ""}</li>`;
    });
    cmdkList.innerHTML = html || '<li class="cmdk__none" role="presentation">Nada encontrado. Tente “pacotes”, “whatsapp” ou “perfil”.</li>';
    cmdView.length ? cmdkIn.setAttribute("aria-activedescendant", "cmd-0") : cmdkIn.removeAttribute("aria-activedescendant");
  };

  const selCmd = (i) => {
    if (!cmdView.length) return;
    cmdAt = (i + cmdView.length) % cmdView.length;
    $$(".cmdk__it", cmdkList).forEach((li) => li.setAttribute("aria-selected", String(Number(li.dataset.i) === cmdAt)));
    const li = $(`#cmd-${cmdAt}`);
    li && li.scrollIntoView({ block: "nearest" });
    cmdkIn.setAttribute("aria-activedescendant", `cmd-${cmdAt}`);
  };
  const runCmd = (i) => {
    const c = cmdView[i];
    if (!c) return;
    closeOv(ovCmdk);
    // depois de fechar, para o foco devolvido não brigar com a rolagem
    setTimeout(() => { try { c.run(); } catch (err) { console.warn("[JG] busca", err); } }, 20);
  };
  const openCmdk = () => {
    if (!ovCmdk || ovCmdk.classList.contains("on")) return;
    const open = $(".ov.on, .lb.on");
    open && closeOv(open);
    closeSheet();
    cmdkIn.value = "";
    renderCmds();
    openOv(ovCmdk);
    cmdkIn.focus();
  };

  // no Mac o atalho aparece como ⌘ K
  if (/Mac|iPhone|iPad/.test(navigator.platform || "")) $$("[data-kbd-mod]").forEach((k) => { k.textContent = "⌘ K"; });

  on($("#btnCmdk"), "click", openCmdk);
  on(cmdkIn, "input", renderCmds);
  on(cmdkIn, "keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); selCmd(cmdAt + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); selCmd(cmdAt - 1); }
    else if (e.key === "Enter") { e.preventDefault(); runCmd(cmdAt); }
  });
  on(cmdkList, "click", (e) => { const li = e.target.closest(".cmdk__it"); li && runCmd(Number(li.dataset.i)); });
  on(cmdkList, "pointermove", (e) => {
    const li = e.target.closest(".cmdk__it");
    if (li && Number(li.dataset.i) !== cmdAt) selCmd(Number(li.dataset.i));
  });
  addEventListener("keydown", (e) => {
    if (!ovCmdk) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      ovCmdk.classList.contains("on") ? closeOv(ovCmdk) : openCmdk();
      return;
    }
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest("input,textarea,select,[contenteditable]")) return;
    if ($(".ov.on, .lb.on")) return;
    e.preventDefault();
    openCmdk();
  });

  /* ---------- 10. Comparação de pacotes ---------------------------------- */
  on($("#btnCompare"), "click", () => openOv($("#ovCompare")));

  /* ---------- 11. FAQ ---------------------------------------------------- */
  $$(".faq__q").forEach((b) => b.addEventListener("click", () => {
    const item = b.closest(".faq__item");
    const open = !item.classList.contains("open");
    item.classList.toggle("open", open);
    b.setAttribute("aria-expanded", String(open));
  }));

  /* ---------- 12. Briefing ----------------------------------------------- */
  const form    = $("#brief");
  const progBar = $("#progBar");
  const progTxt = $("#progTxt");
  const status  = $("#formStatus");
  const fields  = $$("#brief input, #brief select, #brief textarea");
  const packEl  = $("#f-pack");
  const contactEl = $("#f-contact");
  const msgEl   = $("#f-msg");
  const msgCount = $("#msgCount");
  const diag    = { text: "" };   // resumo do diagnóstico, preenchido na seção 14

  // Contato aceito: telefone com DDD, @ do Instagram ou e-mail
  const digitsOf = (s) => s.replace(/\D/g, "");
  const contactOk = (s) => {
    const v = s.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return true;
    if (/^@?[a-z0-9._]{2,30}$/i.test(v) && /[a-z]/i.test(v)) return true;
    const d = digitsOf(v);
    return !/[a-z]/i.test(v) && d.length >= 10 && d.length <= 13;
  };
  const fmtPhone = (s) => {
    if (/[a-z@]/i.test(s)) return s.trim();
    let d = digitsOf(s);
    if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return s.trim();
  };

  // a mensagem original de cada erro fica guardada para voltar depois do aviso de formato
  fields.forEach((f) => {
    const err = f.closest(".field") && $(".field__err", f.closest(".field"));
    if (err) f.dataset.msg = err.textContent;
  });
  const errorOf = (f) => {
    if (f.required && !f.value.trim()) return f.dataset.msg || "Campo obrigatório.";
    if (f === contactEl && f.value.trim() && !contactOk(f.value)) return "Use um telefone com DDD, um @ do Instagram ou um e-mail.";
    return "";
  };
  const showError = (f, msg) => {
    const box = f.closest(".field");
    if (!box) return;
    box.classList.toggle("err", !!msg);
    box.classList.toggle("ok", !msg && f.required && !!f.value.trim());
    msg ? f.setAttribute("aria-invalid", "true") : f.removeAttribute("aria-invalid");
    const err = $(".field__err", box);
    if (err && msg) err.textContent = msg;
  };
  const updateCount = () => {
    if (!msgEl || !msgCount) return;
    const n = msgEl.value.length, max = Number(msgEl.maxLength) || 600;
    msgCount.textContent = `${n} / ${max}`;
    msgCount.classList.toggle("warn", n > max * .9);
  };

  const setPack = (v) => {
    if (!packEl || !v) return;
    packEl.value = v;
    packEl.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const goTo = (sel) => {
    const t = $(sel);
    t && t.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
  };

  const updateProgress = () => {
    const filled = fields.filter((f) => f.value.trim() && f.value !== "Ainda estou avaliando").length;
    const pct = Math.round((filled / fields.length) * 100);
    progBar.style.width = pct + "%";
    progTxt.textContent = pct + "% preenchido";
  };

  const saveDraft = () => {
    const data = {};
    fields.forEach((f) => { data[f.name] = f.value; });
    store.set(DRAFT, data);
  };

  const loadDraft = () => {
    const d = store.get(DRAFT);
    if (!d) return;
    fields.forEach((f) => { if (d[f.name]) f.value = d[f.name]; });
    updateProgress();
  };

  let saveTimer;
  fields.forEach((f) => {
    f.addEventListener("input", () => {
      f.dataset.dirty = "1";
      // com erro na tela, revalida a cada tecla para o aviso sumir assim que ficar certo
      const box = f.closest(".field");
      if (box && box.classList.contains("err")) showError(f, errorOf(f));
      if (f === msgEl) updateCount();
      updateProgress();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveDraft, 400);
    });
    // ao sair do campo: formata o telefone e avisa só o que a pessoa já mexeu
    f.addEventListener("blur", () => {
      if (f === contactEl && f.value.trim()) f.value = fmtPhone(f.value);
      if (f.dataset.dirty) showError(f, errorOf(f));
    });
  });
  loadDraft();
  updateProgress();
  updateCount();

  on($("#btnClearDraft"), "click", () => {
    store.del(DRAFT);
    form.reset();
    fields.forEach((f) => { delete f.dataset.dirty; showError(f, ""); f.closest(".field") && f.closest(".field").classList.remove("ok"); });
    updateProgress();
    updateCount();
    status.textContent = "";
    toast("Rascunho apagado deste aparelho.");
  });

  const validate = () => {
    let first = null;
    fields.forEach((f) => {
      const msg = errorOf(f);
      showError(f, msg);
      if (msg && !first) first = f;
    });
    first && first.focus();
    return !first;
  };

  // Ctrl/⌘ + Enter envia de qualquer campo do formulário
  on(form, "keydown", (e) => {
    if (e.key !== "Enter" || !(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }));
  });

  const buildBrief = () => {
    const v = (id) => ($(id).value || "").trim();
    const lines = [
      "Olá, João! Vim pelo portfólio da JG Marketing e preparei um briefing:",
      "",
      `• Nome: ${v("#f-name") || "—"}`,
      `• Empresa/segmento: ${v("#f-biz") || "—"}`,
      `• Contato: ${v("#f-contact") || "—"}`,
      `• Início desejado: ${v("#f-when")}`,
      `• Interesse: ${v("#f-pack") || "—"}`,
      ...(diag.text ? [`• Diagnóstico: ${diag.text}`] : []),
      "",
      `O que preciso melhorar: ${v("#f-msg") || "—"}`
    ];
    return lines.join("\n");
  };

  on(form, "submit", (e) => {
    e.preventDefault();
    if (!validate()) { status.style.color = "var(--flame)"; status.textContent = "Confira os campos destacados."; return; }
    contactEl && (contactEl.value = fmtPhone(contactEl.value));
    status.style.color = "";
    status.textContent = "WhatsApp aberto com a mensagem pronta. Revise antes de enviar.";
    saveDraft();
    window.open(waLink(buildBrief()), "_blank", "noopener");
    window.JGFX && JGFX.confetti(e.submitter || $(".form__acts .btn--blue"));
  });

  on($("#btnCopy"), "click", async () => {
    const text = buildBrief();
    try {
      await navigator.clipboard.writeText(text);
      toast("Briefing copiado.");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); toast("Briefing copiado."); }
      catch { toast("Não consegui copiar. Selecione o texto manualmente."); }
      ta.remove();
    }
  });

  /* ---------- 13. Pacotes ------------------------------------------------ */
  $$(".pick").forEach((b) => b.addEventListener("click", () => {
    setPack(b.dataset.plan);
    toast(`${b.dataset.plan} adicionado ao briefing.`);
    goTo("#contato");
  }));

  $$("[data-prefill]").forEach((a) => a.addEventListener("click", () => setPack(a.dataset.prefill)));


  /* ---------- 14. Diagnóstico -------------------------------------------- */
  const DIAG = "jg.diag.v1";
  const answers = store.get(DIAG) || {};
  const diagOut = $("#diagOut");
  const diagQs  = $$(".diag__q");
  const planCards = $$(".plan");

  // o pacote recomendado ganha selo e contorno na seção Pacotes
  const markPlan = (plan) => {
    planCards.forEach((card) => {
      const pick = $(".pick", card);
      const is = !!plan && !!pick && pick.dataset.plan === plan;
      card.classList.toggle("plan--rec", is);
      let tag = $(".plan__rec", card);
      if (is && !tag) {
        tag = document.createElement("p");
        tag.className = "plan__rec";
        tag.textContent = "Recomendado para você";
        $("h3", card).before(tag);
      }
      if (!is && tag) tag.remove();
    });
  };

  const dots = (n) => `<span class="diag__dots" aria-hidden="true">${[0, 1, 2].map((i) => `<i${i < n ? ' class="on"' : ""}></i>`).join("")}</span>`;
  const labelOf = (q) => { const b = $('button[aria-pressed="true"]', q); return b ? b.textContent.trim() : ""; };

  const resetDiag = () => {
    Object.keys(answers).forEach((k) => delete answers[k]);
    store.del(DIAG);
    $$(".diag__q button").forEach((b) => b.setAttribute("aria-pressed", "false"));
    recommend();
    const first = $(".diag__q button");
    first && first.focus({ preventScroll: true });
  };
  on(diagOut, "click", (e) => { if (e.target.closest("[data-diag-reset]")) resetDiag(); });

  const recommend = () => {
    const n = Object.keys(answers).length;
    if (n < 3) {
      diag.text = "";
      markPlan(null);
      diagOut.classList.remove("is-done");
      const faltam = 3 - n;
      diagOut.innerHTML = `
        <small>Recomendação inicial · <b class="tnum">${n} de 3</b></small>
        ${dots(n)}
        <strong>${n ? `Falta${faltam > 1 ? "m" : ""} ${faltam} pergunta${faltam > 1 ? "s" : ""}` : "Responda às três perguntas"}</strong>
        <p>O resultado aparece aqui automaticamente, sem enviar nada.</p>
        ${n ? '<button class="diag__reset" type="button" data-diag-reset>Recomeçar</button>' : ""}`;
      return;
    }
    let plan = "Presença Digital";
    let why  = "Um começo organizado para voltar a aparecer com qualidade e frequência controlada.";

    if (answers.goal === "sales" || answers.format === "complete" || answers.freq === "monthly") {
      plan = "Loja Vendendo Mais";
      why  = "Uma solução mais completa para oferta, vídeo e comunicação comercial frequente.";
    }
    if (answers.goal === "authority" || answers.freq === "strong") {
      plan = "Conteúdo Autoridade";
      why  = "Produção mais estratégica para reforçar confiança, posicionamento e valor percebido.";
    }

    diag.text = `${diagQs.map(labelOf).filter(Boolean).join(" · ")} → ${plan}`;
    // reinicia a animação de entrada a cada nova recomendação
    diagOut.classList.remove("is-done");
    void diagOut.offsetWidth;
    diagOut.classList.add("is-done");
    diagOut.innerHTML = `
      <small>Recomendação inicial · <b class="tnum">3 de 3</b></small>
      ${dots(3)}
      <strong>${plan}</strong>
      <p>${why}</p>
      <div class="diag__acts">
        <button class="btn btn--blue btn--sm" type="button" id="diagGo">Levar para o briefing</button>
        <a class="btn btn--wire btn--sm" href="#pacotes">Ver o pacote</a>
        <button class="diag__reset" type="button" data-diag-reset>Refazer</button>
      </div>`;
    markPlan(plan);
    $("#diagGo").addEventListener("click", () => {
      setPack(plan);
      goTo("#contato");
      toast("Recomendação adicionada ao briefing.");
    });
  };

  diagQs.forEach((q) => {
    $$("button", q).forEach((b) => {
      // respostas salvas numa visita anterior voltam marcadas
      if (answers[q.dataset.q] === b.dataset.v) b.setAttribute("aria-pressed", "true");
      b.addEventListener("click", () => {
        answers[q.dataset.q] = b.dataset.v;
        store.set(DIAG, answers);
        $$("button", q).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        recommend();
      });
    });
  });
  recommend();

  /* ---------- 15. Compartilhar e imprimir -------------------------------- */
  on($("#btnShare"), "click", async () => {
    const data = {
      title: "João Guilherme — JG Marketing",
      text: "Portfólio de conteúdo, design e sites da JG Marketing.",
      url: location.href.split("#")[0]
    };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch { /* cancelado */ }
    }
    try { await navigator.clipboard.writeText(data.url); toast("Link copiado."); }
    catch { toast("Copie o endereço da barra do navegador."); }
  });

  // tudo que entra no PDF precisa estar revelado, mesmo o que ainda não passou pela tela
  const prepPrint = (mode) => {
    $$(".rv").forEach((el) => el.classList.add("seen"));
    document.documentElement.classList.toggle("print-cv", mode === "cv");
  };
  const pageTitle = document.title;
  addEventListener("afterprint", () => {
    document.documentElement.classList.remove("print-cv");
    document.title = pageTitle;
  });
  function printProposal() { prepPrint("proposta"); print(); }
  function printCV() {
    prepPrint("cv");
    // o título vira o nome sugerido do arquivo PDF
    document.title = "Currículo — João Guilherme (JG Marketing)";
    toast("Na janela de impressão, escolha “Salvar como PDF”.");
    setTimeout(print, 60);
  }
  on($("#btnPrint"), "click", (e) => { e.preventDefault(); printProposal(); });
  $$("[data-cv]").forEach((b) => on(b, "click", printCV));
  $$("[data-vcf]").forEach((a) => on(a, "click", () => toast("Abrindo o cartão de contato…")));

  /* ---------- 15b. Carrosséis do celular: pontos indicadores --------------- */
  const mqPhone = matchMedia("(max-width:720px)");
  [
    { el: $(".brands"), label: "marca" },
    { el: $(".pillars"), label: "pilar" },
    { el: $(".systems"), label: "sistema" },
    { el: $(".plans"), label: "pacote", start: ".plan--star" }
  ].forEach(({ el, label, start }) => {
    if (!el) return;
    const items = Array.from(el.children);
    if (items.length < 2) return;
    const leftOf = (it) => it.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
    const center = (it, smooth) => el.scrollTo({ left: leftOf(it) - (el.clientWidth - it.offsetWidth) / 2, behavior: smooth && !calm ? "smooth" : "auto" });

    const dots = document.createElement("div");
    dots.className = "dots";
    items.forEach((it, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Ver ${label} ${i + 1} de ${items.length}`);
      b.addEventListener("click", () => center(it, true));
      dots.appendChild(b);
    });
    el.after(dots);

    const update = () => {
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0, dist = Infinity;
      items.forEach((it, i) => {
        const d = Math.abs(leftOf(it) + it.offsetWidth / 2 - mid);
        if (d < dist) { dist = d; best = i; }
      });
      Array.from(dots.children).forEach((d, i) => {
        d.classList.toggle("on", i === best);
        i === best ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current");
      });
    };
    let raf = 0;
    el.addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); }, { passive: true });
    const init = () => {
      // no celular o pacote "Mais escolhido" já começa no centro
      if (mqPhone.matches && start && $(start, el)) center($(start, el), false);
      update();
    };
    init();
    addEventListener("load", init);
    mqPhone.addEventListener && mqPhone.addEventListener("change", init);
  });

  /* ---------- 16. Rolagem suave interna ---------------------------------- */
  $$('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    a.addEventListener("click", (e) => {
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeSheet();
      target.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
      // Documentos de origem opaca (visualizador in-app, iframe com sandbox)
      // proíbem alterar o histórico. O salto já aconteceu; o endereço é extra.
      try { history.replaceState(null, "", id); } catch { /* sem histórico */ }
    });
  });
})();

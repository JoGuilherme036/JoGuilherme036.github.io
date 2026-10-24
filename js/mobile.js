/* ==========================================================================
   JG Marketing — camada do celular (js/mobile.js)
   JavaScript puro, sem biblioteca. Carregado depois de app.js e efeitos.js.

   Regras desta camada
   • Só age na tela do celular (mesma condição de css/mobile.css). Fora dela,
     as peças criadas aqui ficam escondidas por `.m-ui` em style.css.
   • Cada módulo roda dentro de safe(): uma falha nunca derruba o site.
   • prefers-reduced-motion: nada se move sozinho; os estados finais continuam.
   • Nada aqui cria conteúdo: só reorganiza e anima o que já está na página.
   ========================================================================== */
(() => {
  "use strict";

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mq = matchMedia("screen and (max-width:720px)");
  const phone = () => mq.matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const safe = (fn) => { try { fn(); } catch (err) { /* camada opcional */ } };
  const smooth = () => (calm ? "auto" : "smooth");

  // vibração curta nas ações principais (Android; o iOS ignora em silêncio)
  const buzz = (ms = 8) => {
    if (calm || !phone() || !navigator.vibrate) return;
    try { navigator.vibrate(ms); } catch { /* sem vibração */ }
  };

  // toda peça criada aqui leva .m-ui: escondida fora do celular e na impressão
  const ui = (tag, cls, attrs = {}) => {
    const el = document.createElement(tag);
    el.className = `m-ui ${cls}`;
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  const nav = $("#nav");
  const burger = $("#burger");
  const sheet = $("#sheet");
  const tabbar = $("#dock");
  const hero = $("#inicio");
  const chapters = $$("main [data-chapter]");

  const onScroll = [];   // (y, dy, capítulo atual)
  const onResize = [];

  // capítulo cuja abertura já passou de 35% da altura da tela
  const chapterAt = () => {
    const line = innerHeight * .35;
    let cur = chapters[0];
    for (const s of chapters) if (s.getBoundingClientRect().top <= line) cur = s;
    return cur;
  };

  /* ---------- utilitários de carrossel ------------------------------------ */
  const leftIn = (box, it) => it.getBoundingClientRect().left - box.getBoundingClientRect().left + box.scrollLeft;
  const centerOn = (box, it, anim = true) => box.scrollTo({
    left: leftIn(box, it) - (box.clientWidth - it.offsetWidth) / 2,
    behavior: anim && !calm ? "smooth" : "auto"
  });
  // chama cb(índice) sempre que o cartão do centro muda
  const watchCenter = (box, items, cb) => {
    let at = -1, q = 0;
    const read = () => {
      q = 0;
      const mid = box.scrollLeft + box.clientWidth / 2;
      let best = 0, dist = Infinity;
      items.forEach((it, i) => {
        const d = Math.abs(leftIn(box, it) + it.offsetWidth / 2 - mid);
        if (d < dist) { dist = d; best = i; }
      });
      if (best !== at) { at = best; cb(best); }
    };
    box.addEventListener("scroll", () => { if (!q) q = requestAnimationFrame(read); }, { passive: true });
    onResize.push(read);
    read();
  };

  /* ---------- arrastar para baixo fecha a folha --------------------------- */
  const dragToClose = (panel, handle, close) => {
    let y0 = null, dy = 0, t0 = 0;
    handle.addEventListener("pointerdown", (e) => {
      if (!phone() || e.pointerType === "mouse" || e.target.closest("button,a,input")) return;
      y0 = e.clientY; dy = 0; t0 = performance.now();
      panel.classList.add("is-drag");
    });
    addEventListener("pointermove", (e) => {
      if (y0 === null) return;
      dy = Math.max(0, e.clientY - y0);
      panel.style.setProperty("--drag", dy + "px");
    }, { passive: true });
    const end = () => {
      if (y0 === null) return;
      y0 = null;
      panel.classList.remove("is-drag");
      const flick = dy > 40 && dy / Math.max(1, performance.now() - t0) > .6;
      if (dy > 110 || flick) close();
      panel.style.removeProperty("--drag");
    };
    addEventListener("pointerup", end);
    addEventListener("pointercancel", end);
  };

  /* ---------- 1. Barra de abas: indicador por ato e esconde ao rolar ------- */
  safe(() => {
    if (!tabbar) return;
    const tabs = $$(".tabbar__a", tabbar);
    const ind = $(".tabbar__ind", tabbar);
    let act = "", acc = 0;

    const place = () => {
      const t = tabs.find((a) => a.dataset.act === act);
      if (!t || !ind) return;
      ind.style.setProperty("--x", t.offsetLeft + "px");
      ind.style.setProperty("--w", t.offsetWidth + "px");
      ind.classList.add("on");
    };
    const setAct = (a) => {
      if (a === act) return;
      act = a;
      tabs.forEach((t) => {
        const on = t.dataset.act === a;
        t.classList.toggle("on", on);
        on ? t.setAttribute("aria-current", "true") : t.removeAttribute("aria-current");
      });
      place();
    };

    onScroll.push((y, dy, cur) => {
      setAct(cur.dataset.act);
      if (!phone() || calm) { tabbar.classList.remove("m-hide"); return; }
      // soma o deslocamento na mesma direção: um tremido do dedo não esconde a barra
      acc = (dy > 0) === (acc > 0) ? acc + dy : dy;
      const nearEnd = y + innerHeight > document.documentElement.scrollHeight - 180;
      if (y < 140 || nearEnd || acc < -28) tabbar.classList.remove("m-hide");
      else if (acc > 40) tabbar.classList.add("m-hide");
    });
    onResize.push(place);

    // com o teclado aberto a barra sairia por cima do campo
    document.addEventListener("focusin", (e) => {
      if (phone() && e.target.matches && e.target.matches("input,textarea,select")) tabbar.classList.add("m-kb");
    });
    document.addEventListener("focusout", () => tabbar.classList.remove("m-kb"));

    tabs.forEach((t) => t.addEventListener("click", () => buzz()));
    const wa = $(".tabbar__wa", tabbar);
    wa && wa.addEventListener("click", () => buzz(14));
  });

  /* ---------- 2. Cabeçalho: o nome da marca vira o capítulo atual ---------- */
  safe(() => {
    const inner = nav && $(".nav__in", nav);
    const brand = inner && $(".brand", inner);
    if (!brand) return;
    const chip = ui("button", "m-chap", { type: "button", "aria-controls": "sheet", "aria-label": "Capítulo atual. Abrir a lista de capítulos" });
    chip.innerHTML = '<small></small><b></b><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    brand.after(chip);
    const sm = $("small", chip), b = $("b", chip);
    let id = "", heroH = 0;
    const measure = () => { heroH = hero ? hero.offsetHeight : 400; };
    measure();
    onResize.push(measure);

    chip.addEventListener("click", () => burger && burger.click());
    onScroll.push((y, dy, cur) => {
      nav.classList.toggle("m-deep", phone() && y > heroH - 160);
      if (cur.id === id) return;
      id = cur.id;
      sm.textContent = `Ato ${cur.dataset.act} · ${cur.dataset.actNome}`;
      b.textContent = (cur.dataset.mark ? cur.dataset.mark + " · " : "") + cur.dataset.chapter;
      if (!calm) { b.classList.remove("m-swap"); void b.offsetWidth; b.classList.add("m-swap"); }
    });
  });

  /* ---------- 3. Menu em folha inferior ------------------------------------ */
  safe(() => {
    if (!sheet || !burger) return;
    const scrim = ui("div", "m-scrim", { "aria-hidden": "true" });
    document.body.appendChild(scrim);
    scrim.addEventListener("click", () => { if (sheet.classList.contains("open")) burger.click(); });

    const links = $$(".sheet__grid a", sheet);
    links.forEach((a, i) => a.style.setProperty("--i", i));

    // app.js abre e fecha a folha; aqui só se acompanha o estado
    new MutationObserver(() => {
      const open = sheet.classList.contains("open");
      scrim.classList.toggle("on", open && phone());
      if (!open) return;
      buzz();
      const cur = chapterAt();
      links.forEach((a) => {
        const on = a.getAttribute("href") === "#" + cur.id;
        a.classList.toggle("on", on);
        on ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
      });
    }).observe(sheet, { attributes: true, attributeFilter: ["class"] });

    const search = $("[data-cmdk]", sheet);
    search && search.addEventListener("click", () => { const b = $("#btnCmdk"); b && b.click(); });

    const head = $(".sheet__head", sheet);
    head && dragToClose(sheet, head, () => { if (sheet.classList.contains("open")) burger.click(); });
  });

  /* ---------- 4. Janelas (serviço, comparação) fecham puxando para baixo --- */
  safe(() => {
    $$(".ov:not(.ov--cmdk)").forEach((ov) => {
      const card = $(".ov__card", ov), head = $(".ov__head", ov), x = $(".ov__x", ov);
      if (card && head && x) dragToClose(card, head, () => x.click());
    });
  });

  /* ---------- 5. Toque: onda a partir do dedo ------------------------------ */
  safe(() => {
    if (calm) return;
    const SEL = ".btn,.link,.faq__q,.diag__opts button,.sheet__grid a,.sheet__search,.tabbar__a,.m-seg button,.m-tabs button,.m-diag__back";
    document.addEventListener("pointerdown", (e) => {
      if (!phone() || e.pointerType === "mouse") return;
      const el = e.target.closest && e.target.closest(SEL);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const s = document.createElement("span");
      s.className = "m-rip";
      s.setAttribute("aria-hidden", "true");
      s.style.left = (e.clientX - r.left) + "px";
      s.style.top = (e.clientY - r.top) + "px";
      s.style.setProperty("--s", (Math.hypot(r.width, r.height) / 6).toFixed(1));
      el.appendChild(s);
      const bye = () => s.remove();
      s.addEventListener("animationend", bye);
      setTimeout(bye, 900);
    }, { passive: true });
  });

  /* ---------- 6. Carrosséis: o cartão do centro em foco -------------------- */
  safe(() => {
    if (calm) return;
    [".brands", ".band--profile .pillars", ".systems", ".plans"].forEach((sel) => {
      const box = $(sel);
      if (!box) return;
      const items = Array.from(box.children);
      let q = 0;
      const upd = () => {
        q = 0;
        if (!phone()) { items.forEach((it) => it.style.removeProperty("--d")); return; }
        const r = box.getBoundingClientRect(), mid = r.left + r.width / 2;
        items.forEach((it) => {
          const b = it.getBoundingClientRect();
          it.style.setProperty("--d", clamp(Math.abs(b.left + b.width / 2 - mid) / b.width, 0, 1).toFixed(3));
        });
      };
      box.addEventListener("scroll", () => { if (!q) q = requestAnimationFrame(upd); }, { passive: true });
      onResize.push(upd);
      upd();
    });
  });

  /* ---------- 7. Marcas em stories: segmentos e troca automática ----------- */
  safe(() => {
    const box = $(".brands");
    if (!box) return;
    const cards = Array.from(box.children);
    const n = cards.length;
    if (n < 2) return;
    const PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
    const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z"/></svg>';

    const bar = ui("div", "m-stories");
    const segs = document.createElement("div");
    segs.className = "m-stories__segs";
    segs.setAttribute("role", "group");
    segs.setAttribute("aria-label", "Marcas atendidas");
    const btns = cards.map((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      const name = ($("h3", c) || {}).textContent || `Marca ${i + 1}`;
      b.setAttribute("aria-label", `${name.trim()}, ${i + 1} de ${n}`);
      b.innerHTML = "<i><b></b></i>";
      const cor = c.style.getPropertyValue("--seg").trim();
      if (cor) b.style.setProperty("--seg-c", cor);
      segs.appendChild(b);
      return b;
    });
    const pp = document.createElement("button");
    pp.type = "button";
    pp.className = "m-stories__pp";
    bar.append(segs, pp);
    box.before(bar);

    let at = 0, playing = false, stopped = calm, visible = false;
    const paint = () => {
      btns.forEach((b, i) => {
        b.classList.toggle("on", i === at);
        b.classList.toggle("done", i < at);
        i === at ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current");
      });
      bar.classList.toggle("is-play", playing);
      pp.hidden = calm;
      pp.innerHTML = playing ? PAUSE : PLAY;
      pp.setAttribute("aria-label", playing ? "Pausar a troca automática das marcas" : "Retomar a troca automática das marcas");
    };
    const run = () => {
      const want = phone() && visible && !stopped && !document.hidden;
      if (want !== playing) { playing = want; paint(); }
    };

    watchCenter(box, cards, (i) => { at = i; paint(); });

    // o segmento ativo enche em CSS; quando termina, passa para a próxima marca
    segs.addEventListener("animationend", () => {
      if (!playing) return;
      if (at < n - 1) centerOn(box, cards[at + 1]);
      else { stopped = true; run(); }
    });

    // quem desliza ou toca assume o controle
    box.addEventListener("touchstart", () => { if (playing) { stopped = true; run(); } }, { passive: true });
    btns.forEach((b, i) => b.addEventListener("click", () => {
      stopped = true; run();
      buzz();
      centerOn(box, cards[i]);
    }));
    pp.addEventListener("click", () => {
      stopped = !stopped;
      if (!stopped && at === n - 1) centerOn(box, cards[0], false);
      run();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; run(); }), { threshold: .6 }).observe(box);
    }
    document.addEventListener("visibilitychange", run);
    mq.addEventListener && mq.addEventListener("change", run);
    paint();
  });

  /* ---------- 8. Pacotes: abas com o nome de cada formato ------------------ */
  safe(() => {
    const box = $(".plans");
    if (!box) return;
    const cards = Array.from(box.children);
    if (cards.length < 2) return;
    const tabs = ui("div", "m-tabs", { role: "group", "aria-label": "Formatos de trabalho" });
    const ind = document.createElement("span");
    ind.className = "m-tabs__ind";
    ind.setAttribute("aria-hidden", "true");
    tabs.appendChild(ind);
    const btns = cards.map((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = (($(".plan__lbl", c) || {}).textContent || "").trim();
      b.setAttribute("aria-label", `${b.textContent}: ${(($("h3", c) || {}).textContent || "").trim()}`);
      b.addEventListener("click", () => { buzz(); centerOn(box, c); });
      tabs.appendChild(b);
      return b;
    });
    box.before(tabs);
    watchCenter(box, cards, (i) => {
      tabs.style.setProperty("--i", i);
      btns.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    });
  });

  /* ---------- 9. Antes e depois vira um interruptor ------------------------ */
  safe(() => {
    const vs = $(".vs");
    const bad = vs && $(".vs__side--bad", vs), good = vs && $(".vs__side--good", vs);
    if (!bad || !good) return;
    const label = (side) => $("h3", side).textContent.replace(/[✕✓]/g, "").trim();
    const seg = ui("div", "m-seg", { role: "group", "aria-label": "Comparar os dois cenários" });
    const ind = document.createElement("span");
    ind.className = "m-seg__ind";
    ind.setAttribute("aria-hidden", "true");
    seg.appendChild(ind);
    [["bad", bad], ["good", good]].forEach(([v, side]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.v = v;
      b.textContent = label(side);
      seg.appendChild(b);
    });
    vs.before(seg);
    vs.classList.add("m-vs");

    let touched = false;
    const set = (v) => {
      seg.dataset.v = v;
      vs.dataset.v = v;
      $$("button", seg).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
    };
    set("bad");
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      touched = true;
      buzz();
      set(b.dataset.v);
    });
    // mostra a virada uma vez, sozinha, quando o bloco aparece
    if (!calm && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setTimeout(() => { if (!touched && phone()) set("good"); }, 1900);
      }), { threshold: .6 });
      io.observe(vs);
    }
  });

  /* ---------- 10. Diagnóstico: uma pergunta por vez ------------------------ */
  safe(() => {
    const qs = $$(".diag__q");
    if (qs.length < 2) return;
    const wrap = qs[0].parentElement;
    const out = $("#diagOut");
    wrap.classList.add("m-diag");
    const bar = ui("div", "m-diag__bar");
    bar.innerHTML = '<button class="m-diag__back" type="button">← Voltar</button><span class="m-diag__n" aria-live="polite"></span><span class="m-diag__prog" aria-hidden="true"><i></i></span>';
    wrap.prepend(bar);
    const back = $(".m-diag__back", bar), num = $(".m-diag__n", bar), prog = $(".m-diag__prog", bar);

    const answered = (q) => !!$('button[aria-pressed="true"]', q);
    const firstOpen = () => { const i = qs.findIndex((q) => !answered(q)); return i < 0 ? qs.length : i; };
    let step = firstOpen();

    const render = (dir = 0) => {
      const done = step >= qs.length;
      wrap.classList.toggle("is-done", done);
      qs.forEach((q, i) => { q.classList.toggle("is-on", i === step); q.classList.remove("is-in", "is-back"); });
      if (!done && dir && !calm) { void qs[step].offsetWidth; qs[step].classList.add(dir > 0 ? "is-in" : "is-back"); }
      num.textContent = done ? "Suas respostas · toque para mudar" : `Pergunta ${step + 1} de ${qs.length}`;
      prog.style.setProperty("--p", (Math.min(step, qs.length) / qs.length).toFixed(3));
      back.hidden = done || step === 0;
    };

    // app.js marca a resposta no próprio botão; este ouvinte, no contêiner, vem depois
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest(".diag__q button");
      if (!b || !phone()) return;
      const i = qs.indexOf(b.closest(".diag__q"));
      buzz();
      if (wrap.classList.contains("is-done")) { step = i; render(-1); return; }
      setTimeout(() => {
        step = i + 1 < qs.length ? i + 1 : firstOpen();
        render(1);
        if (step >= qs.length && out) setTimeout(() => out.scrollIntoView({ behavior: smooth(), block: "center" }), 140);
      }, calm ? 0 : 280);
    });
    back.addEventListener("click", () => { step = Math.max(0, step - 1); render(-1); });
    out && out.addEventListener("click", (e) => {
      if (e.target.closest("[data-diag-reset]")) setTimeout(() => { step = 0; render(-1); }, 0);
    });
    render();
  });

  /* ---------- 11. Retrato do perfil ganha cor no centro da tela ------------ */
  safe(() => {
    const p = $(".portrait");
    if (!p || !("IntersectionObserver" in window)) return;
    new IntersectionObserver((es) => es.forEach((e) => {
      p.classList.toggle("m-color", phone() && e.intersectionRatio > .55);
    }), { threshold: [0, .55, .8] }).observe(p);
  });

  /* ---------- 12. Topo: a foto desce mais devagar que a página ------------- */
  safe(() => {
    if (!hero || calm) return;
    let h = 1;
    const measure = () => { h = hero.offsetHeight || 1; };
    measure();
    onResize.push(measure);
    onScroll.push((y) => {
      if (!phone()) { hero.style.removeProperty("--hp"); return; }
      if (y > h) return;
      hero.style.setProperty("--hp", clamp(y / h, 0, 1).toFixed(3));
    });
  });

  /* ---------- um único ouvinte de rolagem para os módulos acima ----------- */
  let lastY = scrollY, q = 0;
  const tick = () => {
    q = 0;
    const y = scrollY, dy = y - lastY;
    lastY = y;
    const cur = chapterAt();
    if (!cur) return;
    onScroll.forEach((f) => safe(() => f(y, dy, cur)));
  };
  const relayout = () => { onResize.forEach((f) => safe(f)); tick(); };
  addEventListener("scroll", () => { if (!q) q = requestAnimationFrame(tick); }, { passive: true });
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(relayout, 140); });
  addEventListener("load", relayout);
  mq.addEventListener && mq.addEventListener("change", relayout);
  // as fontes mudam a largura das abas: reposiciona o indicador depois delas
  document.fonts && document.fonts.ready && document.fonts.ready.then(relayout);
  tick();
})();

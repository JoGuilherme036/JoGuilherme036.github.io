/* ==========================================================================
   JG Marketing — camada de efeitos (js/efeitos.js)
   JavaScript puro, sem biblioteca. Carregado depois de app.js.

   Regras desta camada
   • Enfeite nunca derruba o site: cada efeito roda dentro de safe().
   • prefers-reduced-motion: efeitos de movimento viram estado final direto.
   • Tudo que desenha em <canvas> pausa fora da tela e com a aba escondida.
   • Nada aqui cria conteúdo novo: só anima o que já está na página.
   ========================================================================== */
(() => {
  "use strict";

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const safe = (fn) => { try { fn(); } catch (err) { /* efeito é enfeite */ } };

  document.documentElement.classList.add("fx");

  /* agenda uma função por quadro, no máximo uma vez */
  const raf1 = (fn) => {
    let q = false;
    return (...a) => {
      if (q) return;
      q = true;
      requestAnimationFrame(() => { q = false; fn(...a); });
    };
  };

  /* roda cb quando o elemento aparece e para quando sai */
  const whenVisible = (el, cb, margin = "0px") => {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { rootMargin: margin }).observe(el);
  };
  const once = (el, cb, threshold = .4) => {
    if (!("IntersectionObserver" in window)) { cb(); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { io.disconnect(); cb(); } });
    }, { threshold });
    io.observe(el);
  };

  /* ---------- 1. Brilho que segue o ponteiro nos cartões ----------------- */
  safe(() => {
    const SEL = ".svc,.brand-card,.plan,.metric,.pillar,.goal,.sys,.figs > div";
    $$(SEL).forEach((c) => {
      c.classList.add("fx-card");
      const g = document.createElement("i");
      g.className = "fx-gl";
      g.setAttribute("aria-hidden", "true");
      c.insertBefore(g, c.firstChild);
    });
    if (!fine) return;
    const move = raf1((e) => {
      const c = e.target.closest && e.target.closest(".fx-card");
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px");
      c.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
    document.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") move(e); }, { passive: true });
  });

  /* ---------- 1b. Cartões de marca inclinam em 3D na direção do ponteiro -- */
  safe(() => {
    if (!fine || calm) return;
    // usa a propriedade `rotate` (eixo + ângulo): não briga com o `transform`
    // das animações de entrada; a perspectiva vem de .brands
    $$(".brand-card").forEach((c) => {
      const tilt = raf1((e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        const deg = Math.hypot(x, y) * 10;
        c.style.rotate = deg > .2 ? `${(-y).toFixed(3)} ${x.toFixed(3)} 0 ${deg.toFixed(2)}deg` : "";
      });
      c.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") tilt(e); }, { passive: true });
      c.addEventListener("pointerleave", () => { c.style.rotate = ""; });
    });
  });

  /* ---------- 2. Botão elástico ------------------------------------------ */
  safe(() => {
    if (!fine || calm) return;
    $$(".btn").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        b.style.translate = `${(dx * 16).toFixed(1)}px ${(dy * 12).toFixed(1)}px`;
      });
      b.addEventListener("pointerleave", () => { b.style.translate = ""; });
    });
  });

  /* ---------- 3. Cursor acompanhante ------------------------------------- */
  safe(() => {
    if (!fine) return;
    const cur = document.createElement("div");
    cur.className = "fx-cur";
    cur.setAttribute("aria-hidden", "true");
    cur.innerHTML = '<span class="fx-cur__ring"><span class="fx-cur__lbl"></span></span><span class="fx-cur__dot"></span>';
    document.body.appendChild(cur);
    const ring = $(".fx-cur__ring", cur), dot = $(".fx-cur__dot", cur), lbl = $(".fx-cur__lbl", cur);

    let tx = -100, ty = -100, rx = -100, ry = -100, running = false;
    const LABELS = [["[data-zoom]", "ampliar"], ["[data-svc]", "abrir"]];
    const LINKS = "a,button,input,select,textarea,label,summary,[role=button],[data-zoom]";

    const loop = () => {
      rx += (tx - rx) * (calm ? 1 : .2);
      ry += (ty - ry) * (calm ? 1 : .2);
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      if (Math.abs(tx - rx) > .1 || Math.abs(ty - ry) > .1) requestAnimationFrame(loop);
      else running = false;
    };

    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") { cur.classList.remove("on"); return; }
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = `translate(${tx}px,${ty}px)`;
      cur.classList.add("on");
      const t = e.target.closest ? e.target : null;
      let text = "";
      if (t) for (const [sel, word] of LABELS) { if (t.closest(sel)) { text = word; break; } }
      lbl.textContent = text;
      cur.classList.toggle("is-lbl", !!text);
      cur.classList.toggle("is-link", !text && !!(t && t.closest(LINKS)));
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener("click", () => cur.classList.remove("is-lbl", "is-link"), true);
    document.addEventListener("pointerdown", () => cur.classList.add("is-down"));
    document.addEventListener("pointerup", () => cur.classList.remove("is-down"));
    document.documentElement.addEventListener("mouseleave", () => cur.classList.remove("on"));
  });

  /* ---------- 4a. Embaralhar letras nas palavras de destaque -------------- */
  safe(() => {
    if (calm) return;
    const MIN = "abcdefghijklmnopqrstuvwxyz", CAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const prepare = (el) => {
      const final = el.textContent;
      if (!final || final.length > 16 || el.children.length) return null;
      el.classList.add("fx-scr", "fx-scr--pre");
      const sr = document.createElement("span");
      sr.className = "fx-sr";
      sr.textContent = final;
      const vis = document.createElement("span");
      vis.setAttribute("aria-hidden", "true");
      vis.textContent = final;
      el.textContent = "";
      el.append(sr, vis);
      return { el, vis, final };
    };
    const run = ({ el, vis, final }, delay = 0) => {
      const w = el.getBoundingClientRect().width;
      el.style.minWidth = w + "px";
      el.classList.add("fx-scr--run");
      el.classList.remove("fx-scr--pre");
      const n = final.length, dur = 900, t0 = performance.now() + delay;
      let last = 0;
      const step = (t) => {
        if (t < t0) { requestAnimationFrame(step); return; }
        const p = (t - t0) / dur;
        if (t - last > 42 || p >= 1) {
          last = t;
          let out = "";
          for (let i = 0; i < n; i++) {
            const ch = final[i];
            if (!/[a-zà-ú]/i.test(ch)) { out += ch; continue; }
            const done = p * (n + 2) - 2 > i;
            out += done ? ch : (ch === ch.toUpperCase() ? CAP : MIN)[Math.floor(Math.random() * 26)];
          }
          vis.textContent = p >= 1 ? final : out;
        }
        if (p < 1) requestAnimationFrame(step);
        else { el.style.minWidth = ""; el.classList.remove("fx-scr--run"); }
      };
      requestAnimationFrame(step);
    };
    $$("h1 .mark, h2 .mark, h3 .mark").forEach((m) => {
      const hero = !!m.closest(".hero");
      const prep = prepare(m);
      if (!prep) return;
      if (hero) setTimeout(() => run(prep), 750);
      else once(m, () => run(prep, 150), .8);
    });
  });

  /* ---------- 4b. Texto que se preenche conforme a rolagem ---------------- */
  safe(() => {
    const targets = $$("[data-fill]");
    if (!targets.length) return;
    const split = (node) => {
      Array.from(node.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement("span");
            s.className = "fx-w";
            s.textContent = part;
            frag.appendChild(s);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) split(c);
      });
    };
    const items = targets.map((el) => { split(el); return { el, words: $$(".fx-w", el) }; });
    if (calm) { items.forEach((i) => i.el.classList.add("fx-fill--calm")); return; }
    const update = raf1(() => {
      const vh = innerHeight;
      items.forEach(({ el, words }) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const p = clamp((vh * .9 - r.top) / (vh * .42 + r.height * .6), 0, 1);
        const lit = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle("on", i < lit));
      });
    });
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  });

  /* ---------- 5. Odômetro nos números grandes ----------------------------- */
  safe(() => {
    $$("[data-odo]").forEach((el, idx) => {
      const to = Number(el.dataset.count || 0);
      const num = el.dataset.format === "br" ? to.toLocaleString("pt-BR") : String(to);
      const final = num + (el.dataset.suffix || "");
      const sr = document.createElement("span");   // texto real para leitor de tela, cópia e buscadores
      sr.className = "fx-sr";
      sr.textContent = final;
      const odo = document.createElement("x-odo");
      odo.className = "odo";
      odo.setAttribute("aria-hidden", "true");
      if (calm) odo.style.setProperty("--odo-t", "0s");
      const digits = num.replace(/\D/g, "").length;
      let d = 0;
      Array.from(final).forEach((ch) => {
        if (/\d/.test(ch)) {
          const col = document.createElement("x-c");
          col.className = "odo__c";
          const roll = document.createElement("x-r");
          roll.className = "odo__r";
          roll.style.setProperty("--n", ch);
          roll.style.setProperty("--dl", ((digits - 1 - d) * .07).toFixed(2) + "s");
          for (let k = 0; k <= 9; k++) { const i = document.createElement("x-d"); i.textContent = k; roll.appendChild(i); }
          col.appendChild(roll);
          odo.appendChild(col);
          d++;
        } else {
          const s = document.createElement("x-s");
          s.className = "odo__s";
          s.textContent = ch;
          odo.appendChild(s);
        }
      });
      el.textContent = "";
      el.append(sr, odo);
      if (calm) { odo.classList.add("go"); return; }
      once(el, () => setTimeout(() => odo.classList.add("go"), 120 + (idx % 4) * 60), .5);
    });
  });

  /* ---------- 8. Linha do tempo que se desenha ---------------------------- */
  const onScrollFns = [];
  safe(() => {
    const road = $(".road");
    if (!road) return;
    const items = $$(".road__item", road);
    if (items.length < 2) return;
    const fill = document.createElement("i");
    fill.className = "road__draw";
    fill.setAttribute("aria-hidden", "true");
    road.insertBefore(fill, road.firstChild);
    let dots = [];
    const measure = () => {
      dots = items.map((it) => it.offsetTop + parseFloat(getComputedStyle(it).paddingTop) + 9.5);
      fill.style.top = dots[0] + "px";
      fill.style.height = (dots[dots.length - 1] - dots[0]) + "px";
    };
    measure();
    addEventListener("resize", raf1(measure));
    const upd = () => {
      const r = road.getBoundingClientRect();
      const line = innerHeight * .62;
      const y0 = r.top + dots[0], y1 = r.top + dots[dots.length - 1];
      const p = calm ? 1 : clamp((line - y0) / Math.max(1, y1 - y0), 0, 1);
      fill.style.transform = `scaleY(${p})`;
      items.forEach((it, i) => it.classList.toggle("fx-lit", calm || r.top + dots[i] < line));
    };
    onScrollFns.push(upd);
    upd();
  });

  /* ---------- 8b. Etapas com feixe que acompanha a rolagem (desktop) ------ */
  safe(() => {
    const box = $("#processo .steps");
    if (!box) return;
    const steps = $$(".step", box);
    const beam = document.createElement("i");
    beam.className = "steps__beam";
    beam.setAttribute("aria-hidden", "true");
    box.insertBefore(beam, box.firstChild);
    box.classList.add("fx-beam");
    const mq = matchMedia("(min-width:761px)");
    const upd = () => {
      if (!mq.matches) return;
      const r = box.getBoundingClientRect();
      const line = innerHeight * .6;
      const p = calm ? 1 : clamp((line - r.top) / Math.max(1, r.height), 0, 1);
      box.style.setProperty("--beam", p.toFixed(4));
      steps.forEach((s) => s.classList.toggle("fx-lit", calm || s.getBoundingClientRect().top + 18 < line));
    };
    onScrollFns.push(upd);
    upd();
  });

  /* ---------- 9. Retrato em íris ------------------------------------------ */
  safe(() => {
    const fr = $(".portrait__frame");
    if (!fr || calm) return;
    fr.classList.add("fx-iris");
    once($(".portrait"), () => {
      fr.classList.add("on");
      setTimeout(() => fr.classList.remove("fx-iris", "on"), 1700);
    }, .3);
  });

  /* ---------- 11. Pilha de cartões das etapas (celular) ------------------- */
  safe(() => {
    const steps = $$("#processo .step");
    if (steps.length < 2) return;
    steps.forEach((s, i) => s.style.setProperty("--k", i));
    const mq = matchMedia("(max-width:760px)");
    const upd = () => {
      steps.forEach((s, i) => {
        if (!mq.matches || calm || i === steps.length - 1) { s.style.transform = ""; s.style.filter = ""; return; }
        const nextTop = steps[i + 1].getBoundingClientRect().top;
        const stick = parseFloat(getComputedStyle(s).top) || 0;
        const h = s.offsetHeight || 1;
        const p = clamp(1 - (nextTop - stick) / (h + 14), 0, 1);
        s.style.transform = `scale(${(1 - p * .06).toFixed(4)})`;
        s.style.filter = p > 0 ? `brightness(${(1 - p * .08).toFixed(3)})` : "";
      });
    };
    onScrollFns.push(upd);
    mq.addEventListener && mq.addEventListener("change", upd);
    upd();
  });

  /* um único ouvinte de rolagem para os efeitos acima */
  const tick = raf1(() => onScrollFns.forEach((f) => safe(f)));
  addEventListener("scroll", tick, { passive: true });
  addEventListener("resize", tick);
  tick();

  /* ---------- 12. Rede de partículas no topo ------------------------------ */
  safe(() => {
    const cv = $("#fxNet");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const hero = cv.parentElement;
    let w = 0, h = 0, pts = [], raf = 0, active = false;
    const mouse = { x: -999, y: -999, on: false };
    const LINK = 128, FLEE = 118;

    const build = () => {
      const r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const small = w < 760;
      const n = Math.round(Math.min(small ? 30 : 64, (w * h) / (small ? 17000 : 20000)));
      pts = Array.from({ length: n }, () => {
        const a = Math.random() * Math.PI * 2, s = .12 + Math.random() * .22;
        return { x: Math.random() * w, y: Math.random() * h, vx: Math.cos(a) * s, vy: Math.sin(a) * s, fx: 0, fy: 0, r: 1 + Math.random() * 1.2 };
      });
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            ctx.strokeStyle = `rgba(79,141,255,${((1 - Math.sqrt(d2) / LINK) * .34).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (mouse.on) {
          const dx = a.x - mouse.x, dy = a.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < LINK + 22) {
            ctx.strokeStyle = `rgba(120,170,255,${((1 - d / (LINK + 22)) * .5).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(150,185,255,.85)";
      pts.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill(); });
    };

    const step = () => {
      pts.forEach((p) => {
        if (mouse.on) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < FLEE && d > .01) { const f = (1 - d / FLEE) * 1.5; p.fx += (dx / d) * f; p.fy += (dy / d) * f; }
        }
        p.fx *= .9; p.fy *= .9;
        p.x += p.vx + p.fx; p.y += p.vy + p.fy;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      });
      draw();
      raf = active ? requestAnimationFrame(step) : 0;
    };
    const setActive = (on) => {
      const want = on && !document.hidden;
      if (want === active) return;
      active = want;
      if (active && !raf) raf = requestAnimationFrame(step);
    };

    build();
    cv.classList.add("on");
    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 180); });
    if (calm) return;   // um quadro parado, sem animação

    let vis = true;
    whenVisible(hero, (v) => { vis = v; setActive(vis); });
    document.addEventListener("visibilitychange", () => setActive(vis));
    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { mouse.on = false; });
    setActive(true);
  });

  /* ---------- API usada por app.js ---------------------------------------- */

  /* Confete a partir de um elemento (ou do centro da tela) */
  const confetti = (from) => {
    if (calm) return;
    safe(() => {
      const r = from && from.getBoundingClientRect ? from.getBoundingClientRect() : null;
      const ox = r ? r.left + r.width / 2 : innerWidth / 2;
      const oy = r ? r.top + r.height / 2 : innerHeight * .6;
      const cv = document.createElement("canvas");
      cv.className = "fx-conf";
      cv.setAttribute("aria-hidden", "true");
      cv.width = innerWidth; cv.height = innerHeight;
      document.body.appendChild(cv);
      const ctx = cv.getContext("2d");
      const colors = ["#1b6bff", "#4f8dff", "#38d39f", "#ff5a1f", "#f3f3f5"];
      const ps = Array.from({ length: 90 }, () => {
        const a = -Math.PI / 2 + (Math.random() - .5) * 2.2, s = 6 + Math.random() * 9;
        return {
          x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          w: 5 + Math.random() * 5, h: 3 + Math.random() * 4,
          rot: Math.random() * 6.28, vr: (Math.random() - .5) * .35,
          c: colors[(Math.random() * colors.length) | 0], round: Math.random() < .25
        };
      });
      let frames = 0;
      const go = () => {
        ctx.clearRect(0, 0, cv.width, cv.height);
        frames++;
        ps.forEach((p) => {
          p.vy += .36; p.vx *= .985; p.vy *= .985;
          p.x += p.vx; p.y += p.vy; p.rot += p.vr;
          ctx.save();
          ctx.globalAlpha = clamp(1 - (frames - 70) / 60, 0, 1);
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.c;
          if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 6.28); ctx.fill(); }
          else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        });
        if (frames < 130) requestAnimationFrame(go);
        else cv.remove();
      };
      requestAnimationFrame(go);
    });
  };

  window.JGFX = { confetti };

  /* ---------- 10b. Janela de detalhes que abre a partir do cartão ---------- */
  safe(() => {
    const ov = $("#ovDetail");
    if (!ov || calm) return;
    let src = null, at = 0;
    document.addEventListener("click", (e) => {
      const c = e.target.closest && e.target.closest("[data-svc]");
      if (c) { src = c.getBoundingClientRect(); at = performance.now(); }
    }, true);
    new MutationObserver(() => {
      if (!ov.classList.contains("on") || !src || performance.now() - at > 600) return;
      const card = $(".ov__card", ov);
      if (!card || !card.animate) return;
      // mede a posição final sem a transição de entrada
      card.style.transition = "none"; card.style.transform = "none";
      const end = card.getBoundingClientRect();
      card.style.transition = ""; card.style.transform = "";
      const dx = src.left - end.left, dy = src.top - end.top;
      const sx = clamp(src.width / end.width, .2, 1), sy = clamp(src.height / end.height, .12, 1);
      card.animate([
        { transformOrigin: "0 0", transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})`, opacity: .2 },
        { transformOrigin: "0 0", transform: "none", opacity: 1 }
      ], { duration: 520, easing: "cubic-bezier(.22,1,.36,1)" });
      src = null;
    }).observe(ov, { attributes: true, attributeFilter: ["class"] });
  });

  /* ---------- 10c. Imagem ampliada que cresce a partir da miniatura -------- */
  safe(() => {
    const lb = $("#lb"), img = $("#lbImg");
    if (!lb || !img || calm || !img.animate) return;
    let src = null, at = 0;
    document.addEventListener("click", (e) => {
      const b = e.target.closest && e.target.closest("[data-zoom]");
      if (b) { src = ($("img", b) || b).getBoundingClientRect(); at = performance.now(); }
    }, true);
    const grow = () => {
      const s = src;
      src = null;
      const end = img.getBoundingClientRect();
      if (!s || !end.width) return;
      // escala uniforme pela largura: a miniatura é o topo da captura, então os topos se alinham
      const k = clamp(s.width / end.width, .15, 1);
      img.animate([
        { transformOrigin: "0 0", transform: `translate(${s.left - end.left}px,${s.top - end.top}px) scale(${k})`, opacity: .55 },
        { transformOrigin: "0 0", transform: "none", opacity: 1 }
      ], { duration: 560, easing: "cubic-bezier(.22,1,.36,1)" });
    };
    new MutationObserver(() => {
      if (!lb.classList.contains("on") || !src || performance.now() - at > 600) return;
      if (img.complete && img.naturalWidth) grow();
      else img.addEventListener("load", grow, { once: true });
    }).observe(lb, { attributes: true, attributeFilter: ["class"] });
  });
})();

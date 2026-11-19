/* Efek bersama untuk index.html dan kegiatan.html.
   File ini berdiri sendiri: tidak mengubah script.js / kegiatan.js dan tidak menyentuh nama foto. */
(() => {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const root = document.documentElement;
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const SPARKS = ["✨", "💖", "🎉", "🌸", "⭐", "🦋", "💛", "🎈"];
  const MAX_PARTICLES = 150;

  /* ---------- lapisan partikel ---------- */
  const layer = document.createElement("div");
  layer.className = "fx-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  /* ---------- progress scroll + tombol ke atas ---------- */
  const bar = document.createElement("div");
  bar.className = "fx-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  const topButton = document.createElement("button");
  topButton.type = "button";
  topButton.className = "fx-top";
  topButton.setAttribute("aria-label", "Kembali ke atas");
  topButton.textContent = "↑";
  topButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" });
  });
  document.body.appendChild(topButton);

  /* --scroll hanya dipasang di elemen yang memakainya (bukan di <html>),
     supaya tiap gulir tidak memicu hitung ulang gaya seluruh halaman. */
  const scrollTargets = Array.from(document.querySelectorAll(".hero, .activity-cover-photos"));
  let ticking = false;
  function onScroll() {
    ticking = false;
    const max = root.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    const y = Math.round(window.scrollY);
    scrollTargets.forEach((el) => el.style.setProperty("--scroll", y));
    topButton.classList.toggle("is-visible", window.scrollY > 700);
  }
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- letusan emoji ---------- */
  function burst(x, y, count = 10, pool = SPARKS) {
    if (reduce.matches) return;
    for (let i = 0; i < count; i += 1) {
      if (layer.childElementCount > MAX_PARTICLES) break;
      const el = document.createElement("span");
      el.className = "fx-particle";
      el.textContent = pick(pool);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.fontSize = `${rand(14, 30)}px`;
      layer.appendChild(el);

      const angle = rand(0, Math.PI * 2);
      const dist = rand(50, 140);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 40;
      const animation = el.animate([
        { transform: "translate(-50%, -50%) scale(.3) rotate(0deg)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.1) rotate(${rand(-120, 120)}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(calc(-50% + ${dx * 1.1}px), calc(-50% + ${dy + 70}px)) scale(.6) rotate(${rand(-220, 220)}deg)`, opacity: 0 },
      ], { duration: rand(900, 1500), easing: "cubic-bezier(.2,.7,.3,1)" });
      animation.onfinish = () => el.remove();
    }
  }

  function trail(x, y) {
    if (layer.childElementCount > MAX_PARTICLES) return;
    const el = document.createElement("span");
    el.className = "fx-trail";
    el.textContent = pick(["✦", "✧", "·", "♡"]);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    layer.appendChild(el);
    const animation = el.animate([
      { transform: "translate(-50%, -50%) scale(1)", opacity: 0.9 },
      { transform: `translate(calc(-50% + ${rand(-14, 14)}px), calc(-50% - 28px)) scale(.2)`, opacity: 0 },
    ], { duration: 750, easing: "ease-out" });
    animation.onfinish = () => el.remove();
  }

  function rain(pool = ["💖", "💗", "✨"], count = 24) {
    if (reduce.matches) return;
    for (let i = 0; i < count; i += 1) {
      setTimeout(() => {
        if (layer.childElementCount > MAX_PARTICLES) return;
        const el = document.createElement("span");
        el.className = "fx-particle";
        el.textContent = pick(pool);
        el.style.left = `${rand(0, window.innerWidth)}px`;
        el.style.top = "-40px";
        el.style.fontSize = `${rand(16, 32)}px`;
        layer.appendChild(el);
        const sway = rand(-60, 60);
        const animation = el.animate([
          { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
          { transform: `translate(${sway}px, ${window.innerHeight + 80}px) rotate(${rand(-300, 300)}deg)`, opacity: 0.9 },
        ], { duration: rand(2400, 4200), easing: "cubic-bezier(.3,.1,.6,1)" });
        animation.onfinish = () => el.remove();
      }, i * 70);
    }
  }

  function fireworks(times = 3) {
    if (reduce.matches) return;
    for (let i = 0; i < times; i += 1) {
      setTimeout(() => {
        burst(rand(0.15, 0.85) * window.innerWidth, rand(0.12, 0.5) * window.innerHeight, 16, ["✨", "⭐", "💫", "🎉", "💖"]);
      }, i * 350);
    }
  }

  /* ---------- benda melayang di latar ---------- */
  function floaters({ pool, count = 8, interactive = false }) {
    if (reduce.matches) return;
    const holder = document.createElement("div");
    holder.className = "fx-floaters";
    holder.setAttribute("aria-hidden", "true");
    document.body.appendChild(holder);

    function make() {
      const el = document.createElement("span");
      el.className = "fx-floater";
      el.textContent = pick(pool);
      el.style.left = `${rand(0, 96)}%`;
      el.style.fontSize = `${rand(20, 40)}px`;
      el.style.setProperty("--dur", `${rand(16, 32)}s`);
      el.style.setProperty("--sway", `${rand(-60, 60)}px`);
      el.style.animationDelay = `${-rand(0, 22)}s`;

      if (interactive) {
        el.classList.add("is-interactive");
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          const rect = el.getBoundingClientRect();
          burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12, ["🎉", "✨", "🎊", "💖"]);
          if (window.BirthdayAppState?.playSfx) window.BirthdayAppState.playSfx("pop");

          const toast = document.createElement("span");
          toast.className = "fx-toast-pop";
          toast.textContent = pick(["+1 Bahagia! ✨", "Pop! 🎈", "Asyik! 🥳", "Horee! 🎉", "Love! 💖"]);
          toast.style.left = `${rect.left + rect.width / 2}px`;
          toast.style.top = `${rect.top}px`;
          layer.appendChild(toast);
          const anim = toast.animate([
            { opacity: 1, transform: "translate(-50%, 0) scale(0.8)" },
            { opacity: 0, transform: "translate(-50%, -40px) scale(1.2)" },
          ], { duration: 900, easing: "ease-out" });
          anim.onfinish = () => toast.remove();

          el.remove();
          setTimeout(() => holder.appendChild(make()), 1500);
        });
      }
      return el;
    }

    for (let i = 0; i < count; i += 1) holder.appendChild(make());
  }

  /* ---------- tilt 3D mengikuti kursor ---------- */
  function tilt(elements, max = 8) {
    elements.forEach((el) => {
      el.classList.add("fx-tilt");
      el.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "mouse" || reduce.matches) return;
        el.classList.add("fx-tilt-on");
      });
      el.addEventListener("pointermove", (event) => {
        if (!el.classList.contains("fx-tilt-on")) return;
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        el.style.setProperty("--ry", `${(px - 0.5) * max * 2}deg`);
        el.style.setProperty("--rx", `${(0.5 - py) * max * 2}deg`);
        el.style.setProperty("--gx", `${px * 100}%`);
        el.style.setProperty("--gy", `${py * 100}%`);
      });
      el.addEventListener("pointerleave", () => {
        el.classList.remove("fx-tilt-on");
        el.style.removeProperty("--rx");
        el.style.removeProperty("--ry");
      });
    });
  }

  /* ---------- tombol "magnet" ---------- */
  function magnet(elements, strength = 0.28) {
    if (!fine.matches) return;
    elements.forEach((el) => {
      el.classList.add("fx-magnet");
      el.addEventListener("pointermove", (event) => {
        if (reduce.matches) return;
        const rect = el.getBoundingClientRect();
        const dx = (event.clientX - rect.left - rect.width / 2) * strength;
        const dy = (event.clientY - rect.top - rect.height / 2) * strength;
        el.style.translate = `${dx}px ${dy}px`;
      });
      el.addEventListener("pointerleave", () => { el.style.translate = ""; });
    });
  }

  /* ---------- hitung naik ---------- */
  function countUp(el, to, duration = 900) {
    if (reduce.matches) { el.textContent = String(to); return; }
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- lightbox: geser, zoom, slideshow ---------- */
  function enhanceLightbox(dialog) {
    if (!dialog) return;
    const img = dialog.querySelector("img");
    const toolbar = dialog.querySelector('[class$="-toolbar"]');
    const prev = dialog.querySelector('[id$="Previous"]');
    const next = dialog.querySelector('[id$="Next"]');
    if (!img || !toolbar || !prev || !next) return;

    let dir = 1;
    let timer = null;
    let swiped = false;
    let startX = null;

    const play = document.createElement("button");
    play.type = "button";
    play.className = "fx-lb-play";
    play.setAttribute("aria-pressed", "false");
    play.setAttribute("aria-label", "Putar slideshow otomatis");
    play.textContent = "▶";
    next.after(play);

    function stop() {
      clearInterval(timer);
      timer = null;
      play.setAttribute("aria-pressed", "false");
      play.setAttribute("aria-label", "Putar slideshow otomatis");
      play.textContent = "▶";
    }

    play.addEventListener("click", () => {
      if (timer) { stop(); return; }
      timer = setInterval(() => next.click(), 2800);
      play.setAttribute("aria-pressed", "true");
      play.setAttribute("aria-label", "Hentikan slideshow");
      play.textContent = "❚❚";
      next.click();
    });

    dialog.addEventListener("close", () => {
      stop();
      dir = 1;
      img.classList.remove("is-zoomed");
      img.style.transformOrigin = "";
    });

    dialog.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[id$="Previous"]')) dir = -1;
      else if (target.closest('[id$="Next"]')) dir = 1;
    }, true);

    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") dir = -1;
      else if (event.key === "ArrowRight") dir = 1;
    }, true);

    new MutationObserver(() => {
      if (!img.getAttribute("src")) return;
      img.classList.remove("is-zoomed");
      if (reduce.matches) return;
      img.animate([
        { opacity: 0, transform: `translateX(${dir * 70}px) scale(.94)` },
        { opacity: 1, transform: "none" },
      ], { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" });
    }).observe(img, { attributes: true, attributeFilter: ["src"] });

    function setOrigin(event) {
      const rect = dialog.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      img.style.transformOrigin = `${x}% ${y}%`;
    }

    img.addEventListener("click", (event) => {
      if (swiped) { swiped = false; return; }
      if (img.classList.toggle("is-zoomed")) setOrigin(event);
    });
    img.addEventListener("pointermove", (event) => {
      if (img.classList.contains("is-zoomed")) setOrigin(event);
    });
    img.addEventListener("pointerdown", (event) => { startX = event.clientX; });
    img.addEventListener("pointerup", (event) => {
      if (startX === null) return;
      const dx = event.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 55 && !img.classList.contains("is-zoomed")) {
        swiped = true;
        (dx < 0 ? next : prev).click();
        setTimeout(() => { swiped = false; }, 60);
      }
    });
  }

  /* ---------- kursor cincin + jejak bintang ---------- */
  if (fine.matches) {
    const ring = document.createElement("div");
    ring.className = "fx-ring";
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);

    const interactive = "a, button, label, select, input, summary, .moment-photo, .gallery-photo-button";
    let tx = -100, ty = -100, x = -100, y = -100;
    let running = false;
    let lastTrail = 0;

    function step() {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) requestAnimationFrame(step);
      else running = false;
    }

    window.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || reduce.matches) return;
      tx = event.clientX;
      ty = event.clientY;
      ring.classList.add("is-on");
      ring.classList.toggle("is-active", event.target instanceof Element && !!event.target.closest(interactive));
      if (!running) { running = true; requestAnimationFrame(step); }
      const now = performance.now();
      if (now - lastTrail > 55) { lastTrail = now; trail(tx, ty); }
    }, { passive: true });

    root.addEventListener("mouseleave", () => ring.classList.remove("is-on"));
  }

  /* ---------- klik di mana saja = percikan ---------- */
  document.addEventListener("click", (event) => {
    if (reduce.matches) return;
    const target = event.target;
    if (target instanceof Element && target.closest("input, select, audio, textarea, .music-popover")) return;
    if (event.clientX === 0 && event.clientY === 0) return;
    burst(event.clientX, event.clientY, 8);
  });

  /* =========================================================
     TEKS BERGERAK
     ========================================================= */

  /* Pecah teks jadi huruf (.fx-char) atau kata (.fx-w). Pembaca layar tetap
     membaca teks aslinya lewat salinan .visually-hidden. */
  function splitText(rootEl, mode = "chars") {
    const pieces = [];
    (function walk(node) {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent;
          if (!text.trim()) return;
          const frag = document.createDocumentFragment();
          const sr = document.createElement("span");
          sr.className = "visually-hidden";
          sr.textContent = text;
          const vis = document.createElement("span");
          vis.className = "fx-split";
          vis.setAttribute("aria-hidden", "true");
          text.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { vis.appendChild(document.createTextNode(part)); return; }
            if (mode === "words") {
              const w = document.createElement("span");
              w.className = "fx-w";
              w.textContent = part;
              vis.appendChild(w);
              pieces.push(w);
            } else {
              const wrap = document.createElement("span");
              wrap.className = "fx-wordwrap";
              Array.from(part).forEach((c) => {
                const ch = document.createElement("span");
                ch.className = "fx-char";
                ch.textContent = c;
                wrap.appendChild(ch);
                pieces.push(ch);
              });
              vis.appendChild(wrap);
            }
          });
          frag.append(sr, vis);
          child.replaceWith(frag);
        } else if (
          child.nodeType === Node.ELEMENT_NODE
          && !["INPUT", "BR", "SCRIPT", "STYLE"].includes(child.tagName)
          && child.getAttribute("aria-hidden") !== "true"
        ) {
          walk(child);
        }
      });
    })(rootEl);
    return pieces;
  }

  /* huruf muncul memantul satu per satu */
  function charsIn(chars, step = 30) {
    if (reduce.matches) return;
    chars.forEach((ch, i) => {
      ch.animate([
        { opacity: 0, transform: "translateY(.8em) rotate(10deg) scale(.6)" },
        { opacity: 1, transform: "none" },
      ], { duration: 700, delay: 200 + i * step, easing: "cubic-bezier(.2,1.4,.4,1)", fill: "backwards" });
    });
  }

  /* huruf meloncat saat disentuh kursor */
  function hoverHop(container, selector = ".fx-char") {
    if (!fine.matches || reduce.matches) return;
    container.addEventListener("pointerover", (event) => {
      const el = event.target instanceof Element ? event.target.closest(selector) : null;
      if (!el || !container.contains(el) || el._hop) return;
      el._hop = true;
      const anim = el.animate([
        { transform: "translateY(0) rotate(0) scale(1)" },
        { transform: `translateY(-.38em) rotate(${rand(-16, 16)}deg) scale(1.3)`, offset: 0.4 },
        { transform: "none" },
      ], { duration: 520, easing: "cubic-bezier(.3,1.5,.5,1)" });
      anim.onfinish = anim.oncancel = () => { el._hop = false; };
    });
  }

  /* huruf menghindar dari kursor, lalu kembali pelan-pelan */
  function repel(container, selector = ".fx-char", radius = 95, push = 24) {
    if (!fine.matches || reduce.matches) return;
    const items = Array.from(container.querySelectorAll(selector));
    if (!items.length) return;
    items.forEach((el) => { el._tx = 0; el._ty = 0; });
    let mx = -9999, my = -9999, raf = null;

    function frame() {
      raf = null;
      let busy = false;
      items.forEach((el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2 - el._tx;
        const cy = r.top + r.height / 2 - el._ty;
        const dx = cx - mx;
        const dy = cy - my;
        const d = Math.hypot(dx, dy) || 1;
        let tx = 0, ty = 0;
        if (d < radius) {
          const f = (1 - d / radius) * push;
          tx = (dx / d) * f;
          ty = (dy / d) * f;
        }
        el._tx += (tx - el._tx) * 0.18;
        el._ty += (ty - el._ty) * 0.18;
        if (Math.abs(tx - el._tx) > 0.08 || Math.abs(ty - el._ty) > 0.08) busy = true;
        else if (!tx && !ty) { el._tx = 0; el._ty = 0; }
        el.style.translate = el._tx || el._ty ? `${el._tx.toFixed(2)}px ${el._ty.toFixed(2)}px` : "";
      });
      if (busy) raf = requestAnimationFrame(frame);
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };

    window.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      const box = container.getBoundingClientRect();
      const near = event.clientX > box.left - radius && event.clientX < box.right + radius
        && event.clientY > box.top - radius && event.clientY < box.bottom + radius;
      if (near) { mx = event.clientX; my = event.clientY; wake(); }
      else if (mx > -9000) { mx = -9999; my = -9999; wake(); }
    }, { passive: true });
    root.addEventListener("mouseleave", () => { mx = -9999; my = -9999; wake(); });
  }

  /* teks berganti-ganti: diketik, ditahan, dihapus */
  function rotator(el, words, { type = 70, erase = 35, hold = 1700, startDelay = 0 } = {}) {
    const live = document.createElement("span");
    live.className = "fx-rotator-text";
    live.setAttribute("aria-hidden", "true");
    const caret = document.createElement("span");
    caret.className = "fx-rotator-caret";
    el.append(live, caret);
    if (reduce.matches) { live.textContent = words[0]; caret.remove(); return; }
    let w = 0, n = 0, deleting = false;
    function tick() {
      const word = words[w];
      if (!deleting) {
        n += 1;
        live.textContent = word.slice(0, n);
        if (n >= word.length) { deleting = true; return setTimeout(tick, hold); }
        return setTimeout(tick, type);
      }
      n -= 1;
      live.textContent = word.slice(0, n);
      if (n <= 0) { deleting = false; w = (w + 1) % words.length; return setTimeout(tick, 350); }
      return setTimeout(tick, erase);
    }
    setTimeout(tick, startDelay);
  }

  /* efek "acak lalu jadi": huruf berganti-ganti sebelum menetap */
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#*+=?";
  function scramble(el, duration = 900) {
    if (reduce.matches || el._scrambling) return;
    const node = Array.from(el.childNodes).reverse().find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (!node) return;
    const finalText = node.textContent;
    const start = performance.now();
    el._scrambling = true;
    (function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const settled = Math.floor(finalText.length * t);
      node.textContent = Array.from(finalText).map((c, i) => (i < settled || c === " " ? c : pick(GLYPHS))).join("");
      if (t < 1) requestAnimationFrame(frame);
      else { node.textContent = finalText; el._scrambling = false; }
    })(start);
  }

  /* scramble saat pertama terlihat + saat disentuh */
  function scrambleOnView(elements) {
    elements.forEach((el) => {
      el.addEventListener("pointerenter", () => scramble(el, 700));
    });
    if (reduce.matches || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        scramble(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    elements.forEach((el) => io.observe(el));
  }

  /* kata-kata naik satu per satu saat terlihat */
  function wordsRise(el) {
    if (reduce.matches || !("IntersectionObserver" in window)) return;
    const words = splitText(el, "words");
    words.forEach((w, i) => w.style.setProperty("--i", i));
    el.classList.add("fx-rise");
    const io = new IntersectionObserver((entries, obs) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      el.classList.add("is-in");
      obs.disconnect();
    }, { threshold: 0.5 });
    io.observe(el);
  }

  /* teks ikut ngebut saat halaman digulir (untuk teks berjalan) */
  function scrollBoost(track) {
    if (!track || reduce.matches) return;
    let boost = 0, running = false, lastY = window.scrollY;
    function tick() {
      boost *= 0.94;
      const animation = track.getAnimations()[0];
      if (animation) animation.playbackRate = 1 + boost;
      if (boost > 0.02) requestAnimationFrame(tick);
      else { if (animation) animation.playbackRate = 1; running = false; }
    }
    window.addEventListener("scroll", () => {
      boost = Math.min(6, boost + Math.abs(window.scrollY - lastY) * 0.08);
      lastY = window.scrollY;
      if (!running) { running = true; requestAnimationFrame(tick); }
    }, { passive: true });
  }

  window.FX = {
    burst, rain, fireworks, floaters, tilt, magnet, countUp, enhanceLightbox, layer, reduce, fine, rand, pick,
    splitText, charsIn, hoverHop, repel, rotator, scramble, scrambleOnView, wordsRise, scrollBoost,
  };
})();

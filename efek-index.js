/**
 * Efek Interaktif Khusus Beranda (index.html)
 * Membutuhkan efek-umum.js dimuat lebih dulu.
 */
(() => {
  "use strict";

  if (!window.FX) return;

  const {
    burst,
    rain,
    fireworks,
    floaters,
    tilt,
    magnet,
    enhanceLightbox,
    layer,
    reduce,
    fine,
    rand,
    splitText,
    charsIn,
    hoverHop,
    repel,
    rotator,
    scrambleOnView,
    wordsRise,
    scrollBoost,
  } = window.FX;

  /* ==========================================================================
     1. Elemen Melayang Interaktif (Balon & Bintang)
     ========================================================================== */
  floaters({
    pool: ["🎈", "🎈", "🎀", "⭐", "💛", "🦋"],
    count: window.innerWidth < 680 ? 5 : 9,
    interactive: true,
  });

  /* ==========================================================================
     2. Kemiringan Kartu & Tombol Magnetik
     ========================================================================== */
  tilt(document.querySelectorAll(".cake-card, .wish-card, .little-things-card, .gallery-photo"), 7);
  magnet(document.querySelectorAll(".button, .theme-toggle"));
  enhanceLightbox(document.querySelector("#birthdayLightbox"));

  /* ==========================================================================
     3. Stiker Draggable (Bisa Diseret & Membal Balik)
     ========================================================================== */
  document.querySelectorAll(".sticker").forEach((sticker) => {
    sticker.classList.add("fx-draggable");
    let startX = 0;
    let startY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;

    sticker.addEventListener("pointerdown", (event) => {
      dragging = true;
      startX = event.clientX - offsetX;
      startY = event.clientY - offsetY;
      sticker.setPointerCapture?.(event.pointerId);
      sticker.style.animation = "none";
      sticker.style.transition = "transform 0.25s ease";
      sticker.classList.add("is-dragging");
      event.preventDefault();
    });

    sticker.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      offsetX = event.clientX - startX;
      offsetY = event.clientY - startY;
      sticker.style.translate = `${offsetX}px ${offsetY}px`;
    });

    const release = (event) => {
      if (!dragging) return;
      dragging = false;
      sticker.releasePointerCapture?.(event.pointerId);
      sticker.classList.remove("is-dragging");
      burst(event.clientX, event.clientY, 6, ["✨", "💖", "⭐"]);
      window.BirthdayAppState?.playSfx?.("pop");

      offsetX = 0;
      offsetY = 0;
      sticker.style.transition = "translate 0.6s cubic-bezier(0.3, 1.6, 0.5, 1), transform 0.25s ease";
      sticker.style.translate = "0px 0px";

      setTimeout(() => {
        sticker.style.transition = "";
        sticker.style.translate = "";
        sticker.style.animation = "";
      }, 650);
    };

    sticker.addEventListener("pointerup", release);
    sticker.addEventListener("pointercancel", release);
  });

  /* ==========================================================================
     4. Dekorasi Foto Utama: Letusan Klik & Parallax Kursor
     ========================================================================== */
  const shapeStar = document.querySelector(".shape-star");
  const shapeHeart = document.querySelector(".shape-heart");

  [shapeStar, shapeHeart].forEach((shape) => {
    if (!shape) return;
    shape.addEventListener("click", (event) => {
      event.stopPropagation();
      const rect = shape.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 14, ["💖", "✨", "⭐"]);
      window.BirthdayAppState?.playSfx?.("sparkle");
    });
  });

  const hero = document.querySelector(".hero");
  if (hero && fine.matches) {
    hero.addEventListener("pointermove", (event) => {
      if (reduce.matches) return;
      const rect = hero.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      if (shapeStar) shapeStar.style.translate = `${px * -26}px ${py * -26}px`;
      if (shapeHeart) shapeHeart.style.translate = `${px * 30}px ${py * 30}px`;
    });
  }

  /* ==========================================================================
     5. Aksi Perayaan Tambahan (Tombol & Klik Ganda Foto)
     ========================================================================== */
  document.querySelector("#celebrateButton")?.addEventListener("click", () => {
    fireworks(4);
  });

  document.querySelector("#photoDropZone")?.addEventListener("dblclick", () => {
    if (typeof window.celebrate === "function") window.celebrate(100);
    fireworks(3);
  });

  /* ==========================================================================
     6. Animasi Kue Ulang Tahun & Respon Tiup Lilin
     ========================================================================== */
  const cakeScene = document.querySelector("#cakeScene");
  if (cakeScene) {
    cakeScene.addEventListener("click", () => {
      if (reduce.matches) return;
      window.BirthdayAppState?.playSfx?.("tap");
      cakeScene.querySelectorAll(".cake").forEach((cake) => {
        cake.animate(
          [
            { rotate: "0deg" },
            { rotate: "-5deg" },
            { rotate: "4deg" },
            { rotate: "-2deg" },
            { rotate: "0deg" },
          ],
          { duration: 500, easing: "ease-in-out" }
        );
      });
    });

    new MutationObserver(() => {
      if (!cakeScene.classList.contains("blown")) return;
      const rect = cakeScene.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + 40, 18, ["✨", "🎂", "💖", "🎉"]);
      fireworks(3);
      rain(["🎈", "🎉", "✨"], 18);
    }).observe(cakeScene, { attributes: true, attributeFilter: ["class"] });
  }

  /* ==========================================================================
     7. Animasi Buka Surat & Penerbangan Kupu-Kupu
     ========================================================================== */
  function flyButterflies(x, y) {
    if (reduce.matches) return;
    for (let i = 0; i < 10; i += 1) {
      const el = document.createElement("span");
      el.className = "fx-particle";
      el.textContent = "🦋";
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.fontSize = `${rand(22, 34)}px`;
      layer.appendChild(el);

      const frames = [];
      let dx = 0;
      let dy = 0;
      const steps = 9;

      for (let s = 0; s <= steps; s += 1) {
        dx += rand(-110, 110);
        dy -= rand(40, 90);
        const flap = s % 2 === 0 ? 1 : 0.45;
        frames.push({
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rand(-25, 25)}deg) scaleX(${flap})`,
          opacity: s === steps ? 0 : 1,
        });
      }

      const animation = el.animate(frames, {
        duration: rand(4500, 7000),
        delay: i * 120,
        easing: "ease-in-out",
        fill: "backwards",
      });
      animation.onfinish = () => el.remove();
    }
  }

  const letterScene = document.querySelector("#letterScene");
  if (letterScene) {
    new MutationObserver(() => {
      if (!letterScene.classList.contains("is-open")) return;
      setTimeout(() => {
        const envelope = letterScene.querySelector(".letter-envelope");
        if (!envelope) return;
        const rect = envelope.getBoundingClientRect();
        flyButterflies(rect.left + rect.width / 2, rect.top + rect.height / 2);
        rain(["🌸", "💗", "✨"], 16);
      }, reduce.matches ? 300 : 1000);
    }).observe(letterScene, { attributes: true, attributeFilter: ["class"] });
  }

  /* ==========================================================================
     8. Animasi Teks Mengetik & Rotasi Doa
     ========================================================================== */
  const description = document.querySelector(".hero-description");
  let typingDuration = 0;

  if (description && !reduce.matches) {
    const fullText = description.textContent.trim();
    const chars = Array.from(fullText);
    description.style.minHeight = `${description.offsetHeight}px`;
    description.textContent = "";

    const hidden = document.createElement("span");
    hidden.className = "visually-hidden";
    hidden.textContent = fullText;

    const typed = document.createElement("span");
    typed.className = "fx-typing";
    typed.setAttribute("aria-hidden", "true");
    description.append(hidden, typed);

    let charIndex = 0;
    setTimeout(() => {
      const timer = setInterval(() => {
        charIndex += 1;
        typed.textContent = chars.slice(0, charIndex).join("");
        if (charIndex >= chars.length) {
          clearInterval(timer);
          setTimeout(() => typed.classList.remove("fx-typing"), 1400);
        }
      }, 24);
    }, 600);

    typingDuration = 600 + chars.length * 24 + 400;
  }

  // Kalimat doa berganti-ganti di bawah deskripsi
  if (description) {
    const line = document.createElement("p");
    line.className = "fx-rotator";

    const label = document.createElement("span");
    label.className = "fx-rotator-label";
    label.textContent = "Semoga kamu ";

    const allWishes = document.createElement("span");
    allWishes.className = "visually-hidden";
    allWishes.textContent = "sehat selalu, bahagia terus, makin sukses, banyak tawa, dikelilingi orang baik.";

    line.append(allWishes, label);
    description.after(line);

    const startDelay = reduce.matches ? 0 : typingDuration;
    rotator(
      line,
      ["sehat selalu ✨", "bahagia terus 💛", "makin sukses 🚀", "banyak tawa 😆", "dikelilingi orang baik 🫶"],
      { startDelay }
    );
  }

  /* ==========================================================================
     9. Animasi Tipografi Interaktif
     ========================================================================== */
  // Judul utama: huruf meloncat & menghindar dari kursor
  const title = document.querySelector("#birthdayTitle");
  if (title && !reduce.matches) {
    const chars = splitText(title, "chars");
    charsIn(chars, 32);
    hoverHop(title);
    repel(title);
  }

  // Eyebrow headings: huruf acak stabil
  scrambleOnView(Array.from(document.querySelectorAll(".eyebrow")));

  // Teks berjalan bertambah cepat saat halaman digulir
  scrollBoost(document.querySelector(".strip-content"));

  // Kalimat penutup: kata muncul bertahap
  const closing = document.querySelector(".closing-note p");
  if (closing) wordsRise(closing);

  // Judul kartu: huruf meloncat saat disentuh/disorot
  document.querySelectorAll(".wish-intro, .little-things-content h3, .letter-greeting").forEach((el) => {
    splitText(el, "chars");
    hoverHop(el);
  });

  // Goyangan input nama saat diketik
  const nameInput = document.querySelector("#birthdayName");
  nameInput?.addEventListener("input", () => {
    if (reduce.matches) return;
    nameInput.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.06) rotate(-1.5deg)" },
        { transform: "scale(1)" },
      ],
      { duration: 220, easing: "ease-out" }
    );
  });

  /* ==========================================================================
     10. Sambutan Awal Perayaan
     ========================================================================== */
  setTimeout(() => {
    if (typeof window.celebrate === "function") window.celebrate(90);
    fireworks(3);
  }, 800);
})();

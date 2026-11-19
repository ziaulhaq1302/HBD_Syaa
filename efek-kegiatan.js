/**
 * Efek Interaktif Khusus Halaman Kegiatan (kegiatan.html)
 * Membutuhkan efek-umum.js dimuat lebih dulu.
 */
(() => {
  "use strict";

  if (!window.FX) return;

  const {
    burst,
    rain,
    floaters,
    tilt,
    magnet,
    countUp,
    enhanceLightbox,
    reduce,
    splitText,
    hoverHop,
    repel,
    rotator,
    scrambleOnView,
    scrollBoost,
  } = window.FX;

  /* ==========================================================================
     1. Dekorasi Partikel Melayang & Kemiringan Elemen
     ========================================================================== */
  floaters({
    pool: ["✦", "✧", "♡", "🌸", "✨"],
    count: window.innerWidth < 680 ? 5 : 10,
  });

  tilt(document.querySelectorAll(".moment-photo"), 8);
  tilt(document.querySelectorAll(".zia-profile-card"), 3);
  magnet(document.querySelectorAll(".activity-cv-link, .zia-cheer-button"));
  enhanceLightbox(document.querySelector("#photoLightbox"));

  // Nomor urut bertahap untuk animasi stagger kemunculan foto
  document.querySelectorAll(".activity-cover-photos, .moment-photo-grid").forEach((grid) => {
    grid.querySelectorAll(".moment-photo").forEach((photo, index) => {
      photo.style.setProperty("--i", index);
    });
  });

  /* ==========================================================================
     2. Judul Kata demi Kata & Efek Fisika Kursor
     ========================================================================== */
  const title = document.querySelector(".activity-page-intro h1");
  if (title && !reduce.matches) {
    title.setAttribute("aria-label", title.textContent.replace(/\s+/g, " ").trim());
    let wordIndex = 0;

    (function split(node) {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              fragment.appendChild(document.createTextNode(part));
            } else {
              const word = document.createElement("i");
              word.className = "fx-word";
              word.setAttribute("aria-hidden", "true");
              word.style.setProperty("--i", wordIndex);
              wordIndex += 1;
              word.textContent = part;
              fragment.appendChild(word);
            }
          });
          child.replaceWith(fragment);
        } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains("fx-word")) {
          split(child);
        }
      });
    })(title);

    repel(title, ".fx-word", 110, 22);
    hoverHop(title, ".fx-word");
  }

  /* ==========================================================================
     3. Teks Berputar (Rotator Aktivitas Zia)
     ========================================================================== */
  const intro = document.querySelector(".activity-page-intro > p:not(.eyebrow)");
  if (intro) {
    const line = document.createElement("p");
    line.className = "fx-rotator";

    const label = document.createElement("span");
    label.className = "fx-rotator-label";
    label.textContent = "Zia lagi ";

    const allActivities = document.createElement("span");
    allActivities.className = "visually-hidden";
    allActivities.textContent = "ngoding, ngerjain skripsi, healing bareng kawan, belajar hal baru.";

    line.append(allActivities, label);
    intro.after(line);

    rotator(
      line,
      ["ngoding 💻", "ngerjain skripsi 📚", "healing bareng kawan 🌿", "belajar hal baru ✨"],
      { startDelay: 1500 }
    );
  }

  /* ==========================================================================
     4. Animasi Huruf Acak & Meloncat
     ========================================================================== */
  scrambleOnView(Array.from(document.querySelectorAll(".eyebrow, .zia-kicker")));

  document.querySelectorAll(".moment-group h3, .zia-profile-heading h2").forEach((el) => {
    splitText(el, "chars");
    hoverHop(el);
  });

  /* ==========================================================================
     5. Respon Tombol Semangat & Goyangan Avatar
     ========================================================================== */
  const cheerButton = document.querySelector("#ziaCheerButton");
  cheerButton?.addEventListener("click", () => {
    if (cheerButton.getAttribute("aria-pressed") !== "true") return;
    const rect = cheerButton.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 14, ["💖", "💗", "✨"]);
    rain(["💖", "💗", "♡", "🌸"], 28);
  });

  const avatar = document.querySelector(".zia-avatar");
  avatar?.addEventListener("click", (event) => {
    event.stopPropagation();
    const rect = avatar.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12, ["💖", "🌸", "✨", "🎓"]);
    window.BirthdayAppState?.playSfx?.("sparkle");
    if (reduce.matches) return;

    avatar.animate(
      [
        { rotate: "0deg", scale: "1" },
        { rotate: "-14deg", scale: "1.15" },
        { rotate: "12deg", scale: "1.15" },
        { rotate: "-6deg", scale: "1.05" },
        { rotate: "0deg", scale: "1" },
      ],
      { duration: 600, easing: "ease-in-out" }
    );
  });

  /* ==========================================================================
     6. Navigasi Album: Scrollspy & Hitungan Bertambah
     ========================================================================== */
  const nav = document.querySelector(".album-jump-nav");
  const links = new Map();
  nav?.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href?.startsWith("#")) {
      links.set(href.slice(1), link);
    }
  });

  if (nav && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const link = links.get(entry.target.getAttribute("aria-labelledby"));
          if (!link) return;

          links.forEach((other) => other.classList.remove("is-active"));
          link.classList.add("is-active");
          nav.scrollTo({
            left: link.offsetLeft - nav.clientWidth / 2 + link.clientWidth / 2,
            behavior: reduce.matches ? "auto" : "smooth",
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    document.querySelectorAll(".moment-group").forEach((group) => spy.observe(group));

    const badges = Array.from(nav.querySelectorAll("a span"));
    const totals = badges.map((badge) => Number(badge.textContent) || 0);
    if (!reduce.matches) {
      badges.forEach((badge) => {
        badge.textContent = "0";
      });
    }

    const counter = new IntersectionObserver(
      (entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        badges.forEach((badge, i) => countUp(badge, totals[i]));
        observer.disconnect();
      },
      { threshold: 0.6 }
    );
    counter.observe(nav);
  }

  /* ==========================================================================
     7. Teks Berjalan Bertambah Cepat Saat Digulir
     ========================================================================== */
  scrollBoost(document.querySelector(".zia-marquee-track"));
})();

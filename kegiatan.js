/**
 * Skrip Halaman Kegiatan (kegiatan.html / #view-activity)
 * Mengatur album foto kegiatan, lightbox, tombol semangat, dan hadiah interaktif untuk Zia.
 * Berbagi pemutar musik bersama skrip utama tanpa memutus atau mengulang lagu.
 */
(() => {
  "use strict";

  const AppState = window.BirthdayAppState;
  const playSfx = (type) => AppState?.playSfx?.(type);

  /* ==========================================================================
     1. Seleksi Elemen DOM
     ========================================================================== */
  const photoCollection = document.querySelector("#view-activity") || document.querySelector("main");
  const photoLightbox = document.querySelector("#photoLightbox");
  const photoLightboxImage = document.querySelector("#photoLightboxImage");
  const photoLightboxClose = document.querySelector("#photoLightboxClose");
  const photoLightboxPrevious = document.querySelector("#photoLightboxPrevious");
  const photoLightboxNext = document.querySelector("#photoLightboxNext");
  const photoLightboxCounter = document.querySelector("#photoLightboxCounter");
  const photoButtons = photoCollection
    ? Array.from(photoCollection.querySelectorAll(".moment-photo"))
    : [];

  // Tombol Semangat & Hadiah Interaktif untuk Zia
  const ziaRecipientName = document.querySelector(".zia-recipient-name");
  const ziaCheerButton = document.querySelector("#ziaCheerButton");
  const ziaCheerLabel = document.querySelector("#ziaCheerLabel");
  const ziaCheerCounter = document.querySelector("#ziaCheerCounter");
  const ziaCheerMessage = document.querySelector("#ziaCheerMessage");
  const ziaCoffeeBtn = document.querySelector("#ziaCoffeeBtn");
  const ziaThesisBtn = document.querySelector("#ziaThesisBtn");
  const ziaToastNote = document.querySelector("#ziaToastNote");

  // Navigasi Lompat Album
  const nav = document.querySelector(".album-jump-nav");
  let activePhotoIndex = -1;

  /* ==========================================================================
     2. Inisialisasi Sinkronisasi
     ========================================================================== */
  const currentRecipient = AppState ? AppState.getName() : "Syaa";
  if (ziaRecipientName) ziaRecipientName.textContent = currentRecipient;

  if (ziaCheerCounter && AppState) {
    ziaCheerCounter.textContent = String(AppState.getCheers());
  }

  /* ==========================================================================
     3. Dialog Lightbox Album Foto Kegiatan
     ========================================================================== */
  function showPhoto(index) {
    if (!photoButtons.length || !photoLightboxImage || !photoLightboxCounter) return;

    activePhotoIndex = (index + photoButtons.length) % photoButtons.length;
    const photoButton = photoButtons[activePhotoIndex];
    const photo = photoButton.querySelector("img");
    if (!photo) return;

    photoLightboxImage.src = photo.currentSrc || photo.src;
    photoLightboxImage.alt = photoButton.getAttribute("aria-label") || "Foto kenangan";
    photoLightboxCounter.textContent = `${activePhotoIndex + 1} / ${photoButtons.length}`;
  }

  if (photoCollection && photoLightbox) {
    photoCollection.addEventListener("click", (event) => {
      const target = event.target;
      const photoButton = target instanceof Element ? target.closest(".moment-photo") : null;
      if (!photoButton) return;

      playSfx("pop");
      showPhoto(photoButtons.indexOf(photoButton));
      if (!photoLightbox.open) photoLightbox.showModal();
    });

    photoLightboxPrevious?.addEventListener("click", () => {
      playSfx("tap");
      showPhoto(activePhotoIndex - 1);
    });

    photoLightboxNext?.addEventListener("click", () => {
      playSfx("tap");
      showPhoto(activePhotoIndex + 1);
    });

    photoLightboxClose?.addEventListener("click", () => {
      playSfx("tap");
      photoLightbox.close();
    });

    photoLightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        playSfx("tap");
        showPhoto(activePhotoIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        playSfx("tap");
        showPhoto(activePhotoIndex + 1);
      }
    });

    photoLightbox.addEventListener("click", (event) => {
      if (event.target === photoLightbox) photoLightbox.close();
    });

    photoLightbox.addEventListener("close", () => {
      photoLightboxImage?.removeAttribute("src");
      if (photoLightboxCounter) photoLightboxCounter.textContent = "";
      activePhotoIndex = -1;
    });
  }

  /* ==========================================================================
     4. Tombol Interaktif Kirim Semangat & Hadiah untuk Zia
     ========================================================================== */
  const CHEER_QUOTES = [
    `"Makasih banyak ya! Tambah semangat garap skripsi! 🚀"`,
    `"Peluk hangat dan doa baik dari Aceh buat kamu! 💛"`,
    `"Energi langsung naik 200%! Doakan sidang sarjana lancar ya! 🎓"`,
    `"Zia di Aceh sehat selalu dan selalu doain yang terbaik buat kamu! ✨"`,
  ];

  if (ziaCheerButton) {
    ziaCheerButton.addEventListener("click", () => {
      const newTotal = AppState ? AppState.addCheer() : 1;
      ziaCheerButton.setAttribute("aria-pressed", "true");
      if (ziaCheerLabel) ziaCheerLabel.textContent = "Semangat terkirim!";
      if (ziaCheerCounter) ziaCheerCounter.textContent = String(newTotal);

      playSfx("cheer");
      const randomQuote = CHEER_QUOTES[newTotal % CHEER_QUOTES.length];
      if (ziaCheerMessage) ziaCheerMessage.textContent = randomQuote;
    });
  }

  function showZiaToast(text) {
    if (!ziaToastNote) return;
    ziaToastNote.textContent = text;
    ziaToastNote.classList.add("is-visible");
    setTimeout(() => {
      ziaToastNote.classList.remove("is-visible");
    }, 4500);
  }

  function spawnFloatingIcon(emoji, fromElement) {
    const rect = fromElement.getBoundingClientRect();
    const el = document.createElement("span");
    el.textContent = emoji;
    el.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top}px;
      font-size: 26px;
      z-index: 50;
      pointer-events: none;
    `;
    document.body.appendChild(el);
    const anim = el.animate(
      [
        { transform: "translate(-50%, 0) scale(0.6)", opacity: 1 },
        { transform: "translate(-50%, -90px) scale(1.4)", opacity: 0 },
      ],
      { duration: 1000, easing: "ease-out" }
    );
    anim.onfinish = () => el.remove();
  }

  ziaCoffeeBtn?.addEventListener("click", () => {
    playSfx("sparkle");
    spawnFloatingIcon("☕", ziaCoffeeBtn);
    showZiaToast(`Zia: "Kopi sanger khas Acehnya sampai! Mata langsung melek siap ngoding! ☕⚡"`);
    if (AppState) {
      const c = AppState.addCheer();
      if (ziaCheerCounter) ziaCheerCounter.textContent = String(c);
    }
  });

  ziaThesisBtn?.addEventListener("click", () => {
    playSfx("party");
    spawnFloatingIcon("🎓", ziaThesisBtn);
    showZiaToast(`Zia: "Aamiin ya Allah! Doa kamu berharga banget, makasih banyak ya! 🎓✨"`);
    if (AppState) {
      const c = AppState.addCheer();
      if (ziaCheerCounter) ziaCheerCounter.textContent = String(c);
    }
  });
})();

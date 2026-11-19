/**
 * Skrip Utama Halaman Beranda & Pengendali Navigasi Mulus (Router)
 * Menangani foto, pemutar musik abadi (tanpa jeda/ulang antar-halaman),
 * lilin kue, amplop surat, filter foto, generator doa, dan transisi tampilan.
 */
(() => {
  "use strict";

  const AppState = window.BirthdayAppState;
  const MusicState = window.BirthdayMusicState;
  const playSfx = (type) => AppState?.playSfx?.(type);

  /* ==========================================================================
     1. Seleksi Elemen DOM
     ========================================================================== */
  // Tampilan Halaman (Views)
  const viewBirthday = document.querySelector("#view-birthday");
  const viewActivity = document.querySelector("#view-activity");

  // Foto Utama & Filter
  const photoInput = document.querySelector("#photoInput");
  const birthdayPhoto = document.querySelector("#birthdayPhoto");
  const photoPlaceholder = document.querySelector("#photoPlaceholder");
  const photoDropZone = document.querySelector("#photoDropZone");
  const photoFilterButtons = document.querySelectorAll(".photo-filter-btn");

  // Teks & Aksesibilitas
  const birthdayName = document.querySelector("#birthdayName");
  const announcement = document.querySelector("#announcement");

  // Mode Tema & Suara Efek
  const themeToggles = document.querySelectorAll("#themeToggle, #themeToggleActivity");
  const themeToggleLabel = document.querySelector("#themeToggleLabel");
  const themeToggleIcon = document.querySelector("#themeToggleIcon");
  const soundToggles = document.querySelectorAll("#soundToggle, #soundToggleActivity");
  const soundToggleIcon = document.querySelector("#soundToggleIcon");
  const soundToggleLabel = document.querySelector("#soundToggleLabel");

  // Kanvas Confetti
  const canvas = document.querySelector("#confettiCanvas");
  const context = canvas ? canvas.getContext("2d") : null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Pemutar Musik (Satu instance abadi untuk kedua halaman)
  const musicSelect = document.querySelector("#musicSelect");
  const birthdayAudio = document.querySelector("#birthdayAudio");
  const musicFiles = document.querySelector("#musicFiles");
  const musicStatus = document.querySelector("#musicStatus");
  const musicPopover = document.querySelector("#musicPopover");
  const musicToggle = document.querySelector("#musicToggle");
  const musicClose = document.querySelector("#musicClose");

  // Amplop & Surat
  const letterScene = document.querySelector("#letterScene");
  const letterEnvelope = document.querySelector(".letter-envelope");
  const letterToggle = document.querySelector("#letterToggle");
  const letterToggleLabel = document.querySelector("#letterToggleLabel");
  const letterContents = document.querySelector("#letterContents");
  const letterClose = document.querySelector("#letterClose");
  const letterRecipientName = document.querySelector("#letterRecipientName");

  // Galeri & Lightbox
  const birthdayGallery = document.querySelector(".photo-gallery");
  const galleryLightbox = document.querySelector("#birthdayLightbox");
  const galleryLightboxImage = document.querySelector("#birthdayLightboxImage");
  const galleryLightboxClose = document.querySelector("#birthdayLightboxClose");
  const galleryLightboxPrevious = document.querySelector("#birthdayLightboxPrevious");
  const galleryLightboxNext = document.querySelector("#birthdayLightboxNext");
  const galleryLightboxCounter = document.querySelector("#birthdayLightboxCounter");
  const galleryPhotoButtons = birthdayGallery
    ? Array.from(birthdayGallery.querySelectorAll(".gallery-photo-button"))
    : [];

  // Kue, Lilin & Generator Doa
  const celebrateButton = document.querySelector("#celebrateButton");
  const candleButton = document.querySelector("#candleButton");
  const cakeScene = document.querySelector("#cakeScene");
  const cakeMessage = document.querySelector("#cakeMessage");
  const individualCandles = document.querySelectorAll(".candle");
  const fortuneQuote = document.querySelector("#fortuneQuote");
  const fortuneBtn = document.querySelector("#fortuneBtn");

  // Lencana Teaser Kegiatan
  const teaserCheerCount = document.querySelector("#teaserCheerCount");
  const revealElements = document.querySelectorAll("[data-reveal]");

  /* ==========================================================================
     2. Status Internal & Inisialisasi
     ========================================================================== */
  let photoUrl = null;
  let particles = [];
  let animationFrame = null;
  let autoplayBlocked = false;
  let activeGalleryPhotoIndex = -1;
  const customMusicUrls = [];

  // Inisialisasi Nama Penerima
  const initialName = AppState ? AppState.getName() : "Syaa";
  if (birthdayName) birthdayName.value = initialName;
  if (letterRecipientName) letterRecipientName.textContent = initialName;
  document.querySelectorAll(".zia-recipient-name").forEach((el) => {
    el.textContent = initialName;
  });

  // Sinkronisasi Tema
  function updateThemeUI(theme) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = theme;
    themeToggles.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute("aria-label", isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap");
    });
    if (themeToggleLabel) themeToggleLabel.textContent = isDark ? "Mode terang" : "Mode gelap";
    if (themeToggleIcon) themeToggleIcon.textContent = isDark ? "☀" : "☾";
  }
  updateThemeUI(AppState ? AppState.getTheme() : "light");

  themeToggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      playSfx("tap");
      const isDark = document.documentElement.dataset.theme !== "dark";
      const nextTheme = isDark ? "dark" : "light";
      if (AppState) AppState.setTheme(nextTheme);
      else document.documentElement.dataset.theme = nextTheme;
      updateThemeUI(nextTheme);
    });
  });

  // Sinkronisasi Efek Suara
  function updateSoundUI(muted) {
    soundToggles.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(!muted));
      btn.setAttribute("aria-label", muted ? "Aktifkan efek suara" : "Bisukan efek suara");
      const icon = btn.querySelector(".sound-toggle-icon");
      if (icon) icon.textContent = muted ? "🔇" : "🔊";
    });
    if (soundToggleLabel) soundToggleLabel.textContent = muted ? "Senyap" : "Suara";
  }
  updateSoundUI(AppState ? AppState.isMuted() : false);

  soundToggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (AppState) {
        const isMuted = AppState.toggleMuted();
        updateSoundUI(isMuted);
        if (!isMuted) playSfx("chime");
      }
    });
  });

  if (teaserCheerCount && AppState) {
    teaserCheerCount.textContent = String(AppState.getCheers());
  }

  /* ==========================================================================
     3. Navigasi Antar-Halaman Mulus (Single Page Transition)
     Musik tidak pernah mati/berulang saat beralih halaman!
     ========================================================================== */
  function switchView(targetView, updateHistory = true) {
    const isActivity = targetView === "activity";
    if (!viewBirthday || !viewActivity) return;

    if (isActivity) {
      viewBirthday.hidden = true;
      viewActivity.hidden = false;
      document.body.classList.add("activity-page");
      document.title = "Kegiatan Anak Teknik — Kabar dari Aceh";
      if (updateHistory) {
        history.pushState({ view: "activity" }, "", "kegiatan.html");
      }
    } else {
      viewActivity.hidden = true;
      viewBirthday.hidden = false;
      document.body.classList.remove("activity-page");
      const currentName = AppState ? AppState.getName() : "Syaa";
      document.title = `Selamat ulang tahun, ${currentName}! — Kita Rayakan`;
      if (updateHistory) {
        history.pushState({ view: "birthday" }, "", "index.html");
      }
    }

    // Perbarui lencana semangat
    if (teaserCheerCount && AppState) {
      teaserCheerCount.textContent = String(AppState.getCheers());
    }

    // Gulir halus ke atas
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
  }

  // Intersep klik tautan menuju halaman kegiatan
  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a") : null;
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    if (href.includes("kegiatan.html") || link.classList.contains("activity-jump")) {
      event.preventDefault();
      playSfx("tap");
      switchView("activity", true);
    } else if (
      href.includes("index.html") ||
      link.classList.contains("activity-back-link") ||
      link.classList.contains("brand")
    ) {
      if (!viewActivity.hidden) {
        event.preventDefault();
        playSfx("tap");
        switchView("birthday", true);
      }
    }
  });

  window.addEventListener("popstate", (event) => {
    const view = event.state?.view || (window.location.pathname.includes("kegiatan") ? "activity" : "birthday");
    switchView(view, false);
  });

  /* ==========================================================================
     4. Pemutar Musik Otomatis & Kontinu (Tanpa Jeda)
     ========================================================================== */
  const restoredMusicState = MusicState?.read?.() || null;

  function loadSelectedSong() {
    if (!birthdayAudio || !musicSelect) return;
    const isPlaying = !birthdayAudio.paused;
    birthdayAudio.src = musicSelect.value;
    birthdayAudio.load();
    if (isPlaying) {
      birthdayAudio.play().catch(() => {});
    }

    const selectedText = musicSelect.options[musicSelect.selectedIndex]?.text || "Lagu";
    if (musicStatus) musicStatus.textContent = `${selectedText} siap diputar.`;
  }

  function playBirthdaySong() {
    if (!birthdayAudio) return;
    const playRequest = birthdayAudio.play();
    if (playRequest) {
      playRequest
        .then(() => {
          autoplayBlocked = false;
          musicToggle?.classList.remove("needs-tap");
          cleanupGestureListeners();
        })
        .catch(() => {
          autoplayBlocked = true;
          // Peramban menunggu interaksi pertama dari pengguna
        });
    }
  }

  // Buka pemutaran audio otomatis pada sentuhan / klik pertama di mana pun
  const gestureEvents = ["pointerdown", "touchstart", "click", "keydown", "scroll"];
  function onFirstUserGesture() {
    if (birthdayAudio && birthdayAudio.paused) {
      birthdayAudio
        .play()
        .then(() => {
          autoplayBlocked = false;
          musicToggle?.classList.remove("needs-tap");
          cleanupGestureListeners();
        })
        .catch(() => {});
    } else {
      cleanupGestureListeners();
    }
  }

  function cleanupGestureListeners() {
    gestureEvents.forEach((evt) => {
      window.removeEventListener(evt, onFirstUserGesture, true);
    });
  }

  gestureEvents.forEach((evt) => {
    window.addEventListener(evt, onFirstUserGesture, { capture: true, passive: true });
  });

  // Sambungkan penyimpanan waktu pemutaran secara kontinu
  if (birthdayAudio && MusicState?.bindAudioPersistence) {
    MusicState.bindAudioPersistence(birthdayAudio);
  }

  // Pulihkan waktu lagu terakhir jika ada
  if (birthdayAudio) {
    if (restoredMusicState && restoredMusicState.source) {
      const trackName = restoredMusicState.source.split("/").pop();
      birthdayAudio.src = trackName;
      if (musicSelect) musicSelect.value = trackName;

      const applySavedTime = () => {
        if (Number.isFinite(restoredMusicState.currentTime) && restoredMusicState.currentTime > 0) {
          birthdayAudio.currentTime = Math.min(
            restoredMusicState.currentTime,
            Math.max(0, (birthdayAudio.duration || 999) - 0.2)
          );
        }
        playBirthdaySong();
      };

      if (birthdayAudio.readyState >= 1) {
        applySavedTime();
      } else {
        birthdayAudio.addEventListener("loadedmetadata", applySavedTime, { once: true });
      }
    } else {
      playBirthdaySong();
    }
  }

  musicSelect?.addEventListener("change", loadSelectedSong);

  musicFiles?.addEventListener("change", () => {
    if (!musicFiles || !birthdayAudio || !musicSelect) return;
    const files = Array.from(musicFiles.files || []);
    const audioFiles = files.filter(
      (file) => file.type.startsWith("audio/") || /\.(mp3|m4a|wav|ogg|aac|flac|webm)$/i.test(file.name)
    );

    if (!audioFiles.length) {
      musicFiles.value = "";
      return;
    }

    const addedTracks = audioFiles.map((file) => {
      const url = URL.createObjectURL(file);
      customMusicUrls.push(url);
      musicSelect.add(new Option(file.name, url));
      return { name: file.name, url };
    });

    musicSelect.value = addedTracks[0].url;
    loadSelectedSong();
    birthdayAudio.play().catch(() => {});
    musicFiles.value = "";
  });

  if (musicToggle && musicPopover) {
    musicToggle.addEventListener("click", () => {
      if (autoplayBlocked || birthdayAudio.paused) {
        birthdayAudio.play().then(() => {
          autoplayBlocked = false;
          musicToggle.classList.remove("needs-tap");
        }).catch(() => {});
      }

      playSfx("tap");
      const isOpening = musicPopover.hidden;
      musicPopover.hidden = !isOpening;
      musicToggle.setAttribute("aria-expanded", String(isOpening));
      musicToggle.setAttribute("aria-label", isOpening ? "Tutup pemutar musik" : "Buka pemutar musik");
      musicToggle.title = isOpening ? "Tutup pemutar musik" : "Buka pemutar musik";
      if (isOpening) musicSelect?.focus();
    });

    musicClose?.addEventListener("click", () => {
      playSfx("tap");
      musicPopover.hidden = true;
      musicToggle.setAttribute("aria-expanded", "false");
      musicToggle.setAttribute("aria-label", "Buka pemutar musik");
      musicToggle.focus();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !musicPopover.hidden) {
        musicPopover.hidden = true;
        musicToggle.setAttribute("aria-expanded", "false");
        musicToggle.focus();
      }
    });
  }

  if (birthdayAudio) {
    birthdayAudio.addEventListener("play", () => {
      musicToggle?.classList.add("is-playing");
      if (musicStatus && musicSelect) {
        const text = musicSelect.options[musicSelect.selectedIndex]?.text || "Lagu";
        musicStatus.textContent = `${text} sedang diputar.`;
      }
    });

    birthdayAudio.addEventListener("pause", () => {
      musicToggle?.classList.remove("is-playing");
      if (musicStatus) musicStatus.textContent = "Musik dijeda.";
    });

    birthdayAudio.addEventListener("ended", () => {
      musicToggle?.classList.remove("is-playing");
    });
  }

  window.addEventListener("beforeunload", () => {
    for (const url of customMusicUrls) URL.revokeObjectURL(url);
  });

  /* ==========================================================================
     5. Galeri Foto & Lightbox
     ========================================================================== */
  function showBirthdayGalleryPhoto(index) {
    if (!galleryPhotoButtons.length || !galleryLightboxImage || !galleryLightboxCounter) return;

    activeGalleryPhotoIndex = (index + galleryPhotoButtons.length) % galleryPhotoButtons.length;
    const photo = galleryPhotoButtons[activeGalleryPhotoIndex].querySelector("img");
    if (!photo) return;

    galleryLightboxImage.src = photo.currentSrc || photo.src;
    galleryLightboxImage.alt = photo.alt || "Foto kenangan";
    galleryLightboxCounter.textContent = `${activeGalleryPhotoIndex + 1} / ${galleryPhotoButtons.length}`;
  }

  if (birthdayGallery && galleryLightbox) {
    birthdayGallery.addEventListener("click", (event) => {
      const target = event.target;
      const photoButton = target instanceof Element ? target.closest(".gallery-photo-button") : null;
      if (!photoButton) return;

      playSfx("pop");
      showBirthdayGalleryPhoto(galleryPhotoButtons.indexOf(photoButton));
      if (!galleryLightbox.open) galleryLightbox.showModal();
    });

    galleryLightboxPrevious?.addEventListener("click", () => {
      playSfx("tap");
      showBirthdayGalleryPhoto(activeGalleryPhotoIndex - 1);
    });

    galleryLightboxNext?.addEventListener("click", () => {
      playSfx("tap");
      showBirthdayGalleryPhoto(activeGalleryPhotoIndex + 1);
    });

    galleryLightboxClose?.addEventListener("click", () => {
      playSfx("tap");
      galleryLightbox.close();
    });

    galleryLightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        playSfx("tap");
        showBirthdayGalleryPhoto(activeGalleryPhotoIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        playSfx("tap");
        showBirthdayGalleryPhoto(activeGalleryPhotoIndex + 1);
      }
    });

    galleryLightbox.addEventListener("click", (event) => {
      if (event.target === galleryLightbox) galleryLightbox.close();
    });

    galleryLightbox.addEventListener("close", () => {
      galleryLightboxImage?.removeAttribute("src");
      if (galleryLightboxCounter) galleryLightboxCounter.textContent = "";
      activeGalleryPhotoIndex = -1;
    });
  }

  /* ==========================================================================
     6. Foto Utama & Filter Efek Instan
     ========================================================================== */
  function showPhoto(file) {
    if (!file || !file.type.startsWith("image/")) return;

    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(file);

    if (birthdayPhoto) {
      birthdayPhoto.src = photoUrl;
      birthdayPhoto.hidden = false;
    }
    if (photoPlaceholder) photoPlaceholder.hidden = true;
    playSfx("sparkle");
  }

  photoInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) showPhoto(file);
  });

  if (photoDropZone) {
    const frame = photoDropZone.querySelector(".photo-frame");
    photoDropZone.addEventListener("dragover", (event) => {
      event.preventDefault();
      frame?.classList.add("drag-over");
    });
    photoDropZone.addEventListener("dragleave", (event) => {
      if (!photoDropZone.contains(event.relatedTarget)) frame?.classList.remove("drag-over");
    });
    photoDropZone.addEventListener("drop", (event) => {
      event.preventDefault();
      frame?.classList.remove("drag-over");
      const file = event.dataTransfer?.files?.[0];
      if (file) showPhoto(file);
    });
  }

  photoFilterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      photoFilterButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const filter = btn.dataset.filter;
      birthdayPhoto?.classList.remove("filter-warm", "filter-pastel", "filter-vintage");
      if (filter && filter !== "normal") {
        birthdayPhoto?.classList.add(`filter-${filter}`);
      }
      playSfx("tap");
    });
  });

  /* ==========================================================================
     7. Ubah Nama & Sinkronisasi Global
     ========================================================================== */
  birthdayName?.addEventListener("input", () => {
    const name = AppState ? AppState.setName(birthdayName.value) : (birthdayName.value.trim() || "Syaa");
    document.title = `Selamat ulang tahun, ${name}! — Kita Rayakan`;
    if (letterRecipientName) letterRecipientName.textContent = name;
    document.querySelectorAll(".zia-recipient-name").forEach((el) => {
      el.textContent = name;
    });
  });

  /* ==========================================================================
     8. Buka & Tutup Surat
     ========================================================================== */
  function setLetterOpen(isOpen) {
    if (!letterScene || !letterContents || !letterToggle) return;
    letterScene.classList.toggle("is-open", isOpen);
    letterContents.hidden = !isOpen;
    letterToggle.setAttribute("aria-expanded", String(isOpen));
    if (letterToggleLabel) {
      letterToggleLabel.textContent = isOpen ? "Surat terbuka" : "Buka surat kecilmu";
    }

    if (isOpen) {
      playSfx("sparkle");
      if (letterEnvelope) {
        requestAnimationFrame(() => {
          letterEnvelope.scrollIntoView({
            behavior: reducedMotion.matches ? "auto" : "smooth",
            block: "center",
          });
        });
      }
    } else {
      playSfx("tap");
    }
  }

  letterToggle?.addEventListener("click", () => {
    if (letterContents) setLetterOpen(letterContents.hidden);
  });

  letterClose?.addEventListener("click", () => {
    setLetterOpen(false);
  });

  /* ==========================================================================
     9. Efek Confetti & Perayaan
     ========================================================================== */
  function resizeCanvas() {
    if (!canvas || !context) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * pixelRatio;
    canvas.height = window.innerHeight * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function drawConfetti() {
    if (!context) return;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles = particles.filter((particle) => particle.y < window.innerHeight + 20);

    for (const particle of particles) {
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.rotation += particle.spin;
      particle.speedY += 0.045;
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;
      context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.65);
      context.restore();
    }

    if (particles.length) {
      animationFrame = requestAnimationFrame(drawConfetti);
    } else {
      animationFrame = null;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  function celebrate(amount = 120) {
    if (reducedMotion.matches) return;

    const colors = ["#ff6b60", "#ffd264", "#b99cff", "#71cdb0", "#ff9fbd", "#ffffff"];
    for (let index = 0; index < amount; index += 1) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: -Math.random() * window.innerHeight * 0.55,
        size: Math.random() * 8 + 4,
        speedX: (Math.random() - 0.5) * 3,
        speedY: Math.random() * 2 + 1.5,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.12,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    if (!animationFrame) animationFrame = requestAnimationFrame(drawConfetti);
  }

  window.celebrate = celebrate;

  celebrateButton?.addEventListener("click", () => {
    playSfx("party");
    celebrate();
  });

  /* ==========================================================================
     10. Interaksi Lilin Per Batang & Lilin Kue
     ========================================================================== */
  function checkAllCandles() {
    const allOut = Array.from(individualCandles).every((c) => c.classList.contains("is-out"));
    cakeScene?.classList.toggle("blown", allOut);

    if (allOut) {
      if (candleButton) candleButton.innerHTML = 'Nyalakan lagi <span aria-hidden="true">✨</span>';
      if (cakeMessage) cakeMessage.textContent = "Semua lilin padam! Permintaanmu terbang ke langit bintang! 🎉";
      playSfx("party");
      celebrate(85);
    } else {
      if (candleButton) candleButton.innerHTML = 'Tiup lilin <span aria-hidden="true">💨</span>';
      const outCount = Array.from(individualCandles).filter((c) => c.classList.contains("is-out")).length;
      if (cakeMessage) {
        cakeMessage.textContent = outCount > 0
          ? `${outCount} lilin padam! Lanjut tiup lilin sisanya! 💨`
          : "Tutup mata, buat permintaan, lalu tiup lilinnya!";
      }
    }
  }

  individualCandles.forEach((candle) => {
    candle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOut = candle.classList.toggle("is-out");
      if (isOut) playSfx("blow");
      else playSfx("sparkle");
      checkAllCandles();
    });
  });

  candleButton?.addEventListener("click", () => {
    if (!cakeScene || !candleButton || !cakeMessage) return;
    const isCurrentlyBlown = cakeScene.classList.contains("blown");

    if (isCurrentlyBlown) {
      individualCandles.forEach((c) => c.classList.remove("is-out"));
      cakeScene.classList.remove("blown");
      candleButton.innerHTML = 'Tiup lilin <span aria-hidden="true">💨</span>';
      cakeMessage.textContent = "Tutup mata, buat permintaan, lalu tiup lilinnya!";
      playSfx("sparkle");
    } else {
      individualCandles.forEach((c) => c.classList.add("is-out"));
      cakeScene.classList.add("blown");
      candleButton.innerHTML = 'Nyalakan lagi <span aria-hidden="true">✨</span>';
      cakeMessage.textContent = "Yay! Semoga semua permintaanmu terkabul! 🎉";
      playSfx("party");
      celebrate(80);
    }
  });

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  /* ==========================================================================
     11. Generator Kartu Doa & Harapan Hari Ini
     ========================================================================== */
  const WISHES = [
    "Semoga langkahmu selalu ringan, dan semesta selalu berpihak pada senyummu! ✨",
    "Tahun ini giliran semua kerja kerasmu berbuah hal-hal paling manis! 🌸",
    "Semoga dikelilingi orang-orang yang tulus dan bikin harimu selalu penuh tawa! 💛",
    "Jangan pernah ragu sama kemampuanmu, kamu jauh lebih hebat dari yang kamu kira! 🚀",
    "Semoga selalu sehat, hati tenang, dan rezeki mengalir dari pintu tak terduga! 🌈",
    "Bahagia secukupnya, bersyukur sebanyak-banyaknya, dan bersinar sepuasnya! 🌟",
    "Semoga semua impian yang kamu tulis diam-diam, satu per satu jadi nyata! 🎂",
    "Kamu pantas dicintai, dihargai, dan dirayakan setiap detik! 💖",
    "Semoga harimu selalu punya secangkir kopi hangat dan obrolan menenangkan! ☕",
    "Terima kasih sudah jadi versi terbaik dirimu hari ini dan seterusnya! 🌷",
  ];
  let wishIndex = 0;

  fortuneBtn?.addEventListener("click", () => {
    playSfx("sparkle");
    wishIndex = (wishIndex + 1) % WISHES.length;
    if (fortuneQuote) {
      fortuneQuote.style.opacity = "0";
      fortuneQuote.style.transform = "scale(0.95)";
      setTimeout(() => {
        fortuneQuote.textContent = `"${WISHES[wishIndex]}"`;
        fortuneQuote.style.transition = "opacity .3s ease, transform .3s ease";
        fortuneQuote.style.opacity = "1";
        fortuneQuote.style.transform = "none";
      }, 150);
    }
  });

  /* ==========================================================================
     12. Scroll Reveal & Kemiringan 3D
     ========================================================================== */
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    document.documentElement.classList.add("has-reveal");
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14 }
    );
    revealElements.forEach((element) => revealObserver.observe(element));
  }

  if (photoDropZone && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    photoDropZone.addEventListener("pointermove", (event) => {
      if (reducedMotion.matches) return;
      const bounds = photoDropZone.getBoundingClientRect();
      const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
      const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;
      photoDropZone.style.setProperty("--photo-tilt-x", `${horizontal * 7}deg`);
      photoDropZone.style.setProperty("--photo-tilt-y", `${vertical * -7}deg`);
    });

    photoDropZone.addEventListener("pointerleave", () => {
      photoDropZone.style.removeProperty("--photo-tilt-x");
      photoDropZone.style.removeProperty("--photo-tilt-y");
    });
  }
})();

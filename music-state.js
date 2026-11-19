/**
 * Modul Sinkronisasi Status Aplikasi & Audio Bersama
 * Mengatur pemutaran musik antar-halaman (sessionStorage & localStorage),
 * preferensi tema, nama penerima, counter semangat, dan efek suara sintetis (Web Audio API).
 */
(() => {
  "use strict";

  /* ==========================================================================
     1. Sinkronisasi Pemutar Musik (sessionStorage & localStorage)
     ========================================================================== */
  const MUSIC_STORAGE_KEY = "birthday-music-state";
  const DEFAULT_TRACKS = new Set(["lagu.1.mp3", "lagu.2.mp3", "lagu.3.mp3"]);

  function isTrack(source) {
    if (!source || typeof source !== "string") return false;
    const clean = source.split("/").pop();
    return DEFAULT_TRACKS.has(clean) || DEFAULT_TRACKS.has(source);
  }

  function removeMusicState() {
    try {
      sessionStorage.removeItem(MUSIC_STORAGE_KEY);
      localStorage.removeItem(MUSIC_STORAGE_KEY);
    } catch {}
  }

  function readMusicState() {
    let raw;
    try {
      raw = sessionStorage.getItem(MUSIC_STORAGE_KEY) || localStorage.getItem(MUSIC_STORAGE_KEY);
    } catch {
      return null;
    }
    if (!raw) return null;

    let state;
    try {
      state = JSON.parse(raw);
    } catch {
      removeMusicState();
      return null;
    }

    if (
      !state ||
      !isTrack(state.source) ||
      !Number.isFinite(state.currentTime) ||
      state.currentTime < 0
    ) {
      removeMusicState();
      return null;
    }
    return state;
  }

  function saveMusicState(source, currentTime, playing) {
    const cleanSource = source ? source.split("/").pop() : "lagu.2.mp3";
    if (!isTrack(cleanSource) || !Number.isFinite(currentTime) || currentTime < 0) {
      return;
    }

    const payload = JSON.stringify({
      source: cleanSource,
      currentTime: Math.max(0, currentTime),
      playing: Boolean(playing),
      timestamp: Date.now(),
    });

    try {
      sessionStorage.setItem(MUSIC_STORAGE_KEY, payload);
      localStorage.setItem(MUSIC_STORAGE_KEY, payload);
    } catch {}
  }

  /**
   * Menyimpan posisi waktu audio secara berkala pada event timeupdate
   */
  let lastTrackSave = 0;
  function bindAudioPersistence(audio) {
    if (!audio) return;
    audio.addEventListener("timeupdate", () => {
      const now = Date.now();
      if (now - lastTrackSave > 400 && audio.currentTime > 0) {
        lastTrackSave = now;
        saveMusicState(
          audio.dataset.track || audio.src,
          audio.currentTime,
          !audio.paused && !audio.ended
        );
      }
    });

    audio.addEventListener("play", () => {
      saveMusicState(audio.dataset.track || audio.src, audio.currentTime, true);
    });

    audio.addEventListener("pause", () => {
      saveMusicState(audio.dataset.track || audio.src, audio.currentTime, false);
    });
  }

  window.BirthdayMusicState = Object.freeze({
    isTrack,
    read: readMusicState,
    save: saveMusicState,
    remove: removeMusicState,
    bindAudioPersistence,
  });

  /* ==========================================================================
     2. Sinkronisasi Status Global & Interaktivitas (localStorage)
     ========================================================================== */
  const THEME_KEY = "birthday-theme";
  const NAME_KEY = "birthday-recipient-name";
  const CHEER_KEY = "birthday-cheer-count";
  const SFX_MUTED_KEY = "birthday-sfx-muted";

  function getTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || "light";
    } catch {
      return "light";
    }
  }

  function setTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    document.documentElement.dataset.theme = theme;
  }

  function getName() {
    try {
      return localStorage.getItem(NAME_KEY) || "Syaa";
    } catch {
      return "Syaa";
    }
  }

  function setName(name) {
    const cleanName = (name || "").trim() || "Syaa";
    try {
      localStorage.setItem(NAME_KEY, cleanName);
    } catch {}
    return cleanName;
  }

  function getCheers() {
    try {
      const val = parseInt(localStorage.getItem(CHEER_KEY) || "0", 10);
      return Number.isFinite(val) ? val : 0;
    } catch {
      return 0;
    }
  }

  function addCheer() {
    const updated = getCheers() + 1;
    try {
      localStorage.setItem(CHEER_KEY, String(updated));
    } catch {}
    return updated;
  }

  function isMuted() {
    try {
      return localStorage.getItem(SFX_MUTED_KEY) === "true";
    } catch {
      return false;
    }
  }

  function setMuted(muted) {
    try {
      localStorage.setItem(SFX_MUTED_KEY, String(Boolean(muted)));
    } catch {}
  }

  function toggleMuted() {
    const next = !isMuted();
    setMuted(next);
    return next;
  }

  /* ==========================================================================
     3. Generator Efek Suara Web Audio API (Tanpa Berkas Tambahan)
     ========================================================================== */
  let audioContext = null;

  function getAudioContext() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioContext = new AudioCtx();
    }
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  }

  function playSfx(type = "pop") {
    if (isMuted()) return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === "pop") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "tap") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === "sparkle") {
        const notes = [1046.5, 1318.5, 1568.0, 1975.5, 2093.0];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.035);
          gain.gain.setValueAtTime(0.1, now + idx * 0.035);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.035);
          osc.stop(now + idx * 0.035 + 0.15);
        });
      } else if (type === "blow") {
        const bufferSize = Math.floor(ctx.sampleRate * 0.3);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i += 1) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(180, now + 0.3);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.005, now + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (type === "party") {
        const fanfare = [523.25, 659.25, 783.99, 1046.5];
        fanfare.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(f, now + i * 0.06);
          gain.gain.setValueAtTime(0.09, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.38);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.4);
        });
      } else if (type === "cheer") {
        const chords = [523.25, 659.25, 783.99, 987.77];
        chords.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, now + i * 0.04);
          gain.gain.setValueAtTime(0.14, now + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.04);
          osc.stop(now + i * 0.04 + 0.38);
        });
      } else if (type === "chime") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.52);
      }
    } catch {}
  }

  window.BirthdayAppState = Object.freeze({
    getTheme,
    setTheme,
    getName,
    setName,
    getCheers,
    addCheer,
    isMuted,
    setMuted,
    toggleMuted,
    playSfx,
  });

  const savedTheme = getTheme();
  if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
  }
})();

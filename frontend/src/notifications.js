let audioCtx = null;

function getAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

export function playChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const start = now + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch {
    // Web Audio blocked/unsupported — skip the chime rather than throw.
  }
}

const baseTitle = document.title;
let flashTimer = null;

export function startTitleFlash(count) {
  stopTitleFlash();
  const alertTitle = `(${count}) New Ticket${count === 1 ? "" : "s"}`;
  let showingAlert = false;
  flashTimer = setInterval(() => {
    document.title = showingAlert ? baseTitle : alertTitle;
    showingAlert = !showingAlert;
  }, 1000);
}

export function stopTitleFlash() {
  if (flashTimer) {
    clearInterval(flashTimer);
    flashTimer = null;
  }
  document.title = baseTitle;
}

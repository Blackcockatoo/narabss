const buttons = document.querySelectorAll('[data-audio]');
let audioContext;
let fallbackTimer = null;
let fallbackNodes = [];
let activeButton = null;
let activeStatus = null;
let activeFallbackId = null;

function resetButton(button) {
  if (!button) return;
  button.textContent = button.dataset.audio.endsWith('1') ? '▶ Play Song 1' : '▶ Play Song 2';
}

function stopFallback() {
  if (fallbackTimer) clearInterval(fallbackTimer);
  fallbackTimer = null;
  fallbackNodes.forEach((node) => {
    try { node.stop(); } catch (_) {}
    try { node.disconnect(); } catch (_) {}
  });
  fallbackNodes = [];
  resetButton(activeButton);
  if (activeStatus) activeStatus.textContent = 'Paused.';
  activeFallbackId = null;
  activeButton = null;
  activeStatus = null;
}

function stopAllExcept(audioToKeep) {
  document.querySelectorAll('audio').forEach((other) => {
    if (other !== audioToKeep) other.pause();
  });
  stopFallback();
}

function getAudioContext() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function scheduleTone(ctx, when, freq, duration, type = 'sine', volume = 0.18) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + duration + 0.03);
  fallbackNodes.push(osc, gain);
}

function scheduleKick(ctx, when) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(90, when);
  osc.frequency.exponentialRampToValueAtTime(38, when + 0.22);
  gain.gain.setValueAtTime(0.55, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.24);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.28);
  fallbackNodes.push(osc, gain);
}

function scheduleClap(ctx, when) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const noise = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  noise.buffer = buffer;
  filter.type = 'highpass';
  filter.frequency.value = 900;
  gain.gain.setValueAtTime(0.22, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.09);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(when);
  fallbackNodes.push(noise, filter, gain);
}

function playFallback(id, button, status) {
  if (activeFallbackId === id) {
    stopFallback();
    return;
  }
  stopAllExcept(null);
  const ctx = getAudioContext();
  const variantTwo = id.endsWith('2');
  const bpm = variantTwo ? 126 : 104;
  const stepMs = 60000 / bpm / 2;
  const melodyOne = [392, 0, 440, 0, 523.25, 493.88, 440, 0, 349.23, 0, 392, 0, 440, 392, 329.63, 0];
  const melodyTwo = [261.63, 329.63, 392, 0, 440, 392, 329.63, 0, 523.25, 0, 493.88, 440, 392, 329.63, 293.66, 0];
  const bassOne = [98, 0, 0, 0, 130.81, 0, 0, 0, 87.31, 0, 0, 0, 110, 0, 0, 0];
  const bassTwo = [110, 0, 0, 0, 146.83, 0, 0, 0, 98, 0, 0, 0, 130.81, 0, 0, 0];
  const melody = variantTwo ? melodyTwo : melodyOne;
  const bass = variantTwo ? bassTwo : bassOne;
  let step = 0;

  activeFallbackId = id;
  activeButton = button;
  activeStatus = status;
  button.textContent = '⏸ Pause';
  if (status) status.textContent = 'Playing built-in Lost in the Fire web demo. Add the MP3 later for the real recording.';

  const tick = () => {
    const when = ctx.currentTime + 0.02;
    if (step % 4 === 0) scheduleKick(ctx, when);
    if (step % 8 === 4) scheduleClap(ctx, when + 0.01);
    if (bass[step]) scheduleTone(ctx, when, bass[step], 0.28, 'triangle', 0.12);
    if (melody[step]) scheduleTone(ctx, when + 0.015, melody[step], variantTwo ? 0.24 : 0.32, variantTwo ? 'square' : 'sine', variantTwo ? 0.10 : 0.13);
    if (step % 2 === 1) scheduleTone(ctx, when, variantTwo ? 1568 : 1174.66, 0.05, 'sine', 0.035);
    step = (step + 1) % 16;
  };
  tick();
  fallbackTimer = setInterval(tick, stepMs);
}

async function mp3Exists(audio) {
  const src = audio.getAttribute('src');
  if (!src) return false;
  try {
    const response = await fetch(src, { method: 'HEAD', cache: 'no-store' });
    return response.ok;
  } catch (_) {
    return false;
  }
}

buttons.forEach((button) => {
  const audio = document.getElementById(button.dataset.audio);
  const status = document.querySelector(`[data-status="${button.dataset.audio}"]`);

  if (audio) {
    audio.addEventListener('play', () => {
      stopAllExcept(audio);
      button.textContent = '⏸ Pause';
      if (status) status.textContent = 'Playing Nara’s song.';
    });

    audio.addEventListener('pause', () => resetButton(button));

    audio.addEventListener('error', () => {
      if (status) status.textContent = 'MP3 is not in GitHub yet — using the built-in web demo button instead.';
    });
  }

  button.addEventListener('click', async () => {
    if (!audio) return playFallback(button.dataset.audio, button, status);
    const exists = await mp3Exists(audio);
    if (!exists) return playFallback(button.dataset.audio, button, status);
    try {
      if (audio.paused) await audio.play();
      else audio.pause();
    } catch (_) {
      playFallback(button.dataset.audio, button, status);
    }
  });
});

const baseSounds = [
  { id: 'kick', icon: '🦖', name: 'Dino Kick', color: '#f2b83f' },
  { id: 'snap', icon: '🐍', name: 'Snake Snap', color: '#9be27b' },
  { id: 'meow', icon: '🐱', name: 'Cat Meow', color: '#ffb7d8' },
  { id: 'whistle', icon: '🪶', name: 'Feather Whistle', color: '#bfe2ff' },
  { id: 'cool', icon: '😎', name: 'Cool Pad', color: '#d8ccff' },
];

let sounds = [...baseSounds];
let pattern = [
  [1, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 1, 0],
  [0, 0, 0, 1, 0, 0, 0, 1],
  [0, 1, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0],
];
let customSound = null;
let ctx, delay, feedback, wet, convolver, master, playing = false, step = 0, timer;

const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));

function audio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.75;
  master.connect(ctx.destination);

  delay = ctx.createDelay(1.2);
  feedback = ctx.createGain();
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(master);

  convolver = ctx.createConvolver();
  convolver.buffer = impulse(0.65);
  wet = ctx.createGain();
  convolver.connect(wet);
  wet.connect(master);
}

function impulse(sec) {
  const b = ctx.createBuffer(2, ctx.sampleRate * sec, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  }
  return b;
}

function updateEffectSend(opts) {
  if (!ctx) return;
  const echo = Math.max(0, Math.min(0.95, opts.echo ?? Number($('#echo').value) / 100));
  const space = Math.max(0, Math.min(0.95, opts.space ?? Number($('#space').value) / 100));
  feedback.gain.value = echo;
  delay.delayTime.value = 0.08 + echo * 0.45;
  wet.gain.value = space;
}

function envelope(t, attack = 0.01, decay = 0.25, volume = 0.6, reverse = false) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  if (reverse) {
    g.gain.linearRampToValueAtTime(volume * 0.2, t + attack);
    g.gain.linearRampToValueAtTime(volume, t + attack + decay * 0.75);
    g.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);
  } else {
    g.gain.linearRampToValueAtTime(volume, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);
  }
  return g;
}

function distortionCurve(amount = 0) {
  const k = amount * 80;
  const n = 44100;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

function output(node, opts = {}) {
  let finalNode = node;
  const fuzz = Math.max(0, Math.min(1, opts.fuzz ?? Number($('#fuzz').value) / 100));
  if (fuzz > 0.01) {
    const shaper = ctx.createWaveShaper();
    shaper.curve = distortionCurve(fuzz);
    shaper.oversample = '4x';
    finalNode.connect(shaper);
    finalNode = shaper;
  }
  finalNode.connect(master);
  finalNode.connect(delay);
  finalNode.connect(convolver);
}

function globalParams() {
  return {
    pitch: Number($('#pitch').value),
    speed: 100,
    echo: Number($('#echo').value) / 100,
    fuzz: Number($('#fuzz').value) / 100,
    space: Number($('#space').value) / 100,
    reverse: false,
  };
}

function customParamsFromUI() {
  return {
    base: $('#customBase').value,
    pitch: Number($('#customPitch').value),
    speed: Number($('#customSpeed').value),
    echo: Number($('#customEcho').value) / 100,
    fuzz: Number($('#customFuzz').value) / 100,
    space: Number($('#customSpace').value) / 100,
    reverse: $('#customReverse').checked,
  };
}

function ratioFor(opts = {}) {
  return Math.pow(2, Number(opts.pitch || 0) / 12);
}

function speedScale(opts = {}) {
  return Math.max(0.45, Math.min(2.2, Number(opts.speed || 100) / 100));
}

function playSound(id, when = 0, opts = null) {
  audio();
  if (ctx.state === 'suspended') ctx.resume();

  if (id === 'custom' && customSound) {
    opts = customSound.params;
    id = customSound.base;
  }
  opts = opts || globalParams();
  updateEffectSend(opts);

  const t = when || ctx.currentTime;
  const r = ratioFor(opts);
  const sp = speedScale(opts);
  const rev = Boolean(opts.reverse);

  if (id === 'kick') {
    const o = ctx.createOscillator();
    const g = envelope(t, 0.005 / sp, 0.36 / sp, 0.95, rev);
    o.type = 'sine';
    o.frequency.setValueAtTime((rev ? 38 : 95) * r, t);
    o.frequency.exponentialRampToValueAtTime((rev ? 112 : 38) * r, t + 0.3 / sp);
    o.connect(g);
    output(g, opts);
    o.start(t);
    o.stop(t + 0.45 / sp);
  }

  if (id === 'snap') {
    const len = Math.max(0.035, 0.08 / sp);
    const b = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const fade = rev ? i / d.length : 1 - i / d.length;
      d[i] = (Math.random() * 2 - 1) * fade;
    }
    const s = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = envelope(t, 0.002 / sp, 0.11 / sp, 0.48, rev);
    s.buffer = b;
    f.type = 'highpass';
    f.frequency.value = 1200 * r;
    s.connect(f);
    f.connect(g);
    output(g, opts);
    s.start(t);
  }

  if (id === 'meow') {
    const o = ctx.createOscillator();
    const g = envelope(t, 0.02 / sp, 0.38 / sp, 0.36, rev);
    o.type = 'triangle';
    o.frequency.setValueAtTime((rev ? 240 : 520) * r, t);
    o.frequency.exponentialRampToValueAtTime((rev ? 620 : 240) * r, t + 0.32 / sp);
    o.connect(g);
    output(g, opts);
    o.start(t);
    o.stop(t + 0.48 / sp);
  }

  if (id === 'whistle') {
    const o = ctx.createOscillator();
    const g = envelope(t, 0.02 / sp, 0.4 / sp, 0.3, rev);
    o.type = 'sine';
    if (rev) {
      o.frequency.setValueAtTime(1100 * r, t);
      o.frequency.linearRampToValueAtTime(1380 * r, t + 0.18 / sp);
      o.frequency.linearRampToValueAtTime(950 * r, t + 0.36 / sp);
    } else {
      o.frequency.setValueAtTime(950 * r, t);
      o.frequency.linearRampToValueAtTime(1380 * r, t + 0.2 / sp);
      o.frequency.linearRampToValueAtTime(1100 * r, t + 0.34 / sp);
    }
    o.connect(g);
    output(g, opts);
    o.start(t);
    o.stop(t + 0.48 / sp);
  }

  if (id === 'cool') {
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = envelope(t, 0.03 / sp, 0.52 / sp, 0.3, rev);
    o.type = rev ? 'square' : 'sawtooth';
    o.frequency.value = (rev ? 260 : 190) * r;
    f.type = 'bandpass';
    f.frequency.value = (rev ? 520 : 760) * r;
    f.Q.value = 7;
    o.connect(f);
    f.connect(g);
    output(g, opts);
    o.start(t);
    o.stop(t + 0.58 / sp);
    if (!when && !rev && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance('cool');
      u.rate = Math.max(0.5, Math.min(1.8, 1.1 * sp));
      u.pitch = Math.max(0.4, Math.min(2, 1.2 * r));
      u.volume = 0.22;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
  }

  const m = $('#roarMeter');
  m.style.width = `${Math.min(100, (parseFloat(m.style.width) || 0) + 18)}%`;
  setTimeout(() => (m.style.width = '0%'), 180);
}

function render() {
  $('#pads').innerHTML = sounds
    .map(
      (s) =>
        `<button class="pad" style="background:${s.color}" data-pad="${s.id}"><b>${s.icon}</b><span>${s.name}</span><small>${s.id === 'custom' ? 'custom row' : 'tap to test'}</small></button>`
    )
    .join('');

  $('#stepHead').innerHTML = '<span>Sound</span>' + [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<span>${n}</span>`).join('');
  $('#sequencer').innerHTML = sounds
    .map(
      (s, r) =>
        `<div class="track"><div class="track-name">${s.icon} ${s.name}</div>${[0, 1, 2, 3, 4, 5, 6, 7]
          .map((i) => `<button class="cell ${pattern[r]?.[i] ? 'on' : ''}" data-r="${r}" data-s="${i}"></button>`)
          .join('')}</div>`
    )
    .join('');
}

function refresh() {
  $$('.cell').forEach((c) => c.classList.toggle('on', Boolean(pattern[c.dataset.r][c.dataset.s])));
}

function beat() {
  const ms = 60000 / Number($('#bpm').value) / 2;
  $$('.cell').forEach((c) => c.classList.remove('playing'));
  pattern.forEach((row, r) => {
    if (row[step]) playSound(sounds[r].id);
    const c = document.querySelector(`[data-r="${r}"][data-s="${step}"]`);
    if (c) c.classList.add('playing');
  });
  step = (step + 1) % 8;
  timer = setTimeout(beat, ms + (step % 2 ? Number($('#swing').value) : 0));
}

function play() {
  if (playing) return;
  playing = true;
  $('#playBtn').textContent = '⏸ Playing';
  beat();
}

function stop() {
  playing = false;
  clearTimeout(timer);
  $('#playBtn').textContent = '▶ Play';
  $$('.cell').forEach((c) => c.classList.remove('playing'));
}

function clear() {
  pattern = pattern.map((r) => r.map(() => 0));
  refresh();
}

function magic() {
  pattern = pattern.map((r, ri) => r.map(() => Math.random() < [0.45, 0.28, 0.22, 0.25, 0.15, 0.26][ri] ? 1 : 0));
  refresh();
}

function recipe(x) {
  clear();
  if (x === 'dino') {
    pattern[0] = [1, 0, 0, 0, 1, 0, 0, 0];
    pattern[1] = [0, 0, 1, 0, 0, 0, 1, 0];
    pattern[4] = [0, 0, 0, 0, 1, 0, 0, 0];
  }
  if (x === 'snake') {
    pattern[1] = [1, 0, 1, 0, 1, 0, 1, 0];
    pattern[3] = [0, 1, 0, 1, 0, 1, 0, 1];
  }
  if (x === 'cat') {
    pattern[0] = [1, 0, 0, 1, 1, 0, 0, 1];
    pattern[2] = [0, 1, 0, 0, 0, 1, 0, 0];
  }
  if (x === 'space') {
    pattern[3] = [1, 0, 0, 1, 0, 1, 0, 0];
    pattern[4] = [0, 0, 1, 0, 0, 0, 1, 0];
  }
  refresh();
}

function updateCustomOutputs() {
  ['customPitch', 'customSpeed', 'customEcho', 'customFuzz', 'customSpace'].forEach((id) => {
    const out = $(`#${id}Out`);
    if (out) out.textContent = $(`#${id}`).value;
  });
}

function customLabel(params) {
  const base = baseSounds.find((s) => s.id === params.base);
  const flip = params.reverse ? ' Rev' : '';
  return `${base.icon} Custom ${base.name}${flip}`;
}

function previewCustom() {
  const params = customParamsFromUI();
  playSound(params.base, 0, params);
  $('#customStatus').textContent = `Previewing ${customLabel(params)}.`;
}

function addCustomRow() {
  const params = customParamsFromUI();
  const base = baseSounds.find((s) => s.id === params.base);
  customSound = { id: 'custom', base: params.base, params };
  const rowName = customLabel(params);
  const existing = sounds.findIndex((s) => s.id === 'custom');
  const row = { id: 'custom', icon: '🧪', name: rowName.replace(/^.+? Custom /, 'Custom '), color: '#bb66ff' };
  if (existing === -1) {
    sounds.push(row);
    pattern.push([0, 0, 0, 0, 0, 0, 0, 0]);
  } else {
    sounds[existing] = row;
  }
  render();
  $('#customStatus').textContent = `Added custom row from ${base.name}. Paint the new 🧪 row below.`;
}

render();
updateCustomOutputs();

document.addEventListener('click', (e) => {
  const p = e.target.closest('[data-pad]');
  if (p) playSound(p.dataset.pad);

  const c = e.target.closest('.cell');
  if (c) {
    pattern[c.dataset.r][c.dataset.s] ^= 1;
    c.classList.toggle('on');
  }

  const r = e.target.closest('[data-recipe]');
  if (r) recipe(r.dataset.recipe);
});

$('#playBtn').onclick = () => (playing ? stop() : play());
$('#stopBtn').onclick = stop;
$('#clearBtn').onclick = clear;
$('#randomBtn').onclick = magic;
$('#previewCustomBtn').onclick = previewCustom;
$('#addCustomBtn').onclick = addCustomRow;

['bpm', 'pitch', 'echo', 'fuzz', 'space', 'swing'].forEach((k) => {
  $(`#${k}`).oninput = () => {
    $(`#${k}Out`).textContent = $(`#${k}`).value;
    if (ctx) updateEffectSend(globalParams());
  };
});

['customPitch', 'customSpeed', 'customEcho', 'customFuzz', 'customSpace'].forEach((id) => {
  $(`#${id}`).oninput = updateCustomOutputs;
});
$('#customBase').onchange = () => {
  const base = baseSounds.find((s) => s.id === $('#customBase').value);
  $('#customStatus').textContent = `Ready to bend ${base.name}.`;
};
$('#customReverse').onchange = () => {
  $('#customStatus').textContent = $('#customReverse').checked ? 'Reverse swoop on.' : 'Reverse swoop off.';
};

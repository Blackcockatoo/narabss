const SEEDS = {
  red: '113031491493585389543778774590997079619617525721567332336510',
  black: '011235831459437077415617853819099875279651673033695493257291',
  blue: '012776329785893036118967145479098334781325217074992143965631',
};

const THEMES = {
  red: {
    symbol: '☉',
    mark: '🔥',
    name: 'Ruby Peacock Fire',
    short: 'Fire Pearl',
    mantra: '0 is the pearl gate. 1–9 flare into red-gold peacock metal.',
    aura: 'rgba(255, 57, 110, .22)',
    halo: '#ff3f7f',
    line: 'rgba(255, 214, 107, .24)',
    palette: ['#fff7ee', '#ff3b6b', '#ff6a00', '#ffd36b', '#f50057', '#ff9a3d', '#fef08a', '#fb7185', '#f97316', '#fecdd3'],
  },
  black: {
    symbol: '◈',
    mark: '🪞',
    name: 'Obsidian Peacock Mirror',
    short: 'Black Mirror',
    mantra: '0 is the pearl mirror. 1–9 shimmer as oil-black feather metal.',
    aura: 'rgba(24, 240, 255, .18)',
    halo: '#18f0ff',
    line: 'rgba(216, 255, 253, .2)',
    palette: ['#f5fbff', '#05070f', '#121827', '#20263a', '#661ae6', '#18f0ff', '#c084fc', '#d8fffd', '#3b0764', '#a3e635'],
  },
  blue: {
    symbol: '✺',
    mark: '💧',
    name: 'Sapphire Peacock Water',
    short: 'Blue Feather',
    mantra: '0 is the pearl drop. 1–9 ripple into blue-green peacock metal.',
    aura: 'rgba(51, 170, 255, .22)',
    halo: '#33aaff',
    line: 'rgba(126, 245, 255, .24)',
    palette: ['#f0fdff', '#0ea5e9', '#2563eb', '#38bdf8', '#22d3ee', '#14b8a6', '#8b5cf6', '#7ef5ff', '#1d4ed8', '#67e8f9'],
  },
};

const DIGIT_SYMBOLS = ['◎', 'Ⅰ', 'Ⅱ', 'Ⅲ', '✦', '✧', '✺', '✹', '✷', '✶'];
const LUKUS = [2, 1, 3, 4, 7, 1, 8, 9, 7, 6, 3, 9];
const NOTES = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33, 659.25];
const NOTE_NAMES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];

let mode = 'spiral';
let seed = 'red';
let harmony = 7;
let awareness = 50;
let tempo = 120;
let mouse = { x: 0, y: 0, down: false };
let painted = [];
let particles = [];
let audioCtx, delay, feedback, master;
let lastHover = 0;
let playing = false;

const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];
const canvas = $('#dnaCanvas');
const ctx = canvas.getContext('2d');

function theme() {
  return THEMES[seed] || THEMES.red;
}

function sequence() {
  return SEEDS[seed].split('').map(Number);
}

function digitColor(digit) {
  const t = theme();
  return t.palette[digit % t.palette.length];
}

function digitSymbol(digit) {
  return digit === 0 ? `${theme().symbol}${DIGIT_SYMBOLS[0]}` : `${theme().symbol}${DIGIT_SYMBOLS[digit]}`;
}

function metallicGradient(x, y, r, digit) {
  const t = theme();
  const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, Math.max(1, r * 0.08), x, y, r * 1.7);
  const c = digitColor(digit);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.16, digit === 0 ? '#f8ffff' : '#d8fffd');
  g.addColorStop(0.38, c);
  g.addColorStop(0.64, t.halo);
  g.addColorStop(1, digit === 0 ? '#fff1c7' : '#070611');
  return g;
}

function glowDigit(x, y, digit, radius, alpha = 1, label = false) {
  const t = theme();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = digit === 0 ? 30 : 18 + digit * 1.6;
  ctx.shadowColor = digit === 0 ? '#f9ffff' : digitColor(digit);
  ctx.fillStyle = metallicGradient(x, y, radius, digit);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(1, radius * 0.14);
  ctx.strokeStyle = digit === 0 ? 'rgba(255,255,255,.92)' : t.line;
  ctx.stroke();
  if (label && radius > 6) {
    ctx.shadowBlur = 8;
    ctx.fillStyle = digit === 0 ? '#06111c' : '#ffffff';
    ctx.font = `900 ${Math.max(9, radius * 1.05)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(digit), x, y + 0.5);
  }
  ctx.restore();
}

function pearlLine(a, b, digit, alpha = .18) {
  ctx.save();
  ctx.strokeStyle = digit === 0 ? 'rgba(255,255,255,.36)' : theme().line;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = digit === 0 ? 1.9 : 1;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  master = audioCtx.createGain();
  master.gain.value = 0.16;
  master.connect(audioCtx.destination);
  delay = audioCtx.createDelay(1);
  feedback = audioCtx.createGain();
  delay.delayTime.value = 0.26;
  feedback.gain.value = 0.24;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(master);
}

function playDigit(digit, time = 0, dur = 0.22) {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const t = time || audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const colorShift = seed === 'red' ? 1.08 : seed === 'blue' ? 0.93 : 0.78;
  osc.type = digit === 0 ? 'sine' : digit > 6 ? 'triangle' : seed === 'black' ? 'square' : 'sine';
  osc.frequency.value = NOTES[digit] * colorShift;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(digit === 0 ? 0.72 : 0.9, t + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(master);
  gain.connect(delay);
  osc.start(t);
  osc.stop(t + dur + 0.04);
}

function playSequence() {
  initAudio();
  if (playing) return;
  playing = true;
  $('#playDnaBtn').textContent = '🎵 Playing';
  const seq = sequence().slice(0, 60);
  const step = 60 / tempo;
  const now = audioCtx.currentTime + 0.06;
  seq.forEach((d, i) => playDigit(d, now + i * step, step * 0.72));
  setTimeout(() => {
    playing = false;
    $('#playDnaBtn').textContent = '▶ Play DNA';
  }, seq.length * step * 1000 + 160);
}

function setCanvasSize() {
  const wrap = canvas.parentElement;
  const w = Math.min(1000, Math.max(320, wrap.clientWidth));
  const h = Math.round(w * 0.62);
  canvas.width = w;
  canvas.height = h;
}

function clear(bg = '#05040d') {
  const t = theme();
  const g = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.28, 20, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.78);
  g.addColorStop(0, t.aura);
  g.addColorStop(0.42, bg);
  g.addColorStop(1, '#03020a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSpiral(now) {
  clear();
  const seq = sequence();
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const scale = Math.min(canvas.width, canvas.height) / 440;
  const pulse = 1 + Math.sin(now * 0.001) * 0.06;
  let nearest = null;

  for (let helix = 0; helix < harmony; helix++) {
    const off = (helix / harmony) * Math.PI * 2 + now * 0.00022;
    let prev = null;
    for (let i = 0; i < seq.length; i++) {
      const d = seq[i];
      const t = i / 6;
      const radius = (70 + d * 8 + (d === 0 ? 18 : 0)) * scale * pulse;
      const angle = off + t * 0.45;
      const z = i / seq.length;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * 0.55 + (z - 0.5) * canvas.height * 0.72;
      if (prev) pearlLine(prev, { x, y }, d, d === 0 ? .34 : .14);
      const size = (d === 0 ? 8 : 3.2 + d * 0.62) * scale;
      glowDigit(x, y, d, size, 0.9, d === 0 || i % 9 === 0);
      const dist = Math.hypot(mouse.x - x, mouse.y - y);
      if (dist < 19 && (!nearest || dist < nearest.dist)) nearest = { digit: d, x, y, dist };
      prev = { x, y };
    }
  }

  if (nearest) {
    glowDigit(nearest.x, nearest.y, nearest.digit, 18 * scale, .55, true);
    if (Date.now() - lastHover > 150) {
      playDigit(nearest.digit);
      lastHover = Date.now();
    }
  }
}

function drawMandala() {
  clear('#070511');
  const seq = sequence();
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const maxR = Math.min(canvas.width, canvas.height) * 0.42;
  const segments = harmony * 12;
  for (let ring = 1; ring <= 7; ring++) {
    const r = (ring / 7) * maxR;
    for (let i = 0; i < segments; i++) {
      const d = seq[(ring * segments + i) % seq.length];
      const a = (i / segments) * Math.PI * 2 - Math.PI / 2;
      glowDigit(cx + Math.cos(a) * r, cy + Math.sin(a) * r, d, d === 0 ? 5.8 : 2.5 + d * 0.38, 0.88, d === 0 && ring % 2 === 0);
    }
  }
  ctx.strokeStyle = theme().halo;
  ctx.lineWidth = 1.6;
  ctx.shadowBlur = 20;
  ctx.shadowColor = theme().halo;
  for (let i = 0; i < harmony; i++) {
    const a = (i / harmony) * Math.PI * 2 - Math.PI / 2;
    const b = ((i + Math.floor(harmony / 2)) / harmony) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * maxR * 0.32, cy + Math.sin(a) * maxR * 0.32);
    ctx.lineTo(cx + Math.cos(b) * maxR * 0.32, cy + Math.sin(b) * maxR * 0.32);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  painted.forEach((p) => glowDigit(p.x, p.y, p.digit || 0, 6.5, 0.75, false));
}

function resetParticles() {
  const seq = sequence();
  particles = seq.map((d, i) => {
    const a = (i / seq.length) * Math.PI * 2;
    const r = Math.min(canvas.width, canvas.height) * (0.16 + (d / 10) * 0.22);
    return {
      x: canvas.width / 2 + Math.cos(a) * r + (Math.random() - 0.5) * 30,
      y: canvas.height / 2 + Math.sin(a) * r + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 1.6,
      vy: (Math.random() - 0.5) * 1.6,
      digit: d,
      size: d === 0 ? 5.8 : 2.5 + d * 0.6,
      thought: Math.random() * Math.PI * 2,
      memory: i,
    };
  });
}

function drawParticles(now = performance.now()) {
  const t = theme();
  ctx.save();
  ctx.fillStyle = 'rgba(5,4,13,.14)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'lighter';
  if (!particles.length) resetParticles();
  const center = { x: canvas.width / 2, y: canvas.height / 2 };

  particles.forEach((p, index) => {
    const mx = mouse.x || center.x;
    const my = mouse.y || center.y;
    const dx = mx - p.x;
    const dy = my - p.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const conscious = awareness / 100;
    const orbit = Math.sin(now * 0.0015 + p.thought + p.digit) * 0.018;
    const pull = dist < 260 ? ((260 - dist) / 9000) * conscious : 0;
    const repel = dist < 42 ? ((42 - dist) / 1200) * conscious : 0;

    p.vx += (dx / dist) * pull - (dx / dist) * repel;
    p.vy += (dy / dist) * pull - (dy / dist) * repel;
    p.vx += (-(p.y - center.y) / Math.max(1, Math.hypot(p.x - center.x, p.y - center.y))) * orbit;
    p.vy += ((p.x - center.x) / Math.max(1, Math.hypot(p.x - center.x, p.y - center.y))) * orbit;

    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.988;
    p.vy *= 0.988;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    p.x = Math.max(0, Math.min(canvas.width, p.x));
    p.y = Math.max(0, Math.min(canvas.height, p.y));

    if (index % 3 === 0 && dist < 180) {
      ctx.strokeStyle = p.digit === 0 ? 'rgba(255,255,255,.26)' : t.line;
      ctx.lineWidth = 0.8 + conscious;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.quadraticCurveTo((p.x + mx) / 2, (p.y + my) / 2 + Math.sin(now * .003 + index) * 18, mx, my);
      ctx.stroke();
    }
    glowDigit(p.x, p.y, p.digit, p.size + conscious * 2.4, 0.92, p.digit === 0 || (dist < 55 && index % 4 === 0));
  });

  ctx.strokeStyle = t.line;
  for (let i = 0; i < particles.length; i += 2) {
    for (let j = i + 1; j < particles.length; j += 5) {
      const a = particles[i], b = particles[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 100) {
        ctx.globalAlpha = (100 - dist) / 420;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.font = '800 12px system-ui';
  ctx.fillText(`Conscious field: ${theme().symbol} ${awareness}% awareness`, 16, canvas.height - 18);
  ctx.restore();
}

function renderBars() {
  const bars = $('#bars');
  bars.innerHTML = sequence().slice(0, 60).map((d, i) =>
    `<button class="bar" data-digit="${d}" title="${digitSymbol(d)} ${d} → ${NOTE_NAMES[d]}" style="height:${30 + d * 18}px;background:linear-gradient(180deg,#ffffff,${digitColor(d)},${theme().halo})"></button>`
  ).join('');
}

function setMode(next) {
  mode = next;
  $$('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  $('#canvasPanel').classList.toggle('hidden', mode === 'sound' || mode === 'journey');
  $('#soundPanel').classList.toggle('hidden', mode !== 'sound');
  $('#journeyPanel').classList.toggle('hidden', mode !== 'journey');
  const titles = {
    spiral: ['🌀 Metallic DNA Helix', 'Move over the pearl and feather digits to hear their tone.'],
    mandala: ['🔮 Peacock Mandala', 'Click and drag to paint pearlescent intention marks onto the pattern.'],
    particles: ['✨ Conscious Particle Field', 'Move the cursor: the digits notice, orbit, gather, resist and reconnect.'],
  };
  if (titles[mode]) {
    $('#stageTitle').textContent = titles[mode][0];
    $('#stageDesc').textContent = titles[mode][1];
  }
  if (mode === 'particles') resetParticles();
  if (mode === 'sound') renderBars();
}

function updateSeedDisplay() {
  const t = theme();
  const root = document.documentElement;
  root.style.setProperty('--active-halo', t.halo);
  root.style.setProperty('--active-aura', t.aura);
  root.style.setProperty('--active-line', t.line);
  const name = $('#seedName');
  const sym = $('#seedSymbol');
  const note = $('#seedMantra');
  if (name) name.textContent = t.name;
  if (sym) sym.textContent = `${t.symbol} ${t.mark}`;
  if (note) note.textContent = t.mantra;
}

function updateOutputs() {
  $('#harmonyOut').textContent = harmony;
  $('#awarenessOut').textContent = `${awareness}%`;
  $('#tempoOut').textContent = `${tempo} BPM`;
  $('#fixedHarmony').textContent = harmony;
  $('#fixedAwareness').textContent = `${awareness}%`;
  updateSeedDisplay();
}

function animate(now = 0) {
  if (mode === 'spiral') drawSpiral(now);
  if (mode === 'mandala') drawMandala();
  if (mode === 'particles') drawParticles(now);
  requestAnimationFrame(animate);
}

canvas.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
  mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
  if (mode === 'mandala' && mouse.down) {
    const digit = Math.floor((Math.hypot(mouse.x - canvas.width / 2, mouse.y - canvas.height / 2) / 34) % 10);
    painted.push({ x: mouse.x, y: mouse.y, digit });
    playDigit(digit, 0, 0.15);
  }
});
canvas.addEventListener('pointerdown', () => { mouse.down = true; });
window.addEventListener('pointerup', () => { mouse.down = false; });
window.addEventListener('resize', () => { setCanvasSize(); resetParticles(); });

document.addEventListener('click', (e) => {
  const modeBtn = e.target.closest('[data-mode]');
  if (modeBtn) setMode(modeBtn.dataset.mode);
  const bar = e.target.closest('[data-digit]');
  if (bar) playDigit(Number(bar.dataset.digit));
  const seedBtn = e.target.closest('[data-seed]');
  if (seedBtn) {
    seed = seedBtn.dataset.seed;
    $$('.seed-btn').forEach((b) => b.classList.toggle('active', b.dataset.seed === seed));
    painted = [];
    resetParticles();
    updateSeedDisplay();
    if (mode === 'sound') renderBars();
  }
});

$('#playDnaBtn').onclick = playSequence;
$('#clearPaintBtn').onclick = () => { painted = []; };
$('#harmony').oninput = (e) => { harmony = Number(e.target.value); updateOutputs(); };
$('#awareness').oninput = (e) => { awareness = Number(e.target.value); updateOutputs(); };
$('#tempo').oninput = (e) => { tempo = Number(e.target.value); updateOutputs(); };

setCanvasSize();
updateOutputs();
setMode('spiral');
requestAnimationFrame(animate);

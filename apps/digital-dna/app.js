const SEEDS = {
  red: '113031491493585389543778774590997079619617525721567332336510',
  black: '011235831459437077415617853819099875279651673033695493257291',
  blue: '012776329785893036118967145479098334781325217074992143965631',
};
const LUKUS = [2, 1, 3, 4, 7, 1, 8, 9, 7, 6, 3, 9];
const NOTES = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33, 659.25];
const NOTE_NAMES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
const COLORS = ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#8b5cf6', '#ffd700', '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181'];

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

function sequence() {
  return SEEDS[seed].split('').map(Number);
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
  osc.type = digit > 6 ? 'triangle' : 'sine';
  osc.frequency.value = NOTES[digit];
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(0.9, t + 0.025);
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
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function glowCircle(x, y, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = 18;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
      const radius = (70 + d * 8) * scale * pulse;
      const angle = off + t * 0.45;
      const z = i / seq.length;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * 0.55 + (z - 0.5) * canvas.height * 0.72;
      if (prev) {
        ctx.strokeStyle = 'rgba(232,212,184,.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      const size = (3 + d * 0.55) * scale;
      glowCircle(x, y, size, COLORS[d], 0.82);
      const dist = Math.hypot(mouse.x - x, mouse.y - y);
      if (dist < 16 && (!nearest || dist < nearest.dist)) nearest = { digit: d, x, y, dist };
      prev = { x, y };
    }
  }
  if (nearest) {
    glowCircle(nearest.x, nearest.y, 16, '#ffcc44', 0.55);
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
      glowCircle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2.5 + d * 0.35, COLORS[d], 0.85);
    }
  }
  ctx.strokeStyle = '#ffcc44';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < harmony; i++) {
    const a = (i / harmony) * Math.PI * 2 - Math.PI / 2;
    const b = ((i + Math.floor(harmony / 2)) / harmony) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * maxR * 0.32, cy + Math.sin(a) * maxR * 0.32);
    ctx.lineTo(cx + Math.cos(b) * maxR * 0.32, cy + Math.sin(b) * maxR * 0.32);
    ctx.stroke();
  }
  painted.forEach((p) => glowCircle(p.x, p.y, 5.5, '#ffd700', 0.72));
}

function resetParticles() {
  const seq = sequence();
  particles = seq.map((d) => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    digit: d,
    color: COLORS[d],
    size: 2 + d * 0.55,
  }));
}

function drawParticles() {
  ctx.fillStyle = 'rgba(5,4,13,.18)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!particles.length) resetParticles();
  particles.forEach((p) => {
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    if (dist < 210) {
      const force = ((210 - dist) / 12000) * (awareness / 45);
      p.vx += (dx / dist) * force;
      p.vy += (dy / dist) * force;
    }
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.992;
    p.vy *= 0.992;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    p.x = Math.max(0, Math.min(canvas.width, p.x));
    p.y = Math.max(0, Math.min(canvas.height, p.y));
    glowCircle(p.x, p.y, p.size, p.color, 0.9);
  });
  ctx.strokeStyle = 'rgba(255,204,68,.11)';
  for (let i = 0; i < particles.length; i += 2) {
    for (let j = i + 1; j < particles.length; j += 5) {
      const a = particles[i], b = particles[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 95) {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }
}

function renderBars() {
  const bars = $('#bars');
  bars.innerHTML = sequence().slice(0, 60).map((d, i) =>
    `<button class="bar" data-digit="${d}" title="${d} → ${NOTE_NAMES[d]}" style="height:${30 + d * 18}px;background:${COLORS[d]};color:${COLORS[d]}"><span>${d}</span></button>`
  ).join('');
}

function setMode(next) {
  mode = next;
  $$('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  $('#canvasPanel').classList.toggle('hidden', mode === 'sound' || mode === 'journey');
  $('#soundPanel').classList.toggle('hidden', mode !== 'sound');
  $('#journeyPanel').classList.toggle('hidden', mode !== 'journey');
  const titles = {
    spiral: ['🌀 DNA Helix Explorer', 'Move over the glowing digits to hear their tone.'],
    mandala: ['🔮 Sacred Mandala', 'Click and drag to paint gold intention marks onto the pattern.'],
    particles: ['✨ Particle Field', 'Move the cursor and the digits follow your awareness.'],
  };
  if (titles[mode]) {
    $('#stageTitle').textContent = titles[mode][0];
    $('#stageDesc').textContent = titles[mode][1];
  }
  if (mode === 'particles') resetParticles();
  if (mode === 'sound') renderBars();
}

function updateOutputs() {
  $('#harmonyOut').textContent = harmony;
  $('#awarenessOut').textContent = `${awareness}%`;
  $('#tempoOut').textContent = `${tempo} BPM`;
  $('#fixedHarmony').textContent = harmony;
  $('#fixedAwareness').textContent = `${awareness}%`;
}

function animate(now = 0) {
  if (mode === 'spiral') drawSpiral(now);
  if (mode === 'mandala') drawMandala();
  if (mode === 'particles') drawParticles();
  requestAnimationFrame(animate);
}

canvas.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
  mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
  if (mode === 'mandala' && mouse.down) {
    painted.push({ x: mouse.x, y: mouse.y });
    const digit = Math.floor((Math.hypot(mouse.x - canvas.width / 2, mouse.y - canvas.height / 2) / 34) % 10);
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

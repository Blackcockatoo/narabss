class MandalaApp {
  constructor() {
    this.drawCanvas = document.getElementById('draw-canvas');
    this.ctx = this.drawCanvas.getContext('2d');
    this.guideCanvas = document.getElementById('guide-canvas');
    this.gctx = this.guideCanvas.getContext('2d');
    this.preview = document.getElementById('preview-canvas');
    this.pctx = this.preview.getContext('2d');

    this.slices = 6;
    this.snowflake = true;
    this.drawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.brushSize = 4;
    this.brushColor = '#33aaff';
    this.opacity = 1;
    this.showGuides = false;
    this.audioEnabled = true;
    this.audioCtx = null;
    this.lastToneTime = 0;
    this.strokeCount = 0;

    this.resize();
    this.setupEvents();
    this.drawBackground(this.ctx, this.drawCanvas);
    this.renderGuides();
  }

  resize() {
    const wrap = document.getElementById('canvas-wrap');
    const available = Math.min(wrap.parentElement.clientWidth - 24, wrap.parentElement.clientHeight - 60);
    const size = Math.max(available, 200);
    wrap.style.width = size + 'px';
    wrap.style.height = size + 'px';

    [this.drawCanvas, this.guideCanvas].forEach(c => {
      c.width = size;
      c.height = size;
    });
    this.drawBackground(this.ctx, this.drawCanvas);
    this.renderGuides();
  }

  drawBackground(ctx, canvas) {
    const cx = canvas.width / 2, cy = canvas.height / 2;
    ctx.fillStyle = '#0a0816';
    ctx.beginPath();
    ctx.arc(cx, cy, cx, 0, Math.PI * 2);
    ctx.fill();
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
    grad.addColorStop(0, 'rgba(80, 30, 160, 0.35)');
    grad.addColorStop(0.5, 'rgba(20, 10, 60, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, cx, 0, Math.PI * 2);
    ctx.fill();
  }

  renderGuides() {
    const { gctx, guideCanvas, slices, snowflake, showGuides } = this;
    gctx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
    if (!showGuides) return;

    const cx = guideCanvas.width / 2, cy = guideCanvas.height / 2;
    const r = cx * 0.95;
    const step = (Math.PI * 2) / slices;
    const halfStep = step / 2;

    gctx.save();
    gctx.strokeStyle = 'rgba(160, 100, 255, 0.22)';
    gctx.lineWidth = 1;
    gctx.setLineDash([3, 9]);

    for (let i = 0; i < slices; i++) {
      const angle = i * step - Math.PI / 2;
      gctx.beginPath();
      gctx.moveTo(cx, cy);
      gctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      gctx.stroke();
      if (snowflake) {
        const ma = angle + halfStep;
        gctx.beginPath();
        gctx.moveTo(cx, cy);
        gctx.lineTo(cx + r * Math.cos(ma), cy + r * Math.sin(ma));
        gctx.stroke();
      }
    }

    // Circle rings
    gctx.setLineDash([]);
    gctx.strokeStyle = 'rgba(160, 100, 255, 0.1)';
    [0.33, 0.66, 0.95].forEach(pct => {
      gctx.beginPath();
      gctx.arc(cx, cy, cx * pct, 0, Math.PI * 2);
      gctx.stroke();
    });

    // Center dot
    gctx.fillStyle = 'rgba(187,102,255,0.5)';
    gctx.beginPath();
    gctx.arc(cx, cy, 3, 0, Math.PI * 2);
    gctx.fill();

    gctx.restore();
    this.updatePreview();
  }

  getPos(e) {
    const rect = this.drawCanvas.getBoundingClientRect();
    const sx = this.drawCanvas.width / rect.width;
    const sy = this.drawCanvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy };
  }

  setupEvents() {
    const wrap = document.getElementById('canvas-wrap');

    const start = (e) => {
      this.drawing = true;
      const p = this.getPos(e);
      this.lastX = p.x; this.lastY = p.y;
      this.initAudio();
    };
    const move = (e) => {
      if (!this.drawing) return;
      if (e.cancelable) e.preventDefault();
      const p = this.getPos(e);
      this.drawMirrored(this.lastX, this.lastY, p.x, p.y);
      this.playTone(p.x, p.y);
      this.lastX = p.x; this.lastY = p.y;
      this.strokeCount++;
      if (this.strokeCount % 20 === 0) this.updatePreview();
    };
    const end = () => { this.drawing = false; this.updatePreview(); };

    wrap.addEventListener('mousedown', start);
    wrap.addEventListener('mousemove', move);
    wrap.addEventListener('mouseup', end);
    wrap.addEventListener('mouseleave', end);
    wrap.addEventListener('touchstart', start, { passive: true });
    wrap.addEventListener('touchmove', move, { passive: false });
    wrap.addEventListener('touchend', end);

    window.addEventListener('resize', () => this.resize());

    // Panel toggle
    document.getElementById('panel-toggle').addEventListener('click', () => {
      document.getElementById('ctrl-panel').classList.toggle('collapsed');
      setTimeout(() => this.resize(), 210);
    });

    // Slice buttons
    document.querySelectorAll('.slice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.slice-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.slices = parseInt(btn.dataset.slices);
        this.updateHint();
        this.renderGuides();
      });
    });

    // Snowflake
    document.getElementById('snowflake-toggle').addEventListener('change', (e) => {
      this.snowflake = e.target.checked;
      this.updateHint();
      this.renderGuides();
    });

    // Color swatches
    document.querySelectorAll('.color-swatch').forEach(s => {
      s.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('active'));
        s.classList.add('active');
        this.brushColor = s.dataset.color;
        document.getElementById('custom-color').value = s.dataset.color;
      });
    });

    // Custom color
    document.getElementById('custom-color').addEventListener('input', (e) => {
      document.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('active'));
      this.brushColor = e.target.value;
    });

    // Brush size
    document.getElementById('brush-size').addEventListener('input', (e) => {
      this.brushSize = parseInt(e.target.value);
      document.getElementById('brush-size-out').textContent = e.target.value;
    });

    // Opacity
    document.getElementById('opacity').addEventListener('input', (e) => {
      this.opacity = parseFloat(e.target.value);
      document.getElementById('opacity-out').textContent = Math.round(parseFloat(e.target.value) * 100) + '%';
    });

    // Audio
    document.getElementById('audio-toggle').addEventListener('change', (e) => {
      this.audioEnabled = e.target.checked;
    });

    // Guide toggle
    document.getElementById('guide-toggle').addEventListener('click', (e) => {
      this.showGuides = !this.showGuides;
      e.currentTarget.classList.toggle('active', this.showGuides);
      this.renderGuides();
    });

    // Clear
    document.getElementById('clear-btn').addEventListener('click', () => {
      if (confirm('Clear the mandala and start fresh?')) {
        this.drawBackground(this.ctx, this.drawCanvas);
        this.strokeCount = 0;
        this.updatePreview();
      }
    });

    // Download
    document.getElementById('download-btn').addEventListener('click', () => this.download());
  }

  drawMirrored(x1, y1, x2, y2) {
    const { ctx, drawCanvas, slices, snowflake, brushSize, brushColor, opacity } = this;
    const cx = drawCanvas.width / 2, cy = drawCanvas.height / 2;
    const step = (Math.PI * 2) / slices;

    const dx1 = x1 - cx, dy1 = y1 - cy;
    const dx2 = x2 - cx, dy2 = y2 - cy;
    const a1 = Math.atan2(dy1, dx1), r1 = Math.hypot(dx1, dy1);
    const a2 = Math.atan2(dy2, dx2), r2 = Math.hypot(dx2, dy2);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = brushColor;
    ctx.shadowBlur = brushSize * 2.5;

    for (let i = 0; i < slices; i++) {
      const off = i * step;
      this._line(ctx, cx + r1 * Math.cos(a1 + off), cy + r1 * Math.sin(a1 + off),
                      cx + r2 * Math.cos(a2 + off), cy + r2 * Math.sin(a2 + off));
      if (snowflake) {
        this._line(ctx, cx + r1 * Math.cos(-a1 + off), cy + r1 * Math.sin(-a1 + off),
                        cx + r2 * Math.cos(-a2 + off), cy + r2 * Math.sin(-a2 + off));
      }
    }
    ctx.restore();
  }

  _line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  updatePreview() {
    const { pctx, preview, drawCanvas } = this;
    pctx.clearRect(0, 0, preview.width, preview.height);
    pctx.drawImage(drawCanvas, 0, 0, preview.width, preview.height);
  }

  updateHint() {
    const s = document.getElementById('hint-slices');
    if (s) s.textContent = this.slices;
    const hint = document.getElementById('canvas-hint');
    if (hint) {
      hint.textContent = `Draw anywhere · ${this.slices}-way symmetry · snowflake ${this.snowflake ? 'on' : 'off'}`;
    }
  }

  initAudio() {
    if (!this.audioCtx && this.audioEnabled) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTone(x, y) {
    if (!this.audioEnabled || !this.audioCtx) return;
    const now = performance.now();
    if (now - this.lastToneTime < 40) return;
    this.lastToneTime = now;

    const cx = this.drawCanvas.width / 2, cy = this.drawCanvas.height / 2;
    const dx = x - cx, dy = y - cy;
    const r = Math.min(Math.hypot(dx, dy) / cx, 1);
    const angle = Math.atan2(dy, dx);

    // Map to a pentatonic-ish frequency
    const baseFreqs = [220, 261.6, 329.6, 392, 440, 523.3, 659.3, 783.9];
    const idx = Math.floor(r * (baseFreqs.length - 1));
    const freq = baseFreqs[idx] * (1 + Math.abs(Math.sin(angle * this.slices * 0.5)) * 0.05);

    const aCtx = this.audioCtx;
    const osc = aCtx.createOscillator();
    const gain = aCtx.createGain();
    const filter = aCtx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = 800 + (1 - r) * 1200;
    filter.Q.value = 0.8;

    gain.gain.setValueAtTime(0, aCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.035, aCtx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, aCtx.currentTime + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(aCtx.destination);
    osc.start(aCtx.currentTime);
    osc.stop(aCtx.currentTime + 0.25);
  }

  download() {
    const temp = document.createElement('canvas');
    temp.width = this.drawCanvas.width;
    temp.height = this.drawCanvas.height;
    const tctx = temp.getContext('2d');
    tctx.drawImage(this.drawCanvas, 0, 0);

    const a = document.createElement('a');
    a.download = `mandala-${this.slices}slice.png`;
    a.href = temp.toDataURL('image/png');
    a.click();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window._mandala = new MandalaApp();
});

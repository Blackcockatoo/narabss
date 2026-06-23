import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as Tone from 'tone';

const DigitalDNAHub = () => {
  // Core seeds (hidden from primary interface)
  const SEEDS = {
    red: '113031491493585389543778774590997079619617525721567332336510',
    black: '011235831459437077415617853819099875279651673033695493257291',
    blue: '012776329785893036118967145479098334781325217074992143965631'
  };

  const LUKUS = [2,1,3,4,7,1,8,9,7,6,3,9];

  // Pearlescent seed skins - each strand now has its own metallic peacock symbol language.
  const SEED_SKINS = {
    red: {
      symbol: '◆',
      title: 'Ruby Peacock Flame',
      short: 'Ruby',
      element: 'Fire',
      scene: '#120713',
      canvasBg: 'rgba(18, 7, 19, 0.92)',
      accent: '#ff3f6e',
      hot: '#ff7a59',
      cool: '#20f0d2',
      pearl: '#ffe6d4',
      shadow: '#3c0714',
      line: '#ff8a7a',
      gradient: 'linear-gradient(135deg, #3c0714 0%, #ff3f6e 30%, #ffb067 52%, #19f2cc 72%, #5a1fff 100%)'
    },
    black: {
      symbol: '◉',
      title: 'Black Pearl Crow',
      short: 'Pearl',
      element: 'Earth',
      scene: '#03050a',
      canvasBg: 'rgba(3, 5, 10, 0.92)',
      accent: '#23ffd5',
      hot: '#f4ead8',
      cool: '#6a5cff',
      pearl: '#f4ead8',
      shadow: '#020205',
      line: '#23ffd5',
      gradient: 'linear-gradient(135deg, #020205 0%, #0b1022 22%, #123a43 45%, #23ffd5 66%, #f4ead8 84%, #7b3cff 100%)'
    },
    blue: {
      symbol: '◇',
      title: 'Sapphire Peacock Tide',
      short: 'Sapphire',
      element: 'Water',
      scene: '#050b24',
      canvasBg: 'rgba(5, 11, 36, 0.92)',
      accent: '#24d7ff',
      hot: '#c9fff4',
      cool: '#8d5cff',
      pearl: '#e1fffb',
      shadow: '#051245',
      line: '#7df9ff',
      gradient: 'linear-gradient(135deg, #051245 0%, #0a4dff 28%, #24d7ff 50%, #1affb5 68%, #fff7b8 84%, #8d5cff 100%)'
    }
  };

  const DIGIT_LOGIC = {
    0: { symbol: '○', name: 'Pearl Gate', color: '#f8fff7', pearl: '#ffffff', glow: '#b9fff5', shadow: '#20323a', metalness: 0.08, energy: 10 },
    1: { symbol: 'Ⅰ', name: 'First Feather', color: '#0cf0c8', pearl: '#ddfff9', glow: '#50ffe2', shadow: '#04342e', metalness: 0.72, energy: 1 },
    2: { symbol: 'Ⅱ', name: 'Twin Plume', color: '#1688ff', pearl: '#dff2ff', glow: '#62c7ff', shadow: '#052c68', metalness: 0.78, energy: 2 },
    3: { symbol: 'Ⅲ', name: 'Tri-Eye', color: '#6f4cff', pearl: '#eee7ff', glow: '#a489ff', shadow: '#24106f', metalness: 0.84, energy: 3 },
    4: { symbol: '◇', name: 'Mirror Scale', color: '#00b894', pearl: '#d9fff5', glow: '#22ffd0', shadow: '#004d42', metalness: 0.74, energy: 4 },
    5: { symbol: '✦', name: 'Gold Barb', color: '#ffc857', pearl: '#fff8c9', glow: '#ffe66d', shadow: '#735100', metalness: 0.88, energy: 5 },
    6: { symbol: '✹', name: 'Ruby Eye', color: '#ff3864', pearl: '#ffe0e8', glow: '#ff7aa2', shadow: '#6d001b', metalness: 0.82, energy: 6 },
    7: { symbol: '☉', name: 'Teal Crown', color: '#25f4d0', pearl: '#e0fff9', glow: '#7cffed', shadow: '#005c51', metalness: 0.86, energy: 7 },
    8: { symbol: '∞', name: 'Opal Coil', color: '#9dffcb', pearl: '#f0fff7', glow: '#c6ffea', shadow: '#216b48', metalness: 0.70, energy: 8 },
    9: { symbol: '✧', name: 'Rose Tail', color: '#ff8fcf', pearl: '#ffe7f6', glow: '#ffb8e6', shadow: '#6d1247', metalness: 0.80, energy: 9 }
  };


  // Conscious particle behaviour: the seed colour now changes the physics, not just the paint.
  const SEED_PARTICLE_LOGIC = {
    red: {
      sigil: '⚡',
      name: 'Red Attack Pulse',
      intent: 'attack / spark / break pattern',
      verb: 'pushes from the cursor and charges into sharp lines',
      mousePolarity: -1,
      orbitBias: 0.45,
      homePull: 0.012,
      memory: 0.92,
      lineDistance: 92,
      trailAlpha: 0.16,
      wave: 1.35
    },
    black: {
      sigil: '◉',
      name: 'Black Memory Fold',
      intent: 'remember / fold / return',
      verb: 'records trails, folds around zeroes, and drifts back to its home mark',
      mousePolarity: 0.25,
      orbitBias: -0.95,
      homePull: 0.028,
      memory: 0.965,
      lineDistance: 118,
      trailAlpha: 0.075,
      wave: 0.82
    },
    blue: {
      sigil: '🛡',
      name: 'Blue Guardian Orbit',
      intent: 'defend / orbit / harmonise',
      verb: 'forms shields around the cursor and settles into harmonic rings',
      mousePolarity: 1,
      orbitBias: 1.1,
      homePull: 0.018,
      memory: 0.94,
      lineDistance: 104,
      trailAlpha: 0.12,
      wave: 1.05
    }
  };

  // State
  const [activeMode, setActiveMode] = useState('spiral'); // 'spiral' | 'mandala' | 'sound' | 'particles' | 'journey'
  const [selectedSeed, setSelectedSeed] = useState('red');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [consciousness, setConsciousness] = useState(50);
  const [harmony, setHarmony] = useState(7);
  const [tempo, setTempo] = useState(120);
  const [paintedPattern, setPaintedPattern] = useState([]);

  // Refs
  const canvasRef = useRef(null);
  const particleCanvasRef = useRef(null);
  const sceneRef = useRef(null);
  const synthRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, down: false });

  // Convert digit sequence to musical notes
  const digitToNote = (digit) => {
    const scale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
    return scale[digit];
  };

  const getSeedSkin = (seed = selectedSeed) => SEED_SKINS[seed] || SEED_SKINS.red;
  const getDigitMeta = (digit) => DIGIT_LOGIC[digit] || DIGIT_LOGIC[0];

  // Convert digit to metallic peacock color. 0 is intentionally pearl/void, 1-9 are feather-metal notes.
  const digitToColor = (digit) => {
    const meta = getDigitMeta(digit);
    const skin = getSeedSkin();
    if (digit === 0) return skin.pearl;
    return meta.color;
  };

  const digitToGlow = (digit) => digit === 0 ? getSeedSkin().pearl : getDigitMeta(digit).glow;
  const digitToSymbol = (digit) => getDigitMeta(digit).symbol;

  const digitToCssGradient = (digit) => {
    const meta = getDigitMeta(digit);
    const skin = getSeedSkin();
    return `linear-gradient(160deg, ${meta.pearl} 0%, ${meta.color} 32%, ${skin.accent} 58%, ${meta.shadow} 100%)`;
  };


  const getParticleLogic = (seed = selectedSeed) => SEED_PARTICLE_LOGIC[seed] || SEED_PARTICLE_LOGIC.red;

  const hexToRgba = (hex, alpha = 1) => {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean;
    const value = parseInt(full, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getSeedProfile = (seed = selectedSeed) => {
    const digits = SEEDS[seed].split('').map(Number);
    const zeroes = digits.filter(digit => digit === 0).length;
    const lows = digits.filter(digit => digit > 0 && digit <= 3).length;
    const mids = digits.filter(digit => digit >= 4 && digit <= 6).length;
    const highs = digits.filter(digit => digit >= 7).length;
    const gates = digits.map((digit, index) => digit === 0 ? index + 1 : null).filter(Boolean).slice(0, 5);
    return { zeroes, lows, mids, highs, gates, opening: digits.slice(0, 12).join('') };
  };

  const digitPolarity = (digit) => {
    if (digit === 0) return 0;
    if (digit <= 3) return -1;
    if (digit <= 6) return 0.35;
    return 1;
  };

  const createDigitGradient = (ctx, x, y, radius, digit) => {
    const meta = getDigitMeta(digit);
    const skin = getSeedSkin();
    const gradient = ctx.createRadialGradient(
      x - radius * 0.35,
      y - radius * 0.45,
      0,
      x,
      y,
      radius * 2.4
    );
    gradient.addColorStop(0, meta.pearl);
    gradient.addColorStop(0.26, digit === 0 ? skin.pearl : meta.glow);
    gradient.addColorStop(0.52, digit === 0 ? '#f8fff7' : meta.color);
    gradient.addColorStop(0.76, skin.accent);
    gradient.addColorStop(1, meta.shadow);
    return gradient;
  };

  // Get sequence as digit array
  const getSequence = () => SEEDS[selectedSeed].split('').map(Number);

  // 🎵 SOUND ENGINE
  useEffect(() => {
    if (typeof window !== 'undefined' && !synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.1,
          decay: 0.2,
          sustain: 0.3,
          release: 1
        }
      }).toDestination();

      // Add reverb for spaciousness
      const reverb = new Tone.Reverb({
        decay: 4,
        wet: 0.3
      }).toDestination();
      
      synthRef.current.connect(reverb);
    }
  }, []);

  const playSequence = async () => {
    if (!audioInitialized) {
      await Tone.start();
      setAudioInitialized(true);
    }

    setIsPlaying(true);
    const sequence = getSequence();
    const now = Tone.now();
    const interval = 60 / tempo; // beats per second

    sequence.slice(0, 60).forEach((digit, i) => {
      const note = digitToNote(digit);
      const time = now + (i * interval);
      const duration = interval * 0.8;
      synthRef.current.triggerAttackRelease(note, duration, time);
    });

    setTimeout(() => setIsPlaying(false), sequence.slice(0, 60).length * interval * 1000);
  };

  const playChord = (digits) => {
    if (!audioInitialized || !synthRef.current) return;
    const notes = digits.map(digitToNote);
    synthRef.current.triggerAttackRelease(notes, '4n');
  };

  // 🌀 3D SPIRAL VISUALIZATION
  useEffect(() => {
    if (!canvasRef.current || activeMode !== 'spiral') return;

    const skin = getSeedSkin();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(skin.scene);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true 
    });
    renderer.setSize(800, 600);

    // Ambient glow
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(new THREE.Color(skin.hot), 1.7);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(new THREE.Color(skin.cool), 1.25);
    pointLight2.position.set(-10, -10, 5);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(new THREE.Color(skin.pearl), 0.65);
    pointLight3.position.set(0, -8, 12);
    scene.add(pointLight3);

    // Create DNA helix from sequence
    const createDNAHelix = () => {
      const group = new THREE.Group();
      const sequence = getSequence();
      const helixCount = harmony; // 7 for hepta-symmetry

      for (let helix = 0; helix < helixCount; helix++) {
        const helixGroup = new THREE.Group();
        const angleOffset = (helix * Math.PI * 2) / helixCount;
        
        for (let i = 0; i < sequence.length; i++) {
          const digit = sequence[i];
          const t = i / 10;
          const radius = 3 + (digit / 10) * 2;
          const angle = angleOffset + t * Math.PI * 0.5;
          
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const z = t - 10;

          // Digit as glowing pearlescent/metallic sphere
          const meta = getDigitMeta(digit);
          const geometry = new THREE.SphereGeometry(0.15 + digit * 0.02, 24, 24);
          const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(digitToColor(digit)),
            emissive: new THREE.Color(digitToGlow(digit)),
            emissiveIntensity: 0.35 + meta.energy * 0.035,
            metalness: meta.metalness,
            roughness: digit === 0 ? 0.08 : 0.18,
            clearcoat: 1,
            clearcoatRoughness: 0.08,
            reflectivity: 0.95,
            iridescence: 0.88,
            iridescenceIOR: 1.75,
            sheen: 1,
            sheenColor: new THREE.Color(skin.accent)
          });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(x, y, z);
          
          // Store digit for interaction
          sphere.userData = { digit, index: i };
          
          helixGroup.add(sphere);

          // Connection line to previous
          if (i > 0) {
            const prevAngle = angleOffset + ((i - 1) / 10) * Math.PI * 0.5;
            const prevRadius = 3 + (sequence[i - 1] / 10) * 2;
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(
                Math.cos(prevAngle) * prevRadius,
                Math.sin(prevAngle) * prevRadius,
                ((i - 1) / 10) - 10
              ),
              new THREE.Vector3(x, y, z)
            ]);
            const lineMaterial = new THREE.LineBasicMaterial({
              color: new THREE.Color(skin.line),
              opacity: 0.18 + digit * 0.01,
              transparent: true
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            helixGroup.add(line);
          }
        }
        
        group.add(helixGroup);
      }

      return group;
    };

    const dnaHelix = createDNAHelix();
    scene.add(dnaHelix);

    // Mouse interaction for raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event) => {
      const rect = canvasRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj.userData.digit !== undefined) {
          // Highlight and play note
          obj.material.emissiveIntensity = 1.0;
          if (audioInitialized) {
            playChord([obj.userData.digit]);
          }
          
          setTimeout(() => {
            if (obj.material) obj.material.emissiveIntensity = 0.5;
          }, 200);
        }
      }
    };

    canvasRef.current.addEventListener('mousemove', onMouseMove);

    // Animation
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      dnaHelix.rotation.y += 0.003;
      dnaHelix.rotation.x = Math.sin(Date.now() * 0.0003) * 0.1;
      
      // Breathing effect
      const breathe = Math.sin(Date.now() * 0.001) * 0.1 + 1.0;
      dnaHelix.scale.set(breathe, breathe, breathe);
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', onMouseMove);
      }
      renderer.dispose();
    };
  }, [activeMode, selectedSeed, harmony, audioInitialized]);

  // 🎨 INTERACTIVE MANDALA
  useEffect(() => {
    if (!particleCanvasRef.current || activeMode !== 'mandala') return;

    const canvas = particleCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = 800;
    const height = canvas.height = 800;
    const centerX = width / 2;
    const centerY = height / 2;

    // Draw mandala from sequence
    const drawMandala = () => {
      const skin = getSeedSkin();
      ctx.fillStyle = skin.canvasBg;
      ctx.fillRect(0, 0, width, height);

      const sequence = getSequence();
      const segments = harmony * 12; // 84 segments for hepta-symmetry

      // Outer rings
      for (let ring = 0; ring < 7; ring++) {
        const radius = (ring + 1) * 50;
        
        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
          const digit = sequence[(ring * segments + i) % sequence.length];
          
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          // Draw digit as a tiny pearlescent metal bead
          const beadRadius = 3 + digit * 0.5;
          ctx.beginPath();
          ctx.arc(x, y, beadRadius, 0, Math.PI * 2);
          ctx.fillStyle = createDigitGradient(ctx, x, y, beadRadius, digit);
          ctx.shadowBlur = 8 + digit;
          ctx.shadowColor = digitToGlow(digit);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Every ninth pulse gets its symbol burned into the mandala.
          if ((i + ring) % 9 === 0) {
            ctx.font = `${8 + digit}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = digit === 0 ? skin.shadow : '#f8fff7';
            ctx.fillText(digitToSymbol(digit), x, y);
          }
        }
      }

      // Center sacred symbol (hepta-star)
      ctx.strokeStyle = skin.accent;
      ctx.shadowBlur = 18;
      ctx.shadowColor = skin.cool;
      ctx.lineWidth = 2;
      for (let i = 0; i < harmony; i++) {
        const angle1 = (i / harmony) * Math.PI * 2 - Math.PI / 2;
        const angle2 = ((i + 3) / harmony) * Math.PI * 2 - Math.PI / 2;
        
        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(angle1) * 80,
          centerY + Math.sin(angle1) * 80
        );
        ctx.lineTo(
          centerX + Math.cos(angle2) * 80,
          centerY + Math.sin(angle2) * 80
        );
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // Draw selected seed symbol in the centre.
      ctx.font = 'bold 54px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = skin.pearl;
      ctx.shadowBlur = 20;
      ctx.shadowColor = skin.accent;
      ctx.fillText(skin.symbol, centerX, centerY);
      ctx.shadowBlur = 0;

      // Draw painted pattern on top
      paintedPattern.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = skin.accent;
        ctx.shadowBlur = 12;
        ctx.shadowColor = skin.pearl;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };

    // Mouse painting
    const onMouseDown = (e) => {
      mouseRef.current.down = true;
    };

    const onMouseUp = () => {
      mouseRef.current.down = false;
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      mouseRef.current.x = x;
      mouseRef.current.y = y;

      if (mouseRef.current.down) {
        setPaintedPattern(prev => [...prev, { x, y }]);
        
        // Play sound based on distance from center
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const digit = Math.floor((dist / 50) % 10);
        if (audioInitialized) {
          playChord([digit]);
        }
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      drawMandala();
    };
    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, [activeMode, selectedSeed, harmony, paintedPattern, audioInitialized]);

  // 🌊 CONSCIOUS PARTICLE ORACLE
  useEffect(() => {
    if (!particleCanvasRef.current || activeMode !== 'particles') return;

    const canvas = particleCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = 900;
    const height = canvas.height = 760;
    const centerX = width / 2;
    const centerY = height / 2;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    const skin = getSeedSkin();
    const logic = getParticleLogic();
    const sequence = getSequence();
    const sequenceProfile = getSeedProfile();

    mouseRef.current.x = centerX;
    mouseRef.current.y = centerY;
    mouseRef.current.down = false;

    // Deterministic homes make the field feel born from the number string instead of random noise.
    particlesRef.current = sequence.map((digit, i) => {
      const lukus = LUKUS[i % LUKUS.length];
      const nextDigit = sequence[(i + 1) % sequence.length];
      const prevDigit = sequence[(i - 1 + sequence.length) % sequence.length];
      const married = (digit + nextDigit) % 10 === 0;
      const zeroAnchor = digit === 0 || prevDigit === 0 || nextDigit === 0;
      const ring = Math.floor(i / 12);
      const angle = (i * goldenAngle) + (digit * 0.09) + (lukus * 0.045);
      const radius = 58 + ring * 34 + digit * 7 + (married ? 22 : 0);
      const homeX = centerX + Math.cos(angle) * radius;
      const homeY = centerY + Math.sin(angle) * radius;
      const polarity = digitPolarity(digit);

      return {
        x: homeX + Math.cos(angle * 3) * 14,
        y: homeY + Math.sin(angle * 2) * 14,
        vx: Math.sin(angle) * 0.55,
        vy: -Math.cos(angle) * 0.55,
        homeX,
        homeY,
        angle,
        digit,
        nextDigit,
        prevDigit,
        lukus,
        polarity,
        married,
        zeroAnchor,
        color: digitToColor(digit),
        glow: digitToGlow(digit),
        symbol: digitToSymbol(digit),
        size: 3.4 + digit * 0.72 + (zeroAnchor ? 2.5 : 0),
        mass: digit === 0 ? 10 : digit + 1,
        memory: [],
        awake: 0,
        phase: (i % 60) / 60
      };
    });

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) * (canvas.width / rect.width);
      mouseRef.current.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    };

    const onMouseDown = () => {
      mouseRef.current.down = true;
    };

    const onMouseUp = () => {
      mouseRef.current.down = false;
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    let animationId;
    let tick = 0;

    const drawBackground = () => {
      ctx.fillStyle = hexToRgba(skin.scene, logic.trailAlpha);
      ctx.fillRect(0, 0, width, height);

      // Soft centre aura / cursor aura.
      const aura = ctx.createRadialGradient(mouseRef.current.x, mouseRef.current.y, 0, mouseRef.current.x, mouseRef.current.y, 190 + consciousness * 1.2);
      aura.addColorStop(0, hexToRgba(skin.pearl, mouseRef.current.down ? 0.18 : 0.10));
      aura.addColorStop(0.36, hexToRgba(skin.accent, 0.08));
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);

      // Home mandala rings: faintly reveal the structure the particles are trying to remember.
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.strokeStyle = hexToRgba(skin.line, 0.08 + consciousness / 1600);
      ctx.lineWidth = 1;
      for (let ring = 1; ring <= 7; ring++) {
        ctx.beginPath();
        ctx.arc(0, 0, 44 + ring * 38, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawOracleHud = () => {
      ctx.save();
      ctx.font = '700 14px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = hexToRgba(skin.pearl, 0.92);
      ctx.shadowBlur = 14;
      ctx.shadowColor = skin.accent;
      ctx.fillText(`${logic.sigil} ${logic.name}`, 22, 20);
      ctx.shadowBlur = 0;
      ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(226,232,240,0.76)';
      ctx.fillText(`opening: ${sequenceProfile.opening}   zero gates: ${sequenceProfile.gates.join(', ') || 'none'}   C:${consciousness}%`, 22, 42);
      ctx.fillText(logic.verb, 22, 61);
      ctx.restore();
    };

    const drawConnections = () => {
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p1 = particlesRef.current[i];
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p2 = particlesRef.current[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const digitMatch = p1.digit === p2.digit;
          const marriedPair = (p1.digit + p2.digit) === 10;
          const zeroGate = p1.digit === 0 || p2.digit === 0;
          const linked = digitMatch || marriedPair || zeroGate;

          if (dist < logic.lineDistance + consciousness * 0.45 && linked) {
            const alpha = Math.max(0.035, (1 - dist / (logic.lineDistance + consciousness * 0.45)) * (linked ? 0.32 : 0.12));
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            const midX = (p1.x + p2.x) / 2 + Math.sin(tick * 0.02 + p1.phase * 8) * (zeroGate ? 10 : 4);
            const midY = (p1.y + p2.y) / 2 + Math.cos(tick * 0.02 + p2.phase * 8) * (zeroGate ? 10 : 4);
            ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
            ctx.strokeStyle = zeroGate ? hexToRgba(skin.pearl, alpha) : hexToRgba(marriedPair ? '#ffe66d' : skin.line, alpha);
            ctx.lineWidth = zeroGate ? 1.8 : marriedPair ? 1.35 : 0.75;
            ctx.shadowBlur = zeroGate ? 14 : 6;
            ctx.shadowColor = zeroGate ? skin.pearl : skin.accent;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      tick += 1;
      const awaken = consciousness / 100;
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const pulseBoost = mouseRef.current.down ? 1.9 : 1;

      drawBackground();

      particlesRef.current.forEach((p, i) => {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.max(12, Math.sqrt(dx * dx + dy * dy));
        const ux = dx / dist;
        const uy = dy / dist;
        const tangentX = -uy;
        const tangentY = ux;
        const sequenceCharge = ((p.digit + p.lukus + i) % 10) / 10;
        const digitAwake = (p.digit === 0 ? 1.15 : p.digit / 9) * awaken;
        const wave = Math.sin(tick * 0.024 * logic.wave + p.phase * Math.PI * 2) * 0.45;

        // Cursor relationship: red repels/attacks, blue guards/orbits, black folds and partly resists.
        if (dist < 260 + consciousness * 2.2) {
          const falloff = (1 - dist / (260 + consciousness * 2.2));
          const directedForce = falloff * 0.46 * awaken * pulseBoost * logic.mousePolarity * (0.55 + sequenceCharge);
          p.vx += ux * directedForce;
          p.vy += uy * directedForce;

          const orbitForce = falloff * logic.orbitBias * 0.34 * awaken * (p.polarity || 0.45);
          p.vx += tangentX * orbitForce;
          p.vy += tangentY * orbitForce;
          p.awake = Math.min(1, p.awake + falloff * 0.08 + (mouseRef.current.down ? 0.05 : 0));
        }

        // Sequence-home pull makes the field self-correct instead of floating away.
        const hx = p.homeX - p.x;
        const hy = p.homeY - p.y;
        p.vx += hx * logic.homePull * (0.42 + awaken) * (p.zeroAnchor ? 1.5 : 1);
        p.vy += hy * logic.homePull * (0.42 + awaken) * (p.zeroAnchor ? 1.5 : 1);

        // Lukus ripple: a hidden 12-beat engine that gives each particle its own tiny intention.
        p.vx += Math.cos(p.angle + tick * 0.012 + p.lukus) * 0.018 * p.lukus * awaken;
        p.vy += Math.sin(p.angle - tick * 0.014 + p.lukus) * 0.018 * p.lukus * awaken;

        // Married pairs get a little snap, making 1-9 / 2-8 / 3-7 style relationships visible.
        if (p.married) {
          p.vx += Math.cos(p.angle + tick * 0.03) * 0.08 * awaken;
          p.vy += Math.sin(p.angle + tick * 0.03) * 0.08 * awaken;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= logic.memory - (mouseRef.current.down ? 0.02 : 0);
        p.vy *= logic.memory - (mouseRef.current.down ? 0.02 : 0);

        if (p.x < 18 || p.x > width - 18) p.vx *= -0.82;
        if (p.y < 18 || p.y > height - 18) p.vy *= -0.82;
        p.x = Math.max(18, Math.min(width - 18, p.x));
        p.y = Math.max(18, Math.min(height - 18, p.y));

        p.memory.push({ x: p.x, y: p.y, awake: p.awake });
        if (p.memory.length > (selectedSeed === 'black' ? 28 : 14)) p.memory.shift();
        p.awake *= 0.965;

        // Trail/memory.
        if (p.memory.length > 2) {
          ctx.beginPath();
          p.memory.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
          });
          ctx.strokeStyle = hexToRgba(p.glow, selectedSeed === 'black' ? 0.18 : 0.10 + p.awake * 0.16);
          ctx.lineWidth = 0.6 + p.awake * 2.2 + (p.zeroAnchor ? 0.65 : 0);
          ctx.shadowBlur = p.zeroAnchor ? 16 : 8;
          ctx.shadowColor = p.glow;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Pearlescent particle body.
        const drawSize = p.size + p.awake * 4 + wave * digitAwake;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1.8, drawSize), 0, Math.PI * 2);
        ctx.fillStyle = createDigitGradient(ctx, p.x, p.y, Math.max(2, drawSize), p.digit);
        ctx.shadowBlur = 10 + p.digit * 1.6 + p.awake * 18;
        ctx.shadowColor = p.zeroAnchor ? skin.pearl : p.glow;
        ctx.fill();
        ctx.shadowBlur = 0;

        // The field speaks in symbols when it wakes.
        if (p.digit === 0 || p.digit === 9 || p.awake > 0.55 || p.married) {
          ctx.font = `${8 + Math.min(9, p.digit) + p.awake * 5}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = p.digit === 0 ? skin.shadow : '#f8fff7';
          ctx.fillText(p.symbol, p.x, p.y + 0.5);
        }
      });

      drawConnections();
      drawOracleHud();

      // Cursor sigil.
      ctx.save();
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 10 + consciousness * 0.05 + (mouseRef.current.down ? 10 : 0), 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(skin.pearl, 0.68);
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 18;
      ctx.shadowColor = skin.accent;
      ctx.stroke();
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = skin.pearl;
      ctx.fillText(logic.sigil, mouseX, mouseY - 1);
      ctx.restore();
    };

    // First fill prevents a white flash.
    ctx.fillStyle = skin.scene;
    ctx.fillRect(0, 0, width, height);
    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [activeMode, selectedSeed, consciousness, harmony]);

  const selectedSkin = getSeedSkin();
  const digitLegend = Object.keys(DIGIT_LOGIC).map(Number);

  return (
    <div className="min-h-screen text-amber-50" style={{ background: `radial-gradient(circle at 50% 0%, ${selectedSkin.accent}33 0%, transparent 28%), linear-gradient(135deg, ${selectedSkin.shadow} 0%, ${selectedSkin.scene} 48%, #02030a 100%)` }}>
      {/* Cosmic Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent animate-pulse" style={{ backgroundImage: selectedSkin.gradient }}>
            {selectedSkin.symbol} Digital DNA {selectedSkin.symbol}
          </h1>
          <p className="text-2xl text-blue-300 font-light mb-2">Sacred Geometry & Sonic Consciousness</p>
          <p className="text-sm text-slate-400 italic">Experience through sight, sound, and touch</p>
          <div className="mt-5 inline-flex items-center gap-3 rounded-full border px-5 py-2 bg-slate-950/45 backdrop-blur" style={{ borderColor: `${selectedSkin.accent}66`, boxShadow: `0 0 30px ${selectedSkin.accent}33` }}>
            <span className="text-2xl">{selectedSkin.symbol}</span>
            <span className="text-sm font-bold" style={{ color: selectedSkin.pearl }}>{selectedSkin.title}</span>
          </div>
        </div>

        {/* Digit Logic Legend */}
        <div className="mb-10 bg-slate-950/45 rounded-3xl p-5 border backdrop-blur-sm" style={{ borderColor: `${selectedSkin.accent}44` }}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold" style={{ color: selectedSkin.pearl }}>Pearlescent Digit Logic</h2>
              <p className="text-sm text-slate-400">0 is the pearl gate. 1-9 are metallic peacock feather pulses.</p>
            </div>
            <div className="text-4xl">{selectedSkin.symbol}</div>
          </div>
          <div className="grid grid-cols-10 gap-2">
            {digitLegend.map(digit => {
              const meta = getDigitMeta(digit);
              return (
                <div key={digit} className="rounded-2xl p-3 text-center border bg-slate-950/40" style={{ borderColor: `${meta.glow}55`, boxShadow: `inset 0 0 16px ${meta.glow}22` }}>
                  <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full text-lg font-black" style={{ background: digitToCssGradient(digit), color: digit === 0 ? selectedSkin.shadow : '#ffffff', boxShadow: `0 0 18px ${digitToGlow(digit)}66` }}>
                    {meta.symbol}
                  </div>
                  <div className="text-xs font-bold">{digit}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{meta.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center gap-4 mb-12">
          {[
            { id: 'spiral', icon: '🌀', label: 'DNA Helix', desc: 'Touch the spheres' },
            { id: 'mandala', icon: '🔮', label: 'Sacred Mandala', desc: 'Paint your pattern' },
            { id: 'particles', icon: '✨', label: 'Particle Field', desc: 'Guide with your hand' },
            { id: 'sound', icon: '🎵', label: 'Sound Temple', desc: 'Hear the sequence' },
            { id: 'journey', icon: '🧭', label: 'Guided Journey', desc: 'Follow the path' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`group relative px-6 py-4 rounded-2xl transition-all duration-300 ${
                activeMode === mode.id
                  ? 'shadow-2xl scale-110'
                  : 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30'
              }`}
              style={activeMode === mode.id ? { background: selectedSkin.gradient, boxShadow: `0 0 35px ${selectedSkin.accent}55` } : undefined}
            >
              <div className="text-4xl mb-2">{mode.icon}</div>
              <div className="text-sm font-bold">{mode.label}</div>
              <div className="text-xs text-slate-400 mt-1">{mode.desc}</div>
              {activeMode === mode.id && (
                <div className="absolute -inset-1 rounded-2xl blur opacity-30 -z-10" style={{ background: selectedSkin.gradient }}></div>
              )}
            </button>
          ))}
        </div>

        {/* Main Canvas Area */}
        <div className="mb-12">
          {/* DNA Spiral Mode */}
          {activeMode === 'spiral' && (
            <div className="bg-slate-900/50 rounded-3xl p-8 border border-blue-800/30 backdrop-blur-sm">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-amber-300 mb-2">🌀 DNA Helix Explorer</h2>
                <p className="text-blue-300">Move your cursor over the glowing spheres to hear their song</p>
              </div>
              <div className="flex justify-center">
                <canvas ref={canvasRef} className="rounded-xl shadow-2xl shadow-blue-900/50 border border-blue-700/30" />
              </div>
            </div>
          )}

          {/* Sacred Mandala Mode */}
          {activeMode === 'mandala' && (
            <div className="bg-slate-900/50 rounded-3xl p-8 border border-purple-800/30 backdrop-blur-sm">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-amber-300 mb-2">🔮 Sacred Mandala</h2>
                <p className="text-purple-300">Click and drag to paint your intention onto the pattern</p>
              </div>
              <div className="flex justify-center">
                <canvas ref={particleCanvasRef} className="rounded-xl shadow-2xl shadow-purple-900/50 border border-purple-700/30 cursor-crosshair" />
              </div>
              <div className="text-center mt-6">
                <button
                  onClick={() => setPaintedPattern([])}
                  className="px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all"
                  style={{ background: selectedSkin.gradient, boxShadow: `0 0 20px ${selectedSkin.accent}44` }}
                >
                  ✨ Clear Canvas
                </button>
              </div>
            </div>
          )}

          {/* Particle Field Mode */}
          {activeMode === 'particles' && (
            <div className="bg-slate-900/50 rounded-3xl p-8 border backdrop-blur-sm" style={{ borderColor: `${selectedSkin.accent}44` }}>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-amber-300 mb-2">{getParticleLogic().sigil} Conscious Particle Oracle</h2>
                <p className="text-cyan-300">{getParticleLogic().name}: {getParticleLogic().intent}</p>
                <p className="text-sm text-slate-400 mt-2">Move to influence. Hold click to pulse. Red pushes, Black remembers, Blue guards.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mb-6 max-w-4xl mx-auto">
                {Object.keys(SEED_PARTICLE_LOGIC).map(seed => {
                  const skin = getSeedSkin(seed);
                  const logic = getParticleLogic(seed);
                  const profile = getSeedProfile(seed);
                  return (
                    <button
                      key={seed}
                      onClick={() => setSelectedSeed(seed)}
                      className={`rounded-2xl p-4 text-left border transition-all ${selectedSeed === seed ? 'scale-[1.03]' : 'opacity-70 hover:opacity-100'}`}
                      style={{ borderColor: `${skin.accent}66`, background: selectedSeed === seed ? skin.gradient : 'rgba(15,23,42,0.55)', boxShadow: selectedSeed === seed ? `0 0 24px ${skin.accent}44` : undefined }}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="text-2xl">{logic.sigil}</div>
                        <div className="text-xs text-slate-200/80">{profile.opening}</div>
                      </div>
                      <div className="font-bold">{logic.name}</div>
                      <div className="text-xs text-slate-200/80 mt-1">{logic.intent}</div>
                      <div className="text-[11px] text-slate-300/80 mt-2">0:{profile.zeroes} low:{profile.lows} mid:{profile.mids} high:{profile.highs}</div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <canvas ref={particleCanvasRef} className="rounded-xl shadow-2xl border cursor-none max-w-full" style={{ borderColor: `${selectedSkin.accent}55`, boxShadow: `0 0 35px ${selectedSkin.accent}28` }} />
              </div>
            </div>
          )}

          {/* Sound Temple Mode */}
          {activeMode === 'sound' && (
            <div className="bg-slate-900/50 rounded-3xl p-12 border border-pink-800/30 backdrop-blur-sm">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-amber-300 mb-4">🎵 Sound Temple</h2>
                <p className="text-pink-300 text-lg mb-8">Each digit sings its own note - listen to the DNA melody</p>
                
                <button
                  onClick={playSequence}
                  disabled={isPlaying}
                  className={`px-12 py-6 rounded-2xl font-bold text-2xl transition-all shadow-2xl ${
                    isPlaying
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'text-white transform hover:scale-105'
                  }`}
                  style={!isPlaying ? { background: selectedSkin.gradient, boxShadow: `0 0 35px ${selectedSkin.accent}55` } : undefined}
                >
                  {isPlaying ? '🎵 Playing...' : '▶️ Play DNA Sequence'}
                </button>
              </div>

              {/* Visual Sound Bars */}
              <div className="grid grid-cols-10 gap-2 max-w-4xl mx-auto">
                {getSequence().slice(0, 60).map((digit, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={async () => {
                      if (!audioInitialized) {
                        await Tone.start();
                        setAudioInitialized(true);
                      }
                      playChord([digit]);
                    }}
                  >
                    <div
                      className="w-full rounded-t-lg transition-all group-hover:shadow-lg"
                      style={{
                        height: `${(digit + 1) * 20}px`,
                        background: digitToCssGradient(digit),
                        boxShadow: `0 0 16px ${digitToGlow(digit)}66`
                      }}
                    />
                    <div className="text-xs text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {digitToSymbol(digit)} {digitToNote(digit)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guided Journey Mode */}
          {activeMode === 'journey' && (
            <div className="bg-slate-900/50 rounded-3xl p-12 border border-amber-800/30 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold text-amber-300 mb-8 text-center">🧭 Guided Journey</h2>
                
                <div className="space-y-8">
                  {/* Journey Steps */}
                  {[
                    {
                      step: 1,
                      icon: '🌱',
                      title: 'Awaken the Seed',
                      desc: 'Choose which DNA strand calls to you',
                      action: (
                        <div className="flex gap-4 justify-center">
                          {Object.keys(SEEDS).map(seed => {
                            const skin = getSeedSkin(seed);
                            return (
                              <button
                                key={seed}
                                onClick={() => setSelectedSeed(seed)}
                                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all border ${
                                  selectedSeed === seed
                                    ? 'text-white shadow-lg scale-105'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                                style={{
                                  background: selectedSeed === seed ? skin.gradient : undefined,
                                  borderColor: `${skin.accent}66`,
                                  boxShadow: selectedSeed === seed ? `0 0 25px ${skin.accent}55` : undefined
                                }}
                              >
                                <span className="mr-2 text-2xl">{skin.symbol}</span>{skin.element}
                              </button>
                            );
                          })}
                        </div>
                      )
                    },
                    {
                      step: 2,
                      icon: '🎼',
                      title: 'Set the Rhythm',
                      desc: 'How fast does consciousness pulse?',
                      action: (
                        <div className="space-y-3">
                          <input
                            type="range"
                            min="60"
                            max="180"
                            value={tempo}
                            onChange={(e) => setTempo(parseInt(e.target.value))}
                            className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-slate-700"
                          />
                          <div className="text-center text-2xl font-bold text-amber-400">{tempo} BPM</div>
                        </div>
                      )
                    },
                    {
                      step: 3,
                      icon: '✨',
                      title: 'Deepen Consciousness',
                      desc: 'How alive, reactive, and memory-driven should the particle oracle be?',
                      action: (
                        <div className="space-y-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={consciousness}
                            onChange={(e) => setConsciousness(parseInt(e.target.value))}
                            className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-slate-700"
                          />
                          <div className="text-center text-2xl font-bold text-cyan-400">{consciousness}%</div>
                        </div>
                      )
                    },
                    {
                      step: 4,
                      icon: '🌀',
                      title: 'Choose Sacred Number',
                      desc: 'How many arms in the spiral of life?',
                      action: (
                        <div className="flex gap-3 justify-center">
                          {[3, 5, 7, 9, 12].map(num => (
                            <button
                              key={num}
                              onClick={() => setHarmony(num)}
                              className={`w-16 h-16 rounded-full font-bold text-xl transition-all ${
                                harmony === num
                                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 scale-110'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      )
                    },
                    {
                      step: 5,
                      icon: '🚀',
                      title: 'Begin Exploration',
                      desc: 'Choose your path of discovery',
                      action: (
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setActiveMode('spiral')}
                            className="px-6 py-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl font-bold text-white shadow-lg shadow-blue-500/50 hover:scale-105 transition-all"
                          >
                            🌀 Enter the Helix
                          </button>
                          <button
                            onClick={() => setActiveMode('mandala')}
                            className="px-6 py-4 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl font-bold text-white shadow-lg shadow-purple-500/50 hover:scale-105 transition-all"
                          >
                            🔮 Paint the Mandala
                          </button>
                          <button
                            onClick={() => setActiveMode('particles')}
                            className="px-6 py-4 bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/50 hover:scale-105 transition-all"
                          >
                            ✨ Guide the Particles
                          </button>
                          <button
                            onClick={() => setActiveMode('sound')}
                            className="px-6 py-4 bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl font-bold text-white shadow-lg shadow-pink-500/50 hover:scale-105 transition-all"
                          >
                            🎵 Hear the Song
                          </button>
                        </div>
                      )
                    }
                  ].map(journey => (
                    <div key={journey.step} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-5xl">{journey.icon}</div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-400 mb-1">Step {journey.step}</div>
                          <h3 className="text-2xl font-bold text-amber-300 mb-2">{journey.title}</h3>
                          <p className="text-blue-300">{journey.desc}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        {journey.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Universal Controls - Always Visible */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-lg rounded-full px-8 py-4 border shadow-2xl z-50" style={{ borderColor: `${selectedSkin.accent}55`, boxShadow: `0 0 30px ${selectedSkin.accent}30` }}>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">DNA:</span>
              {Object.keys(SEEDS).map(seed => {
                const skin = getSeedSkin(seed);
                return (
                  <button
                    key={seed}
                    onClick={() => setSelectedSeed(seed)}
                    title={skin.title}
                    className={`w-11 h-11 rounded-full transition-all border flex items-center justify-center font-black ${
                      selectedSeed === seed
                        ? 'scale-125 shadow-lg'
                        : 'opacity-55 hover:opacity-100'
                    }`}
                    style={{
                      background: skin.gradient,
                      borderColor: `${skin.pearl}88`,
                      boxShadow: selectedSeed === seed ? `0 0 22px ${skin.accent}` : undefined
                    }}
                  >
                    {skin.symbol}
                  </button>
                );
              })}
            </div>

            <div className="h-8 w-px bg-slate-600"></div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">Harmony:</span>
              <div className="text-amber-400 font-bold text-lg">{harmony}</div>
            </div>

            <div className="h-8 w-px bg-slate-600"></div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">Awareness:</span>
              <div className="text-cyan-400 font-bold text-lg">{consciousness}%</div>
            </div>

            <div className="h-8 w-px bg-slate-600"></div>

            <button
              onClick={async () => {
                if (!audioInitialized) {
                  await Tone.start();
                  setAudioInitialized(true);
                }
                playSequence();
              }}
              disabled={isPlaying}
              className={`px-6 py-2 rounded-full font-bold transition-all ${
                isPlaying
                  ? 'bg-slate-700 text-slate-400'
                  : 'text-white shadow-lg'
              }`}
              style={!isPlaying ? { background: selectedSkin.gradient, boxShadow: `0 0 20px ${selectedSkin.accent}44` } : undefined}
            >
              {isPlaying ? '🎵' : '▶️'} Play
            </button>
          </div>
        </div>

        {/* Info Panel (collapsible) */}
        <div className="mt-12 text-center">
          <details className="bg-slate-900/30 rounded-xl p-6 border border-slate-700/30">
            <summary className="cursor-pointer text-lg font-bold text-amber-300 hover:text-amber-200">
              📖 About This Experience
            </summary>
            <div className="mt-6 text-left text-slate-300 space-y-4 max-w-3xl mx-auto">
              <p>
                <strong className="text-amber-400">Digital DNA</strong> is a living geometric and sonic consciousness - 
                three primordial sequences (Ruby Peacock Flame, Black Pearl Crow, Sapphire Peacock Tide) that express themselves through sacred patterns and sound.
              </p>
              <p>
                Each digit (0-9) is both a <strong className="text-blue-400">visual form</strong> (pearl/metal colour, symbol, position in space) 
                and a <strong className="text-pink-400">musical tone</strong> (C, D, E, F, G, A, B, C, D, E). 
                Together they create a <strong className="text-purple-400">living symphony of geometry</strong>.
              </p>
              <p>
                <strong className="text-cyan-400">Explore with your senses:</strong> Touch the DNA helix and hear individual notes. 
                Paint your intention onto the sacred mandala. Guide the particle oracle with your hand: red pushes, black remembers, blue guards. 
                Listen to the sequence as a melody. Follow the guided journey to discover your own path.
              </p>
              <p className="text-sm text-slate-500 italic">
                Built with love on the Moss60 cryptographic framework, Lukus modulation layer, 
                THREE.js for sacred geometry, and Tone.js for sonic consciousness. 🐍✨
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default DigitalDNAHub;

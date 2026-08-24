/* ═══════════════════════════════════════════════════════════════════════════
   RADIOLOGY RUSH — audio engine v2
   Cinematic electronic score, synthesised live: sidechained bass, supersaw
   pads, plucked arps through a feedback delay, real drums, risers and impacts,
   a convolution room, a hospital ambience bed, and the voice cast.
   Nothing streams. Every byte of this is generated on the device.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (RR) {
  'use strict';

  var A = {
    ctx: null, on: true, music: true, voice: true, ambience: true,
    master: null, comp: null, verb: null, verbSend: null, delay: null, delaySend: null,
    musicBus: null, sfxBus: null, voiceBus: null, ambBus: null, duckBus: null
  };
  RR.audio = A;

  /* ───────────────────────── graph ───────────────────────── */
  function impulse(seconds, decay, bright) {
    var rate = A.ctx.sampleRate, len = Math.floor(rate * seconds);
    var buf = A.ctx.createBuffer(2, len, rate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        var t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (bright ? (1 - t * 0.4) : 1);
      }
    }
    return buf;
  }

  A.init = function () {
    if (A.ctx) return;
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) { A.on = false; return; }
    A.ctx = new C();

    A.comp = A.ctx.createDynamicsCompressor();
    A.comp.threshold.value = -10; A.comp.knee.value = 12;
    A.comp.ratio.value = 5; A.comp.attack.value = 0.004; A.comp.release.value = 0.22;

    A.master = A.ctx.createGain(); A.master.gain.value = 0.9;
    A.master.connect(A.comp); A.comp.connect(A.ctx.destination);

    // one shared room, fed by sends so dry hits stay punchy
    A.verb = A.ctx.createConvolver();
    A.verb.buffer = impulse(2.4, 2.6, true);
    A.verbSend = A.ctx.createGain(); A.verbSend.gain.value = 0.9;
    A.verbSend.connect(A.verb); A.verb.connect(A.master);

    // a dotted-eighth feedback delay for plucks and leads
    A.delay = A.ctx.createDelay(1.5);
    A.delay.delayTime.value = 0.32;
    var fb = A.ctx.createGain(); fb.gain.value = 0.34;
    var dampen = A.ctx.createBiquadFilter();
    dampen.type = 'lowpass'; dampen.frequency.value = 2600;
    A.delay.connect(dampen); dampen.connect(fb); fb.connect(A.delay);
    A.delaySend = A.ctx.createGain(); A.delaySend.gain.value = 0.5;
    A.delaySend.connect(A.delay); A.delay.connect(A.master);

    A.sfxBus = A.ctx.createGain(); A.sfxBus.gain.value = 0.55; A.sfxBus.connect(A.master);
    A.voiceBus = A.ctx.createGain(); A.voiceBus.gain.value = 1.0; A.voiceBus.connect(A.master);
    A.ambBus = A.ctx.createGain(); A.ambBus.gain.value = 0.0; A.ambBus.connect(A.master);
    A.musicBus = A.ctx.createGain(); A.musicBus.gain.value = 0.0; A.musicBus.connect(A.master);
    // everything rhythmic that should duck under the kick
    A.duckBus = A.ctx.createGain(); A.duckBus.gain.value = 1.0; A.duckBus.connect(A.musicBus);
  };

  A.resume = function () { A.init(); if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); };

  /* ── iOS unlock: gesture, silent buffer, and a media element to hold the
     playback session so the ringer switch cannot mute Web Audio ── */
  var SILENT_WAV = 'data:audio/wav;base64,UklGRqQMAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YYAMAACBgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
  var keeper = null;

  A.isRunning = function () { return !!A.ctx && A.ctx.state === 'running'; };

  A.unlock = function () {
    A.init();
    if (!A.ctx) return false;
    if (A.ctx.state === 'suspended') A.ctx.resume();
    try {
      var b = A.ctx.createBuffer(1, 1, 22050);
      var src = A.ctx.createBufferSource();
      src.buffer = b; src.connect(A.ctx.destination); src.start(0);
    } catch (e) {}
    if (!keeper) {
      keeper = document.createElement('audio');
      keeper.src = SILENT_WAV;
      keeper.loop = true; keeper.preload = 'auto'; keeper.volume = 1;
      keeper.setAttribute('playsinline', ''); keeper.setAttribute('webkit-playsinline', '');
      keeper.style.display = 'none';
      document.body.appendChild(keeper);
    }
    var p = keeper.play();
    if (p && p.catch) p.catch(function () {});
    return A.isRunning();
  };

  A.rewake = function () {
    if (!A.ctx) return;
    if (A.ctx.state === 'suspended') A.ctx.resume();
    if (keeper && keeper.paused) { var q = keeper.play(); if (q && q.catch) q.catch(function () {}); }
  };

  /* ───────────────────────── voices ───────────────────────── */
  var noiseBuf = null;
  function noiseBuffer() {
    if (noiseBuf) return noiseBuf;
    var len = A.ctx.sampleRate * 3;
    noiseBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    var d = noiseBuf.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) {                       // pink-ish: smoother, less hissy
      var w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    return noiseBuf;
  }

  function shaper(amount) {
    var c = A.ctx.createWaveShaper(), n = 1024, curve = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = i * 2 / n - 1;
      curve[i] = (1 + amount) * x / (1 + amount * Math.abs(x));
    }
    c.curve = curve; c.oversample = '2x';
    return c;
  }

  /** One synth note: oscillator stack → filter → amp, with optional sends. */
  function synth(o) {
    if (!A.on || !A.ctx) return;
    var t = o.at != null ? o.at : A.ctx.currentTime;
    var out = A.ctx.createGain();
    out.gain.value = 0;

    var filt = A.ctx.createBiquadFilter();
    filt.type = o.filterType || 'lowpass';
    filt.frequency.setValueAtTime(o.cutoff || 4000, t);
    filt.Q.value = o.q || 1;
    if (o.sweep) filt.frequency.exponentialRampToValueAtTime(Math.max(40, o.sweep), t + (o.dur || 0.3));

    var pre = o.drive ? shaper(o.drive) : null;
    if (pre) { filt.connect(pre); pre.connect(out); } else filt.connect(out);

    var voices = o.voices || 1, oscs = [];
    for (var i = 0; i < voices; i++) {
      var osc = A.ctx.createOscillator();
      osc.type = o.type || 'sawtooth';
      osc.frequency.setValueAtTime(o.freq, t);
      if (o.glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.glide), t + (o.dur || 0.3));
      if (voices > 1) osc.detune.value = (i - (voices - 1) / 2) * (o.spread || 14);
      osc.connect(filt);
      osc.start(t);
      osc.stop(t + (o.dur || 0.3) + (o.rel || 0.25) + 0.05);
      oscs.push(osc);
    }
    if (o.sub) {
      var s = A.ctx.createOscillator();
      s.type = 'sine'; s.frequency.setValueAtTime(o.freq / 2, t);
      var sg = A.ctx.createGain(); sg.gain.value = o.sub;
      s.connect(sg); sg.connect(filt);
      s.start(t); s.stop(t + (o.dur || 0.3) + (o.rel || 0.25) + 0.05);
    }

    var g = o.gain == null ? 0.2 : o.gain;
    var atk = o.atk == null ? 0.008 : o.atk;
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(g, t + atk);
    if (o.hold) out.gain.setValueAtTime(g, t + atk + o.hold);
    var endAt = t + atk + (o.hold || 0) + (o.dur || 0.3);
    out.gain.exponentialRampToValueAtTime(0.0002, endAt);
    out.gain.linearRampToValueAtTime(0, endAt + 0.006);   // land on true silence

    out.connect(o.bus || A.sfxBus);
    if (o.verb) { var v = A.ctx.createGain(); v.gain.value = o.verb; out.connect(v); v.connect(A.verbSend); }
    if (o.echo) { var e = A.ctx.createGain(); e.gain.value = o.echo; out.connect(e); e.connect(A.delaySend); }
  }

  /** One noise hit: pink noise → filter → amp, with optional sends. */
  function hit(o) {
    if (!A.on || !A.ctx) return;
    var t = o.at != null ? o.at : A.ctx.currentTime;
    var src = A.ctx.createBufferSource();
    src.buffer = noiseBuffer(); src.loop = true;
    src.playbackRate.value = o.rate || 1;
    var f = A.ctx.createBiquadFilter();
    f.type = o.filterType || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1200, t);
    f.Q.value = o.q || 1;
    if (o.sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, o.sweep), t + (o.dur || 0.2));
    var g = A.ctx.createGain();
    var peak = o.gain == null ? 0.2 : o.gain, atk = o.atk == null ? 0.003 : o.atk;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + atk);
    var stopAt = t + atk + (o.dur || 0.2);
    g.gain.exponentialRampToValueAtTime(0.0002, stopAt);
    g.gain.linearRampToValueAtTime(0, stopAt + 0.006);
    src.connect(f); f.connect(g); g.connect(o.bus || A.sfxBus);
    if (o.verb) { var v = A.ctx.createGain(); v.gain.value = o.verb; g.connect(v); v.connect(A.verbSend); }
    src.start(t); src.stop(stopAt + 0.05);
  }

  /* ───────────────────────── drum kit ───────────────────────── */
  function kick(t, bus, level) {
    synth({ at: t, freq: 150, glide: 42, type: 'sine', dur: 0.34, atk: 0.002,
      gain: 0.85 * (level || 1), cutoff: 900, bus: bus || A.musicBus });
    hit({ at: t, freq: 1400, sweep: 260, dur: 0.055, gain: 0.10 * (level || 1),
      atk: 0.004, filterType: 'lowpass', bus: bus || A.musicBus });
  }
  function snare(t, bus, level) {
    hit({ at: t, freq: 1700, q: 0.7, dur: 0.17, gain: 0.34 * (level || 1),
      filterType: 'bandpass', verb: 0.28, bus: bus || A.musicBus });
    synth({ at: t, freq: 210, glide: 150, type: 'triangle', dur: 0.11,
      gain: 0.18 * (level || 1), cutoff: 3000, bus: bus || A.musicBus });
  }
  function clap(t, bus, level) {
    [0, 0.012, 0.024].forEach(function (d, i) {
      hit({ at: t + d, freq: 1500, q: 1.2, dur: 0.09 + i * 0.05,
        gain: (0.2 - i * 0.04) * (level || 1), filterType: 'bandpass',
        verb: i === 2 ? 0.4 : 0, bus: bus || A.musicBus });
    });
  }
  function hat(t, open, bus, level) {
    hit({ at: t, freq: open ? 7000 : 9500, q: 0.9, dur: open ? 0.16 : 0.032,
      gain: (open ? 0.13 : 0.10) * (level || 1), filterType: 'highpass',
      bus: bus || A.musicBus });
  }
  function riser(t, dur, bus) {
    hit({ at: t, freq: 300, sweep: 9000, q: 1.4, dur: dur, gain: 0.16, atk: dur * 0.8,
      filterType: 'bandpass', verb: 0.5, bus: bus || A.musicBus });
  }
  function impact(t, bus) {
    synth({ at: t, freq: 90, glide: 34, type: 'sine', dur: 0.9, gain: 0.5,
      cutoff: 500, verb: 0.6, bus: bus || A.musicBus });
    hit({ at: t, freq: 4000, sweep: 200, dur: 0.7, gain: 0.24, filterType: 'lowpass',
      verb: 0.7, bus: bus || A.musicBus });
  }

  /* ═══════════════════ the score ═══════════════════ */
  var M = {
    playing: false, timer: null, next: 0, step: 0, bpm: 126, bar: 0,
    root: 220, mode: [0, 3, 5, 7, 10], heat: 1, target: 1, layer: [0, 0, 0, 0],
    world: 'ct', boss: false, seed: 1
  };
  A.musicState = M;

  /* one identity per department: key, tempo, drum feel, motif */
  var SCORES = {
    ct: {   bpm: 126, root: 220.00, mode: [0, 3, 5, 7, 10],
            kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.',
            motif: [0, 2, 4, 2, 5, 4, 2, 0], colour: 'bright' },
    mri: {  bpm: 118, root: 196.00, mode: [0, 2, 3, 7, 9],
            kick: 'x.....x.x.......', snare: '....x.......x...', hat: '..x.x...x.x...x.',
            motif: [0, 3, 2, 4, 3, 1, 2, 0], colour: 'wide' },
    xray: { bpm: 132, root: 233.08, mode: [0, 3, 5, 6, 10],
            kick: 'x..x..x.x..x....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.',
            motif: [0, 1, 3, 4, 3, 1, 0, 4], colour: 'metal' },
    us: {   bpm: 122, root: 246.94, mode: [0, 2, 4, 7, 9],
            kick: 'x...x...x...x.x.', snare: '....x.......x...', hat: '..x...x...x...x.',
            motif: [4, 2, 0, 2, 4, 5, 4, 2], colour: 'liquid' },
    tracer:{ bpm: 128, root: 207.65, mode: [0, 2, 5, 7, 9],
            kick: 'x...x...x...x...', snare: '....x...x...x...', hat: '..x.x.x...x.x.x.',
            motif: [0, 4, 2, 5, 4, 2, 5, 7], colour: 'weightless' },
    cath:  { bpm: 138, root: 261.63, mode: [0, 3, 5, 7, 10],
            kick: 'x..x..x...x.x...', snare: '....x.......x...', hat: 'x.xx x.xx x.xx x'.replace(/ /g, ''),
            motif: [0, 4, 3, 4, 2, 4, 3, 1], colour: 'urgent' },
    boss:  { bpm: 148, root: 174.61, mode: [0, 1, 5, 7, 8],
            kick: 'x.x...x.x.x...x.', snare: '....x.......x..x', hat: 'x.xxx.xxx.xxx.xx',
            motif: [0, 0, 1, 0, 5, 4, 1, 0], colour: 'menace' },
    menu:  { bpm: 112, root: 220.00, mode: [0, 2, 3, 7, 10],
            kick: 'x.......x.......', snare: '................', hat: '....x.......x...',
            motif: [0, 2, 3, 2, 0, 2, 5, 4], colour: 'calm' }
  };

  function rnd() { M.seed = (M.seed * 1664525 + 1013904223) & 0x7fffffff; return M.seed / 0x7fffffff; }
  function note(deg, oct) {
    var m = M.mode, n = m[((deg % m.length) + m.length) % m.length];
    var o = Math.floor(deg / m.length) + (oct || 0);
    return M.root * Math.pow(2, n / 12) * Math.pow(2, o);
  }

  /** Sidechain: everything sustained ducks under each kick, which is the whole
      reason four-on-the-floor breathes instead of muddying. */
  function duck(t) {
    var g = A.duckBus.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);                       // start from where it actually is
    g.linearRampToValueAtTime(0.4, t + 0.012);          // 12 ms dip, not a step
    g.linearRampToValueAtTime(1, t + (60 / M.bpm) * 0.72);
  }

  var S = null;   // active score

  /* Four-chord progressions. Tone first: a pad and a bass note are always
     sounding, so the percussion sits on top of music instead of being the music. */
  var PROGRESSIONS = {
    bright:      [0, 5, 3, 4],
    wide:        [0, 3, 5, 2],
    metal:       [0, 4, 2, 5],
    liquid:      [0, 2, 4, 3],
    weightless:  [0, 4, 5, 2],
    urgent:      [0, 5, 4, 3],
    menace:      [0, 1, 4, 3],
    calm:        [0, 3, 4, 2]
  };

  function chordAt(bar) {
    var prog = PROGRESSIONS[S.colour] || PROGRESSIONS.bright;
    return prog[Math.floor(bar / 2) % prog.length];
  }

  function scheduleStep(step, t) {
    var beat = step % 16, bar = Math.floor(step / 16) % 8;
    var L = M.layer;
    M.bar = bar;
    var root = chordAt(bar);
    var barSecs = (60 / M.bpm) * 4;

    /* ── TONE (always, from the first layer) ───────────────────────────────
       The pad holds the chord for two full bars; the bass sustains under it. */
    if (L[0] > 0.01 && beat === 0) {
      if (bar % 2 === 0) {
        [0, 2, 4].forEach(function (d, i) {
          synth({ at: t, freq: note(root + d, 0), type: 'sawtooth', voices: 5, spread: 15,
            atk: 0.35, hold: barSecs * 1.5, dur: 0.9, gain: 0.075 * L[0],
            cutoff: 1500 + i * 350, verb: 0.75, bus: A.duckBus });
        });
      }
      synth({ at: t, freq: note(root, -2), type: 'sawtooth', voices: 2, spread: 7,
        atk: 0.02, hold: barSecs * 0.72, dur: 0.35, gain: 0.3 * L[0],
        cutoff: M.boss ? 480 : 400, q: 5, drive: M.boss ? 2 : 0.6, sub: 0.6, bus: A.duckBus });
    }
    /* the off-beat bass push, long enough to be a note rather than a tick */
    if (L[0] > 0.01 && (beat === 6 || beat === 10 || beat === 14)) {
      synth({ at: t, freq: note(root + (beat === 10 ? 4 : 0), -2), type: 'sawtooth',
        voices: 2, spread: 7, atk: 0.012, hold: 0.1, dur: 0.24, gain: 0.22 * L[0],
        cutoff: 420, q: 5, sub: 0.5, bus: A.duckBus });
    }

    /* ── DRUMS: quieter, and never the loudest thing in the mix ── */
    if (L[0] > 0.01) {
      if (S.kick[beat] === 'x') { kick(t, A.musicBus, L[0] * 0.85); duck(t); }
      if (S.snare[beat] === 'x') (M.boss ? snare : clap)(t, A.musicBus, L[0] * 0.55);
    }
    if (L[1] > 0.01 && S.hat[beat] === 'x') {
      hat(t, beat % 8 === 6, A.musicBus, L[1] * 0.5);
    }

    /* ── MELODY: an eight-bar phrase with rests, over the progression ── */
    if (L[2] > 0.01) {
      var phrase = S.motif;
      var idx = (bar * 4 + Math.floor(beat / 4)) % 8;
      if (beat % 4 === 0 && !(bar % 4 === 3 && beat >= 8)) {      // rest at the phrase end
        synth({ at: t, freq: note(root + phrase[idx], 1), type: 'triangle', voices: 2,
          spread: 6, atk: 0.012, hold: 0.12, dur: 0.4, gain: 0.19 * L[2],
          cutoff: 5200, verb: 0.4, echo: 0.3, bus: A.duckBus });
      }
      if (beat % 8 === 6) {                                        // an answering note
        synth({ at: t, freq: note(root + phrase[(idx + 2) % 8], 1), type: 'square',
          atk: 0.01, dur: 0.2, gain: 0.1 * L[2], cutoff: 3600, echo: 0.35, bus: A.duckBus });
      }
    }

    /* ── FULL FLIGHT: counter-melody, wide pad octave, claps ── */
    if (L[3] > 0.01) {
      if (beat % 2 === 0) {
        synth({ at: t, freq: note(root + S.motif[(beat / 2 + bar) % 8] + 2, 2), type: 'triangle',
          atk: 0.008, dur: 0.16, gain: 0.07 * L[3], cutoff: 7000, verb: 0.4, echo: 0.4,
          bus: A.duckBus });
      }
      if (beat === 0 && bar % 2 === 0) {
        [0, 4].forEach(function (d) {
          synth({ at: t, freq: note(root + d, 1), type: 'sawtooth', voices: 4, spread: 20,
            atk: 0.5, hold: barSecs, dur: 1.2, gain: 0.05 * L[3], cutoff: 2600,
            verb: 0.8, bus: A.duckBus });
        });
      }
      if (beat === 4 || beat === 12) clap(t, A.musicBus, L[3] * 0.5);
    }

    /* section furniture */
    if (beat === 0) {
      for (var i = 0; i < 4; i++) {
        var want = M.target > i ? 1 : 0;
        M.layer[i] += (want - M.layer[i]) * (want ? 1 : 0.45);
        if (M.layer[i] < 0.02) M.layer[i] = 0;
      }
      if (bar === 7 && M.target >= 2) riser(t + barSecs * 0.5, barSecs * 0.5, A.musicBus);
      if (bar === 0 && M.target >= 3) impact(t, A.musicBus);
    }
  }

  var gen = 0;              // guards against a stale stop killing a fresh track

  function tick() {
    if (!M.playing || !A.ctx) return;
    var spb = 60 / M.bpm / 4;
    var budget = 64;        // never block the thread if the clock jumped
    while (M.next < A.ctx.currentTime + 0.28 && budget-- > 0) {
      try { scheduleStep(M.step, M.next); }
      catch (e) { /* one bad step must never silence the whole score */ }
      M.step = (M.step + 1) % 128;
      M.next += spb;
    }
    if (M.next < A.ctx.currentTime) M.next = A.ctx.currentTime + 0.05;   // resync after a suspend
    clearTimeout(M.timer);
    M.timer = setTimeout(tick, 25);
  }

  /**
   * Start a track. Every world has its own score; the level number nudges the
   * tempo and transposes the key, so no two levels sound identical.
   */
  A.startMusic = function (worldKey, levelN, isBoss) {
    A.init(); if (!A.ctx) return;
    var key = isBoss ? 'boss' : (SCORES[worldKey] ? worldKey : 'ct');
    S = SCORES[key];
    M.world = key; M.boss = !!isBoss;
    M.seed = (levelN || 1) * 7919 + 13;
    var wobble = ((levelN || 1) % 5) - 2;                 // -2..+2
    M.bpm = S.bpm + wobble * 2;
    M.root = S.root * Math.pow(2, (((levelN || 1) % 3) - 1) / 12);
    M.mode = S.mode;
    M.layer = [1, 1, 1, 0];        // drums, hats and the hook are the baseline now
    M.target = Math.max(3, M.target);
    M.step = 0;
    M.next = A.ctx.currentTime + 0.1;
    gen++;                       // any pending stop belongs to an older track
    M.playing = true;
    clearTimeout(M.timer);
    tick();
    var t = A.ctx.currentTime;
    A.musicBus.gain.cancelScheduledValues(t);
    A.musicBus.gain.setValueAtTime(A.musicBus.gain.value, t);
    A.musicBus.gain.linearRampToValueAtTime(A.music ? 1.15 : 0.0001, t + 1.1);
  };

  A.stopMusic = function () {
    if (!A.ctx) { M.playing = false; return; }
    var t = A.ctx.currentTime;
    A.musicBus.gain.cancelScheduledValues(t);
    A.musicBus.gain.setValueAtTime(A.musicBus.gain.value, t);
    A.musicBus.gain.linearRampToValueAtTime(0.0001, t + 0.45);
    var mine = ++gen;
    setTimeout(function () {
      if (mine !== gen) return;          // a new track started; leave it alone
      M.playing = false;
      clearTimeout(M.timer);
    }, 550);
  };

  A.setMusicEnabled = function (on) {
    A.music = on;
    if (!A.ctx) return;
    var t = A.ctx.currentTime;
    A.musicBus.gain.cancelScheduledValues(t);
    A.musicBus.gain.linearRampToValueAtTime(on ? 1.15 : 0.0001, t + 0.35);
  };

  A.setHeat = function (h) { M.target = Math.max(3, Math.min(4, h | 0)); };
  A.energy = function (v) { A.setHeat(1 + Math.round(Math.min(1, v) * 3)); };

  /** The victory cue: a rising IV–V–I with a lead over the top. */
  A.victory = function () {
    A.init(); if (!A.ctx) return;
    var t = A.ctx.currentTime + 0.05, beat = 0.34;
    impact(t, A.sfxBus);
    [[0, 0], [3, 1], [4, 2], [7, 3.2]].forEach(function (p) {
      var deg = p[0], when = t + p[1] * beat;
      [0, 2, 4].forEach(function (d, i) {
        synth({ at: when, freq: note(deg + d, 0), type: 'sawtooth', voices: 5, spread: 18,
          atk: 0.02, hold: beat * 0.7, dur: 0.9, gain: 0.09, cutoff: 2400 + i * 500,
          verb: 0.8, bus: A.sfxBus });
      });
      synth({ at: when, freq: note(deg + 4, 2), type: 'triangle', dur: 0.5, gain: 0.12,
        cutoff: 7000, verb: 0.5, echo: 0.35, bus: A.sfxBus });
    });
    for (var i = 0; i < 4; i++) hat(t + i * beat + beat / 2, i === 3, A.sfxBus, 1);
    clap(t + 3.2 * beat, A.sfxBus, 1);
  };

  /* ═══════════════════ hospital ambience ═══════════════════ */
  var amb = { on: false, nodes: [], timer: null };

  A.setAmbience = function (on) {
    A.ambience = on;
    if (!A.ctx) return;
    if (on) A.startAmbience(); else A.stopAmbience();
  };

  A.startAmbience = function () {
    A.init(); if (!A.ctx || amb.on || !A.ambience) return;
    amb.on = true;
    var t = A.ctx.currentTime;

    var air = A.ctx.createBufferSource();
    air.buffer = noiseBuffer(); air.loop = true;
    var airF = A.ctx.createBiquadFilter();
    airF.type = 'lowpass'; airF.frequency.value = 620; airF.Q.value = 0.6;
    var airG = A.ctx.createGain(); airG.gain.value = 0.05;
    air.connect(airF); airF.connect(airG); airG.connect(A.ambBus);
    air.start(t);

    var hum = A.ctx.createOscillator();
    hum.type = 'sine'; hum.frequency.value = 60;
    var humG = A.ctx.createGain(); humG.gain.value = 0.028;
    var lfo = A.ctx.createOscillator(); lfo.frequency.value = 0.09;
    var lfoG = A.ctx.createGain(); lfoG.gain.value = 0.012;
    lfo.connect(lfoG); lfoG.connect(humG.gain);
    hum.connect(humG); humG.connect(A.ambBus);
    hum.start(t); lfo.start(t);

    amb.nodes = [air, hum, lfo];
    A.ambBus.gain.cancelScheduledValues(t);
    A.ambBus.gain.linearRampToValueAtTime(0.5, t + 2);

    // a distant monitor, never on a predictable beat
    (function beepLoop() {
      amb.timer = setTimeout(function () {
        if (!amb.on) return;
        if (A.ambience && A.isRunning()) {
          synth({ freq: 1046, type: 'sine', dur: 0.09, gain: 0.035, cutoff: 4000,
            verb: 0.5, bus: A.ambBus });
        }
        beepLoop();
      }, 5200 + Math.random() * 9000);
    })();
  };

  A.stopAmbience = function () {
    if (!A.ctx || !amb.on) return;
    amb.on = false;
    clearTimeout(amb.timer);
    var t = A.ctx.currentTime;
    A.ambBus.gain.cancelScheduledValues(t);
    A.ambBus.gain.setValueAtTime(A.ambBus.gain.value, t);
    A.ambBus.gain.linearRampToValueAtTime(0.0001, t + 0.8);
    var dead = amb.nodes; amb.nodes = [];
    setTimeout(function () { dead.forEach(function (n) { try { n.stop(); } catch (e) {} }); }, 1000);
  };

  /* ═══════════════════ sound effects ═══════════════════ */
  var LADDER = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 26, 29, 31];

  A.match = function (chain, size) {
    A.init(); if (!A.ctx) return;
    var f = 330 * Math.pow(2, LADDER[Math.min(chain, LADDER.length - 1)] / 12);
    synth({ freq: f, type: 'triangle', dur: 0.2, gain: 0.24, cutoff: 6000, verb: 0.3, echo: 0.16 });
    synth({ freq: f * 2, type: 'sine', dur: 0.14, gain: 0.1, cutoff: 9000, verb: 0.2 });
    hit({ freq: 4200, sweep: 9000, q: 1.2, dur: 0.07, gain: 0.1, filterType: 'bandpass' });
    if (size >= 5) {
      synth({ freq: f * 1.5, type: 'sawtooth', voices: 3, dur: 0.26, gain: 0.09,
        cutoff: 3200, verb: 0.4, echo: 0.3 });
    }
  };

  A.chainCall = function (chain) {
    A.init();
    var f = 261 * Math.pow(2, Math.min(24, chain * 3) / 12);
    synth({ freq: f, type: 'sawtooth', voices: 4, spread: 20, dur: 0.42, atk: 0.01,
      gain: 0.14, cutoff: 4200, verb: 0.6, echo: 0.3 });
    riser(A.ctx.currentTime, 0.34, A.sfxBus);
  };

  /** A real explosion: sub drop, body, air, and debris. */
  A.special = function () {
    A.init(); if (!A.ctx) return;
    var t = A.ctx.currentTime;
    synth({ at: t, freq: 110, glide: 32, type: 'sine', dur: 0.6, gain: 0.6, cutoff: 700, verb: 0.5 });
    hit({ at: t, freq: 900, sweep: 90, q: 0.6, dur: 0.5, gain: 0.34, filterType: 'lowpass', verb: 0.5 });
    hit({ at: t, freq: 6000, sweep: 1200, q: 0.8, dur: 0.22, gain: 0.2, filterType: 'highpass' });
    for (var i = 0; i < 5; i++) {                                        // debris
      hit({ at: t + 0.08 + Math.random() * 0.3, freq: 2000 + Math.random() * 4000,
        q: 3, dur: 0.05, gain: 0.05, filterType: 'bandpass', verb: 0.4 });
    }
  };

  A.beam = function () {
    A.init(); if (!A.ctx) return;
    var t = A.ctx.currentTime;
    hit({ at: t, freq: 260, sweep: 7000, q: 3.2, dur: 0.34, gain: 0.3, filterType: 'bandpass', verb: 0.35 });
    synth({ at: t, freq: 180, glide: 1400, type: 'sawtooth', voices: 3, dur: 0.3,
      gain: 0.16, cutoff: 5200, echo: 0.3 });
  };

  A.core = function () {
    A.init(); if (!A.ctx) return;
    var t = A.ctx.currentTime;
    [0, 4, 7, 11, 14, 18].forEach(function (s, i) {
      synth({ at: t + i * 0.045, freq: 392 * Math.pow(2, s / 12), type: 'triangle',
        dur: 0.3, gain: 0.13, cutoff: 8000, verb: 0.6, echo: 0.35 });
    });
    A.special();
  };

  A.overread = function () {
    A.init(); if (!A.ctx) return;
    var t = A.ctx.currentTime;
    impact(t, A.sfxBus);
    [0, 4, 7, 12, 16, 19, 24].forEach(function (s, i) {
      synth({ at: t + i * 0.05, freq: 261 * Math.pow(2, s / 12), type: 'sawtooth',
        voices: 5, spread: 22, dur: 0.7, gain: 0.1, cutoff: 5000, verb: 0.8, echo: 0.3 });
    });
    riser(t, 0.7, A.sfxBus);
  };

  A.swap = function () { A.init(); hit({ freq: 900, sweep: 2600, q: 2, dur: 0.07, gain: 0.12, filterType: 'bandpass' }); };
  A.deny = function () { A.init(); synth({ freq: 160, glide: 108, type: 'square', dur: 0.16, gain: 0.13, cutoff: 800, drive: 2 }); };
  A.tap = function () { A.init(); hit({ freq: 2600, q: 4, dur: 0.02, gain: 0.07, filterType: 'bandpass' }); };
  /** Keystroke: a mechanical click with a little body, pitched per key. */
  A.key = function (i) {
    A.init();
    hit({ freq: 2400 + (i % 12) * 90, q: 6, dur: 0.018, gain: 0.09, filterType: 'bandpass' });
    synth({ freq: 320 + (i % 12) * 8, type: 'triangle', dur: 0.035, gain: 0.05, cutoff: 1800 });
  };
  A.ui = function () { A.init(); synth({ freq: 740, type: 'sine', dur: 0.07, gain: 0.09, cutoff: 5000, verb: 0.2 }); };
  A.ping = function () { A.init(); synth({ freq: 1180, type: 'sine', dur: 0.18, gain: 0.11, cutoff: 8000, verb: 0.5, echo: 0.2 }); };
  A.bossHit = function () {
    A.init();
    synth({ freq: 92, glide: 46, type: 'square', dur: 0.24, gain: 0.36, cutoff: 1100, drive: 3 });
    hit({ freq: 1800, sweep: 220, dur: 0.22, gain: 0.22, filterType: 'lowpass', verb: 0.35 });
  };
  A.bossAttack = function () {
    A.init(); if (!A.ctx) return;
    var t = A.ctx.currentTime;
    synth({ at: t, freq: 70, glide: 38, type: 'sawtooth', voices: 3, dur: 0.7, gain: 0.3,
      cutoff: 620, drive: 4, verb: 0.5 });
    hit({ at: t, freq: 700, sweep: 90, dur: 0.65, gain: 0.24, filterType: 'lowpass', verb: 0.5 });
  };
  A.correct = function () {
    A.init();
    [0, 4, 7].forEach(function (s, i) {
      synth({ freq: 523 * Math.pow(2, s / 12), type: 'triangle', dur: 0.26, gain: 0.16,
        cutoff: 7000, verb: 0.4, echo: 0.2, at: A.ctx.currentTime + i * 0.05 });
    });
  };
  A.wrong = function () { A.init(); synth({ freq: 200, glide: 150, type: 'triangle', dur: 0.26, gain: 0.14, cutoff: 1400 }); };
  A.star = function (i) {
    A.init();
    synth({ freq: 523 * Math.pow(2, [0, 4, 7][i] / 12), type: 'triangle', dur: 0.5,
      gain: 0.22, cutoff: 8000, verb: 0.6, echo: 0.25 });
    hit({ freq: 5000, sweep: 12000, q: 1, dur: 0.24, gain: 0.08, filterType: 'bandpass', verb: 0.5 });
  };
  A.cardFlip = function () {
    A.init(); if (!A.ctx) return;
    var t = A.ctx.currentTime;
    hit({ at: t, freq: 500, sweep: 3400, q: 1.1, dur: 0.36, gain: 0.16, filterType: 'bandpass' });
    synth({ at: t + 0.3, freq: 150, glide: 96, type: 'sine', dur: 0.2, gain: 0.24, cutoff: 900 });
    [0, 7, 12].forEach(function (s, i) {
      synth({ at: t + 0.36 + i * 0.055, freq: 880 * Math.pow(2, s / 12), type: 'sine',
        dur: 0.55, gain: 0.1, cutoff: 9000, verb: 0.7, echo: 0.3 });
    });
  };
  A.stamp = function () {
    A.init();
    synth({ freq: 120, glide: 62, type: 'square', dur: 0.16, gain: 0.28, cutoff: 900, drive: 2 });
    hit({ freq: 1400, sweep: 260, dur: 0.16, gain: 0.16, filterType: 'lowpass', verb: 0.3 });
  };
  A.win = function () { A.victory(); };
  A.lose = function () {
    A.init(); if (!A.ctx) return;
    var t = A.ctx.currentTime;
    [0, -3, -8].forEach(function (s, i) {
      synth({ at: t + i * 0.2, freq: 330 * Math.pow(2, s / 12), type: 'sawtooth', voices: 3,
        dur: 0.8, gain: 0.12, cutoff: 1400, verb: 0.6 });
    });
  };

  /* ── a deeper effects bench ─────────────────────────────────────────── */

  /** Tile picked up. */
  A.select = function () {
    A.init();
    synth({ freq: 620, type: 'sine', atk: 0.004, dur: 0.09, gain: 0.11, cutoff: 5000, verb: 0.2 });
    hit({ freq: 3200, q: 5, dur: 0.02, gain: 0.05, filterType: 'bandpass' });
  };
  /** A gem lands after falling. Pitched by how far it fell. */
  A.land = function (distance) {
    A.init();
    var f = 240 - Math.min(90, (distance || 1) * 10);
    synth({ freq: f, type: 'sine', atk: 0.003, dur: 0.07, gain: 0.05, cutoff: 1200 });
  };
  /** Fog burned off a tile. */
  A.fogClear = function () {
    A.init();
    hit({ freq: 900, sweep: 5200, q: 1.4, dur: 0.24, gain: 0.14, filterType: 'bandpass', verb: 0.5 });
  };
  /** Armour cracks. */
  A.armor = function () {
    A.init();
    hit({ freq: 2600, sweep: 700, q: 2.4, dur: 0.1, gain: 0.16, filterType: 'bandpass' });
    synth({ freq: 300, glide: 180, type: 'square', dur: 0.08, gain: 0.1, cutoff: 2200, drive: 2 });
  };
  /** Infection cleaned off a neighbour. */
  A.cleanse = function () {
    A.init();
    synth({ freq: 700, glide: 1300, type: 'sine', atk: 0.006, dur: 0.18, gain: 0.1,
      cutoff: 6000, verb: 0.4, echo: 0.2 });
  };
  /** A case file reaches the bottom. */
  A.deliver = function () {
    A.init(); if (!A.ctx) return;
    var t = A.ctx.currentTime;
    [0, 4, 9].forEach(function (n, i) {
      synth({ at: t + i * 0.06, freq: 523 * Math.pow(2, n / 12), type: 'triangle',
        dur: 0.3, gain: 0.15, cutoff: 7000, verb: 0.5, echo: 0.25 });
    });
    hit({ at: t, freq: 3000, sweep: 8000, q: 1, dur: 0.2, gain: 0.08, filterType: 'bandpass' });
  };
  /** A tool is armed and waiting for a target. */
  A.arm = function () {
    A.init();
    synth({ freq: 420, glide: 880, type: 'sawtooth', voices: 2, atk: 0.006, dur: 0.16,
      gain: 0.12, cutoff: 3400, verb: 0.3 });
  };
  /** A curve ball lands. */
  A.event = function (good) {
    A.init(); if (!A.ctx) return;
    var t = A.ctx.currentTime;
    if (good) {
      [0, 5, 9, 12].forEach(function (n, i) {
        synth({ at: t + i * 0.055, freq: 392 * Math.pow(2, n / 12), type: 'triangle',
          dur: 0.34, gain: 0.14, cutoff: 7000, verb: 0.6, echo: 0.3 });
      });
      riser(t, 0.45, A.sfxBus);
    } else {
      synth({ at: t, freq: 220, glide: 120, type: 'sawtooth', voices: 3, dur: 0.5,
        gain: 0.16, cutoff: 900, drive: 2.5, verb: 0.5 });
      hit({ at: t, freq: 600, sweep: 120, dur: 0.45, gain: 0.16, filterType: 'lowpass', verb: 0.4 });
    }
  };
  /** A level begins. */
  A.levelStart = function () {
    A.init(); if (!A.ctx) return;
    var t = A.ctx.currentTime;
    riser(t, 0.6, A.sfxBus);
    impact(t + 0.6, A.sfxBus);
  };
  /** A rank promotion. */
  A.rankUp = function () {
    A.init(); if (!A.ctx) return;
    var t = A.ctx.currentTime;
    [0, 7, 12, 16, 19].forEach(function (n, i) {
      synth({ at: t + i * 0.08, freq: 330 * Math.pow(2, n / 12), type: 'sawtooth', voices: 4,
        spread: 18, atk: 0.02, hold: 0.1, dur: 0.7, gain: 0.12, cutoff: 5000, verb: 0.8 });
    });
  };
  /** Menu navigation, softer than a gameplay tap. */
  A.nav = function (back) {
    A.init();
    synth({ freq: back ? 520 : 700, glide: back ? 380 : 940, type: 'sine',
      atk: 0.004, dur: 0.11, gain: 0.09, cutoff: 5200, verb: 0.25 });
  };

  /* ═══════════════════ the voice cast ═══════════════════ */
  var VOICE = {}, lastVoiceAt = 0, lastLine = '', loading = false;
  var LINES = {
    crystal: 'Crystal clear scan.',
    cleanread: 'Clean read.',
    diagnosis: 'Diagnosis unlocked!',
    overread: 'Overread! Outstanding.',
    textbook: "That's a textbook acquisition.",
    caseclosed: 'Case closed.',
    critical: 'Critical read. Call it.',
    'tut-welcome': 'Welcome to the reading room.',
    'tut-match': 'Match three to run the scanner.',
    'tut-chain': 'Good. Now chain them together.',
    'marco-1': "Scanner's singing!",
    'marco-2': 'Coils are hot!',
    'marco-3': "Now that's a combo!",
    'rosa-1': "Ooh, that's a clean one!",
    'rosa-2': "Patient's comfortable. Keep it going!",
    'rosa-3': 'Look at that contrast!',
    'kim-1': "I'm writing that one down!",
    'kim-2': 'Textbook cascade!',
    'kim-3': 'Teach me that one!'
  };
  A.LINES = LINES;

  A.loadVoices = function () {
    if (loading || !A.ctx) return;
    loading = true;
    Object.keys(LINES).forEach(function (id) {
      fetch('media/voice/' + id + '.mp3')
        .then(function (r) { return r.ok ? r.arrayBuffer() : Promise.reject(); })
        .then(function (buf) {
          return new Promise(function (res, rej) {
            var p = A.ctx.decodeAudioData(buf, res, rej);      // callback form for old Safari
            if (p && p.then) p.then(res, rej);
          });
        })
        .then(function (audio) { VOICE[id] = audio; })
        .catch(function () {});
    });
  };

  A.say = function (id, opts) {
    opts = opts || {};
    var caption = LINES[id] || '';
    if (!A.voice || !A.ctx || !VOICE[id]) return caption;
    var now = A.ctx.currentTime;
    if (!opts.force && (now - lastVoiceAt < 1.7 || id === lastLine)) return caption;
    lastVoiceAt = now; lastLine = id;
    var src = A.ctx.createBufferSource();
    src.buffer = VOICE[id];
    var g = A.ctx.createGain();
    g.gain.value = opts.gain == null ? 1 : opts.gain;
    src.connect(g); g.connect(A.voiceBus);
    var v = A.ctx.createGain(); v.gain.value = 0.18; g.connect(v); v.connect(A.verbSend);
    src.start(now);
    if (A.music && A.musicBus) {                      // duck the score under the line
      var d = A.musicBus.gain;
      d.cancelScheduledValues(now);
      d.setValueAtTime(d.value, now);
      d.linearRampToValueAtTime(0.3, now + 0.08);
      d.linearRampToValueAtTime(1.15, now + VOICE[id].duration + 0.25);
    }
    return caption;
  };

  A.hasVoice = function (id) { return !!VOICE[id]; };
})(window.RR = window.RR || {});

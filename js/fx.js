/* RADIOLOGY RUSH — pooled particle & juice layer. Allocates once, never mid-frame. */
(function (RR) {
  'use strict';

  var CAP = 420;                       // hard cap; adaptive quality lowers it
  var pool = [], live = 0, texts = [], rings = [];
  var shakeMag = 0, shakeT = 0, flash = null;
  var reduced = false;

  for (var i = 0; i < CAP; i++) pool.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 3, color: '#fff', grav: 900, spin: 0, rot: 0, shape: 0 });

  var FX = {
    cap: CAP,
    setCap: function (n) { FX.cap = Math.max(60, Math.min(CAP, n | 0)); },
    setReduced: function (v) { reduced = !!v; },
    count: function () { return live; }
  };
  RR.fx = FX;

  function spawn() {
    if (live >= FX.cap) {                       // recycle the oldest rather than allocate
      var oldest = null, best = 1e9;
      for (var i = 0; i < pool.length; i++) {
        if (pool[i].on && pool[i].life < best) { best = pool[i].life; oldest = pool[i]; }
      }
      return oldest;
    }
    for (var j = 0; j < pool.length; j++) if (!pool[j].on) { pool[j].on = true; live++; return pool[j]; }
    return null;
  }

  FX.burst = function (x, y, color, n, opts) {
    if (reduced) n = Math.ceil(n * 0.35);
    opts = opts || {};
    for (var i = 0; i < n; i++) {
      var p = spawn(); if (!p) return;
      var a = opts.angle != null ? opts.angle + (Math.random() - 0.5) * (opts.spread || 0.6) : Math.random() * Math.PI * 2;
      var sp = (opts.speed || 180) * (0.45 + Math.random() * 0.9);
      p.on = true;
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - (opts.lift || 60);
      p.max = p.life = (opts.life || 0.65) * (0.6 + Math.random() * 0.7);
      p.size = (opts.size || 5) * (0.5 + Math.random());
      p.color = color; p.grav = opts.grav != null ? opts.grav : 780;
      p.rot = Math.random() * 6.28; p.spin = (Math.random() - 0.5) * 12;
      p.shape = opts.shape || (Math.random() < 0.35 ? 1 : 0);
    }
  };

  FX.text = function (x, y, str, color, opts) {
    opts = opts || {};
    texts.push({ x: x, y: y, str: str, color: color, life: opts.life || 0.95, max: opts.life || 0.95, size: opts.size || 26, vy: opts.vy || -70 });
    if (texts.length > 24) texts.shift();
  };

  FX.ring = function (x, y, color, r0, r1, life) {
    if (reduced) return;
    rings.push({ x: x, y: y, color: color, r0: r0, r1: r1, life: life || 0.5, max: life || 0.5 });
    if (rings.length > 18) rings.shift();
  };

  FX.shake = function (mag) { if (reduced) return; shakeMag = Math.max(shakeMag, mag); shakeT = 0.36; };
  FX.flash = function (color, alpha) { if (reduced) alpha *= 0.4; flash = { color: color, a: alpha, life: 0.32, max: 0.32 }; };

  FX.update = function (dt) {
    var i, p;
    for (i = 0; i < pool.length; i++) {
      p = pool[i]; if (!p.on) continue;
      p.life -= dt;
      if (p.life <= 0) { p.on = false; live--; continue; }
      p.vy += p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.995; p.rot += p.spin * dt;
    }
    for (i = texts.length - 1; i >= 0; i--) {
      texts[i].life -= dt; texts[i].y += texts[i].vy * dt; texts[i].vy *= 0.93;
      if (texts[i].life <= 0) texts.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].life -= dt;
      if (rings[i].life <= 0) rings.splice(i, 1);
    }
    if (shakeT > 0) { shakeT -= dt; if (shakeT <= 0) shakeMag = 0; }
    if (flash) { flash.life -= dt; if (flash.life <= 0) flash = null; }
  };

  FX.shakeOffset = function () {
    if (shakeT <= 0) return [0, 0];
    var k = shakeMag * (shakeT / 0.36);
    return [(Math.random() - 0.5) * k, (Math.random() - 0.5) * k];
  };

  FX.draw = function (ctx) {
    var i, p;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < pool.length; i++) {
      p = pool[i]; if (!p.on) continue;
      var t = p.life / p.max;
      ctx.globalAlpha = Math.max(0, Math.min(1, t));
      ctx.fillStyle = p.color;
      if (p.shape === 1) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 3);
        ctx.restore();
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + t * 0.8), 0, 6.2832); ctx.fill();
      }
    }
    for (i = 0; i < rings.length; i++) {
      var g = rings[i], k = 1 - g.life / g.max;
      ctx.globalAlpha = (1 - k) * 0.7;
      ctx.strokeStyle = g.color; ctx.lineWidth = 3 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r0 + (g.r1 - g.r0) * k, 0, 6.2832); ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    for (i = 0; i < texts.length; i++) {
      var tx = texts[i], a = Math.min(1, tx.life / tx.max * 1.6);
      ctx.globalAlpha = a;
      ctx.font = '800 ' + tx.size + 'px Inter, Avenir Next, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)';
      ctx.strokeText(tx.str, tx.x, tx.y);
      ctx.fillStyle = tx.color; ctx.fillText(tx.str, tx.x, tx.y);
    }
    ctx.restore();
  };

  FX.drawFlash = function (ctx, w, h) {
    if (!flash) return;
    ctx.save();
    ctx.globalAlpha = flash.a * (flash.life / flash.max);
    ctx.fillStyle = flash.color;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };

  FX.clear = function () {
    for (var i = 0; i < pool.length; i++) pool[i].on = false;
    live = 0; texts.length = 0; rings.length = 0; flash = null; shakeMag = 0; shakeT = 0;
  };
})(window.RR = window.RR || {});

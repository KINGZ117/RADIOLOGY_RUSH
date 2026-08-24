/* RADIOLOGY RUSH — game shell: save, screens, map, meta, and the level runtime. */
(function (RR) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var SAVE_KEY = 'radiology-rush-v2';
  var A = RR.audio, FX = RR.fx;

  /* ═══════════════════════ save ═══════════════════════ */
  var DEFAULTS = {
    xp: 0, stars: {}, cards: {}, streak: { date: '', count: 0 }, seenTutorial: false,
    boosters: { shuffle: 2, beam: 1, moves: 2, hammer: 2, row: 1, colour: 1 },
    settings: {
      typing: true, video: true, glyphs: false, contrast: false,
      motion: false, sound: true, music: true, voice: true, ambience: true,
      haptics: true, dys: false, text: 100
    }
  };

  function load() {
    var s;
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { s = {}; }
    var out = JSON.parse(JSON.stringify(DEFAULTS));
    Object.keys(out).forEach(function (k) {
      if (s[k] == null) return;
      if (typeof out[k] === 'object' && !Array.isArray(out[k])) {
        Object.keys(out[k]).forEach(function (k2) { if (s[k][k2] != null) out[k][k2] = s[k][k2]; });
        if (k === 'stars' || k === 'cards') out[k] = s[k];
      } else out[k] = s[k];
    });
    return out;
  }
  var save = load();
  var persist = (function () {
    var t = null;
    return function () {
      clearTimeout(t);
      t = setTimeout(function () {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
      }, 120);
    };
  })();

  /* ═══════════════════════ assets ═══════════════════════ */
  var sprites = {}, spriteCache = {};
  function loadSprites(done) {
    var names = RR.GEMS.map(function (g) { return g.sprite; })
      .concat(['tile-bomb.png', 'tile-prism.png', 'boss-rogue.png', 'boss-wraith.png', 'boss-golem.png']);
    var left = names.length;
    if (!left) return done();
    names.forEach(function (n) {
      var img = new Image();
      img.onload = img.onerror = function () { if (--left === 0) done(); };
      img.src = 'media/sprites/' + n;
      sprites[n] = img;
    });
  }
  /** Sprites are decoded once into an offscreen canvas at tile size, never scaled per frame. */
  function sprite(name, size) {
    var key = name + '@' + size;
    if (spriteCache[key]) return spriteCache[key];
    var img = sprites[name];
    if (!img || !img.width) return null;
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, size, size);
    spriteCache[key] = c;
    return c;
  }

  /* ═══════════════════════ settings ═══════════════════════ */
  function applySettings() {
    var s = save.settings;
    document.body.classList.toggle('contrast', s.contrast);
    document.body.classList.toggle('dys', s.dys);
    var reduced = s.motion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.toggle('reduced', reduced);
    FX.setReduced(reduced);
    document.documentElement.style.setProperty('--text-scale', (s.text / 100).toFixed(2));
    A.on = s.sound; A.voice = s.voice;
    A.setMusicEnabled(s.music);
    A.setAmbience(s.ambience);
    updatePlateVideo();
    persist();
  }

  function bindSettings() {
    var map = { typing: 'set-typing', video: 'set-video', glyphs: 'set-glyphs', contrast: 'set-contrast',
      motion: 'set-motion', sound: 'set-sound', music: 'set-music', voice: 'set-voice',
      ambience: 'set-ambience', haptics: 'set-haptics', dys: 'set-dys' };
    Object.keys(map).forEach(function (k) {
      var el = $(map[k]);
      el.checked = !!save.settings[k];
      el.addEventListener('change', function () {
        save.settings[k] = el.checked;
        applySettings();
        if (k === 'music' && el.checked && current.world) startWorldMusic(current.world);
        A.ui();
      });
    });
    var t = $('set-text');
    t.value = save.settings.text;
    $('set-text-val').textContent = save.settings.text + '%';
    t.addEventListener('input', function () {
      save.settings.text = +t.value;
      $('set-text-val').textContent = t.value + '%';
      applySettings();
    });
    $('set-tutorial').addEventListener('click', function () {
      A.ui();
      save.seenTutorial = false; persist();
      toast('The tutorial will run on your next level.');
    });
    $('set-reset').addEventListener('click', function () {
      if (!confirm('Erase all stars, cards and progress? This cannot be undone.')) return;
      localStorage.removeItem(SAVE_KEY);
      save = load();
      applySettings(); renderMap(); renderGlossary(); refreshTitle();
      toast('Progress erased.');
    });
  }

  /* ═══════════════════════ screens & plate ═══════════════════════ */
  var current = { world: null, screen: 'title' };

  var MENU_WORLD = { key: 'menu', plate: 'plate-menu.jpg', loop: 'menu.mp4', accent: '#3fd8f5' };

  function show(name) {
    if (name !== 'game' && name !== 'result') setPlate(MENU_WORLD, 0);
    if (name !== 'game' && A.isRunning && A.isRunning()) {
      if (save.settings.ambience) A.startAmbience();
    }
    ['title', 'map', 'game', 'result', 'glossary', 'settings'].forEach(function (n) {
      $('screen-' + n).classList.toggle('active', n === name);
    });
    current.screen = name;
    if (name === 'map') renderMap();
    if (name === 'glossary') renderGlossary();
    if (name === 'title') refreshTitle();
  }

  /* Each level gets its own light: a hue shift, a brightness lift and a coloured
     wash, derived from the level number so all 35 look distinct. */
  function applyLevelLook(n, world) {
    var root = document.documentElement.style;
    if (!n) {                                   // menus: the plate as shot
      root.setProperty('--plate-hue', '0deg');
      root.setProperty('--plate-bright', '1.34');
      root.setProperty('--plate-sat', '1.28');
      root.setProperty('--level-wash', 'transparent');
      root.setProperty('--accent', world.accent);
      return;
    }
    var i = (n - 1) % 5;                        // position within its world
    var hue = [-16, -7, 0, 9, 18][i];
    var bright = [1.42, 1.3, 1.5, 1.36, 1.46][i];
    var sat = [1.34, 1.5, 1.22, 1.42, 1.3][i];
    var washes = [
      'rgba(63,216,245,.20)', 'rgba(176,150,248,.20)', 'rgba(255,180,63,.18)',
      'rgba(63,242,200,.18)', 'rgba(255,95,138,.17)'
    ];
    root.setProperty('--plate-hue', hue + 'deg');
    root.setProperty('--plate-bright', String(bright));
    root.setProperty('--plate-sat', String(sat));
    root.setProperty('--level-wash', washes[i]);
    root.setProperty('--accent', world.accent);
  }

  function setPlate(world, lvlN) {
    current.world = world;
    applyLevelLook(lvlN, world);
    RR.plate.setEnabled(!!save.settings.video);
    RR.plate.set('media/plates/' + world.plate, 'media/loops/' + world.loop);
  }
  function updatePlateVideo() {
    RR.plate.setEnabled(!!save.settings.video);
    if (save.settings.video && current.world) setPlate(current.world);
  }
  function startWorldMusic(world, lvl) {
    A.startMusic(world.key, lvl ? lvl.n : 1, !!(lvl && lvl.boss));
  }

  /* ── haptics: real on Android, a no-op on iOS Safari, never an error ── */
  var canBuzz = typeof navigator !== 'undefined' && !!navigator.vibrate;
  function buzz(pattern) {
    if (!canBuzz || !save.settings.haptics) return;
    try { navigator.vibrate(pattern); } catch (e) {}
  }
  RR.canBuzz = canBuzz;

  /* ── the celebration cast ────────────────────────────────────── */
  var CAST = {
    marco: { name: 'Marco', frames: 3, lines: ['marco-1', 'marco-2', 'marco-3'] },
    rosa:  { name: 'Rosa',  frames: 3, lines: ['rosa-1', 'rosa-2', 'rosa-3'] },
    kim:   { name: 'Dr. Kim', frames: 3, lines: ['kim-1', 'kim-2', 'kim-3'] }
  };
  var castKeys = ['marco', 'rosa', 'kim'], castAt = 0, castTimer = null;

  /** Pops a crew member in with a quick celebration. Captioned, so it works muted. */
  /** Reactions, not just celebrations — each one picks a fitting line. */
  var REACTIONS = {
    zone:   ['rosa-4', 'marco-4', 'kim-4'],
    save:   ['marco-5', 'kim-5'],
    boss:   ['kim-6', 'marco-6'],
    low:    ['rosa-5'],
    praise: ['rosa-6', 'kim-5', 'marco-4']
  };

  function react(kind, force) {
    var pool = REACTIONS[kind];
    if (!pool) return cheer(force);
    var line = pool[Math.floor(Math.random() * pool.length)];
    if (!A.hasVoice(line)) return cheer(force);      // fall back if the clip is missing
    cheer(force, line);
  }
  RR.react = react;

  function cheer(force, forcedLine) {
    var now = Date.now();
    if (!force && now - castAt < 4200) return;
    castAt = now;
    var key = castKeys[Math.floor(Math.random() * castKeys.length)];
    var c = CAST[key];
    var frame = 1 + Math.floor(Math.random() * c.frames);
    var line = c.lines[Math.floor(Math.random() * c.lines.length)];
    if (forcedLine) {                                // a reaction names its own line
      var owner = forcedLine.split('-')[0];
      if (CAST[owner]) { key = owner; c = CAST[owner]; frame = 1 + Math.floor(Math.random() * c.frames); }
      line = forcedLine;
    }
    var el = $('cast'), img = $('cast-img'), bubble = $('cast-bubble');
    img.src = 'media/chars/' + key + '-' + frame + '.png';
    img.alt = c.name + ' celebrating';
    bubble.textContent = A.say(line) || '';
    el.classList.toggle('right', Math.random() < 0.5);
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(castTimer);
    castTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function toast(msg) {
    var t = $('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }
  function announce(msg) { $('sr').textContent = msg; }

  /* ═══════════════════════ progression ═══════════════════════ */
  function starsFor(n) { return save.stars[n] || 0; }
  function totalStars() {
    return Object.keys(save.stars).reduce(function (a, k) { return a + save.stars[k]; }, 0);
  }
  function worldUnlocked(w) {
    if (w.id === 1) return true;
    var need = (w.id - 1) * 7;                     // 7 of the previous 15 stars keeps it generous
    return totalStars() >= need;
  }
  function levelUnlocked(l) {
    if (l.n === 1) return true;
    var w = RR.WORLDS[l.world - 1];
    if (!worldUnlocked(w)) return false;
    return starsFor(l.n - 1) > 0 || l.n === (l.world - 1) * 5 + 1;
  }
  function cardState(i) {
    var st = save.cards[i] || (save.cards[i] = { seen: 0, missed: 0, at: 0 });
    if (st.correct == null) st.correct = 0;
    return st;
  }

  var MASTERY = [
    { at: 0, name: 'Collected', tint: '#93a4c2' },
    { at: 2, name: 'Bronze',    tint: '#c8873f' },
    { at: 4, name: 'Silver',    tint: '#c9d6e8' },
    { at: 7, name: 'Gold',      tint: '#ffcf6a' }
  ];
  function masteryOf(i) {
    var st = save.cards[i];
    if (!st) return -1;
    var lvl = 0;
    for (var k = 0; k < MASTERY.length; k++) if ((st.correct || 0) >= MASTERY[k].at) lvl = k;
    return lvl;
  }

  /** Every card you push up a tier pays a booster — learning is the loot table. */
  function creditLearning(i, correct) {
    var st = cardState(i);
    var before = masteryOf(i);
    st.at = Date.now();
    if (correct) { st.seen++; st.correct++; } else { st.missed++; }
    var after = masteryOf(i);
    if (after > before) {
      var tier = MASTERY[after];
      var prize = ['hammer', 'row', 'colour', 'shuffle', 'beam', 'moves'][after % 6];
      save.boosters[prize]++;
      save.xp += 150 * after;
      toast('“' + RR.TERMS[i].word + '” is ' + tier.name + ' now — ' + prize + ' booster earned.');
      A.star(Math.min(2, after - 1));
      FX.text(canvas.width / 2, canvas.height * 0.3, tier.name.toUpperCase() + ' · ' + RR.TERMS[i].word,
        tier.tint, { size: 26 });
      buzz([24, 50, 24]);
      cheer();
    }
    persist();
    return after;
  }

  /** Specialty badges: five mastered terms in a field earns it. */
  function badges() {
    var by = {};
    RR.TERMS.forEach(function (t, i) {
      var field = t.specialty.split(' ')[0];
      by[field] = by[field] || { total: 0, mastered: 0 };
      by[field].total++;
      if (masteryOf(i) >= 1) by[field].mastered++;
    });
    return Object.keys(by).map(function (k) {
      return { field: k, mastered: by[k].mastered, total: by[k].total, earned: by[k].mastered >= 5 };
    }).sort(function (a, b) { return b.mastered - a.mastered; });
  }
  RR.badges = badges;

  function refreshTitle() {
    var rank = RR.rankFor(save.xp);
    $('title-rank').textContent = rank.name + ' · ' + totalStars() + ' stars · ' +
      Object.keys(save.cards).length + '/' + RR.TERMS.length + ' case cards' +
      (save.streak.count > 1 ? ' · ' + save.streak.count + '-day streak' : '');
  }

  /* ═══════════════════════ world map ═══════════════════════ */
  function renderMap() {
    var rank = RR.rankFor(save.xp);
    $('map-rank').textContent = rank.name + ' · ' + save.xp.toLocaleString() + ' XP';
    $('map-stars').textContent = '★ ' + totalStars() + ' / ' + (RR.LEVELS.length * 3);
    var host = $('map-scroll');
    host.innerHTML = '';
    RR.WORLDS.forEach(function (w) {
      var unlocked = worldUnlocked(w);
      var el = document.createElement('div');
      el.className = 'world' + (unlocked ? '' : ' locked');
      el.style.setProperty('--w-accent', w.accent);
      var head = '<div class="world-head"><h3>' + w.name + '</h3>' +
        '<span class="dept">' + w.dept + '</span>' +
        '<p class="blurb">' + (unlocked ? w.blurb : 'Locked — earn ' + ((w.id - 1) * 7) + ' stars to open this department.') + '</p></div>';
      var nodes = '<div class="nodes">';
      RR.LEVELS.filter(function (l) { return l.world === w.id; }).forEach(function (l) {
        var st = starsFor(l.n), open = unlocked && levelUnlocked(l);
        nodes += '<button class="node' + (l.type === 'boss' ? ' boss' : '') + '" data-level="' + l.n + '"' +
          (open ? '' : ' disabled') + '><b>' + l.n + '</b><small>' + l.type + '</small>' +
          '<span class="ns">' + '★★★'.slice(0, st) + '☆☆☆'.slice(0, 3 - st) + '</span></button>';
      });
      nodes += '</div>';
      el.innerHTML = head + nodes;
      host.appendChild(el);
    });
    host.querySelectorAll('.node').forEach(function (b) {
      b.addEventListener('click', function () { A.ui(); startLevel(+b.dataset.level, { coop: false }); });
    });
  }

  /* ═══════════════════════ case cards ═══════════════════════ */
  function renderGlossary() {
    var host = $('glossary-grid');
    host.innerHTML = '';

    // the badge shelf sits above the cards — the reason to keep answering
    var shelf = document.createElement('div');
    shelf.className = 'badge-shelf';
    badges().forEach(function (b) {
      var pct = Math.round(b.mastered / b.total * 100);
      shelf.innerHTML += '<div class="badge' + (b.earned ? ' earned' : '') + '">' +
        '<b>' + b.field + '</b>' +
        '<div class="badge-bar"><i style="width:' + pct + '%"></i></div>' +
        '<small>' + b.mastered + '/' + b.total + ' mastered' + (b.earned ? ' · earned' : '') + '</small>' +
        '</div>';
    });
    host.appendChild(shelf);

    var owned = 0, mastered = 0;
    RR.TERMS.forEach(function (t, i) {
      var st = save.cards[i];
      if (st) owned++;
      var m = masteryOf(i);
      if (m >= 1) mastered++;
      var tier = m >= 0 ? MASTERY[m] : null;
      var el = document.createElement('div');
      el.className = 'gcard' + (st ? '' : ' locked') + (m >= 1 ? ' m' + m : '');
      el.innerHTML =
        '<span class="spec">' + t.specialty + '</span>' +
        (tier ? '<span class="tier" style="color:' + tier.tint + '">' + tier.name + '</span>' : '') +
        '<h4>' + (st ? t.word : '— — —') + '</h4>' +
        '<p>' + (st ? t.definition : 'Play the level that teaches this card to unlock it.') + '</p>' +
        (st ? '<p class="case-example">' + t.example + '</p>' +
          '<div class="seen">correct ' + (st.correct || 0) + '× · missed ' + st.missed + '×' +
          (m < 3 ? ' · ' + Math.max(0, MASTERY[m + 1].at - (st.correct || 0)) + ' to ' + MASTERY[m + 1].name : '') +
          '</div>' : '');
      host.appendChild(el);
    });
    $('glossary-count').textContent = owned + ' / ' + RR.TERMS.length + ' collected · ' + mastered + ' mastered';
  }

  /* ═══════════════════════ daily: Morning Rounds ═══════════════════════ */
  function todayKey() { return new Date().toISOString().slice(0, 10); }
  function startDaily() {
    var t = todayKey();
    if (save.streak.date !== t) {
      var yest = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      save.streak.count = (save.streak.date === yest) ? save.streak.count + 1 : 1;
      save.streak.date = t;
      persist();
    }
    // built from the cards you have missed most, then the ones you have seen least recently
    var deck = RR.TERMS.map(function (t2, i) { return { i: i, s: save.cards[i] }; })
      .sort(function (a, b) {
        var am = a.s ? a.s.missed : 0, bm = b.s ? b.s.missed : 0;
        if (am !== bm) return bm - am;
        var aa = a.s ? a.s.at : 0, ba = b.s ? b.s.at : 0;
        return aa - ba;
      }).slice(0, 8).map(function (x) { return x.i; });
    startLevel(1 + ((new Date().getDate() * 3) % RR.LEVELS.length), { coop: false, daily: true, deck: deck });
    toast('Morning Rounds · day ' + save.streak.count + ' of your streak');
  }

  /* ═══════════════════════ level runtime ═══════════════════════ */
  var L = null;                       // the live level
  var canvas = $('board'), ctx = canvas.getContext('2d');
  var TILE = 90, PAD = 6, DPR = 1;

  function fitCanvas() {
    // the board is sized in JS so it can never overlap the HUD or the booster tray
    var wrap = document.getElementById('board-wrap');
    var box = wrap.getBoundingClientRect();
    var css = Math.max(240, Math.min(box.width, box.height, 720));
    canvas.style.width = css + 'px';
    canvas.style.height = css + 'px';
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(css * DPR);
    canvas.height = Math.round(css * DPR);
    TILE = canvas.width / RR.SIZE;
    spriteCache = {};                 // re-decode sprites at the new tile size, once
  }
  window.addEventListener('resize', function () { if (current.screen === 'game') fitCanvas(); });

  function view(r, c) { return L.view[r][c]; }

  function startLevel(n, opts) {
    opts = opts || {};
    var def = RR.LEVELS[n - 1];
    if (!def) return;
    var world = RR.WORLDS[def.world - 1];
    setPlate(world, n);
    FX.clear();
    shownScore = 0;
    zone = 0; zonePeaked = false; applyZone();

    L = {
      def: def, world: world, n: n,
      board: new RR.Board({ seed: (n * 7919 + (opts.daily ? new Date().getDate() * 131 : 0)) | 0 }),
      moves: def.moves, score: 0, chain: 0, mult: 1, bonusMoves: 0, bonusWindow: 0,
      phase: 'idle', sel: null, cursor: { r: 4, c: 4 }, armed: null,
      collected: {}, fogCleared: 0, filesDelivered: 0,
      zoneShown: 0,
      sinceEvent: 0, eventMult: 1, eventMoves: 0, pendingBlast: null,
      dying: [], anim: 0, animDur: 0, next: null,
      view: [], daily: !!opts.daily, deck: opts.deck || null,
      coop: opts.coop ? { on: true, turn: 1, m1: 0, m2: 0 } : { on: false },
      boss: null, staggered: {}, promptOpen: false, over: false,
      cardIndex: (n - 1) % RR.TERMS.length
    };
    for (var r = 0; r < RR.SIZE; r++) {
      L.view[r] = [];
      for (var c = 0; c < RR.SIZE; c++) L.view[r][c] = { dx: 0, dy: 0, sc: 1 };
    }

    if (def.type === 'fog') seedFog(def.target + 10);   // more fog than the goal needs, so it stays reachable
    if (def.type === 'boss') {
      var b = RR.BOSSES[def.boss];
      L.boss = {
        def: b, hp: def.target, max: def.target, weak: RR.GEMS[(def.world + 1) % 6].id,
        movesSince: 0, weakSince: 0, rage: 0
      };
    }

    $('boss-bar').hidden = !L.boss;
    $('coop-bar').hidden = !L.coop.on;
    if (L.boss) {
      $('boss-portrait').src = 'media/sprites/' + L.boss.def.sprite;
      $('boss-name').textContent = L.boss.def.name;
      $('boss-rule').textContent = L.boss.def.rule;
    }
    startWorldMusic(world, L);
    if (save.settings.ambience) A.startAmbience();
    show('game');
    fitCanvas();
    requestAnimationFrame(fitCanvas);
    if (!save.seenTutorial && !L.coop.on) setTimeout(tutStart, 450);
    syncHUD();
    A.levelStart();
    banner(def.type === 'boss' ? L.boss.def.name : world.name);
    announce('Level ' + n + '. ' + RR.OBJECTIVE_TEXT(def) + '. ' + L.moves + ' moves.');
    canvas.focus();
  }

  function seedFog(count) {
    var placed = 0, guard = 0;
    while (placed < count && guard++ < 4000) {
      var r = L.board.rnd(RR.SIZE), c = L.board.rnd(RR.SIZE);
      if (!L.board.grid[r][c].fog) { L.board.grid[r][c].fog = true; placed++; }
    }
  }

  function banner(text, tier) {
    var el = $('board-banner');
    el.textContent = text;
    el.className = '';
    void el.offsetWidth;
    el.className = 'show tier' + (tier || 1);
  }

  var shownScore = 0;

  /** Numbers that tick up read as earned; numbers that snap read as arbitrary. */
  function rollScore(dt) {
    if (!L) return;
    if (shownScore === L.score) return;
    var gap = L.score - shownScore;
    var stepSize = Math.max(1, Math.abs(gap) * Math.min(1, dt * 7));
    shownScore = gap > 0 ? Math.min(L.score, shownScore + stepSize)
                         : Math.max(L.score, shownScore - stepSize);
    var el = $('hud-score');
    el.textContent = Math.round(shownScore).toLocaleString();
    el.classList.toggle('ticking', Math.abs(L.score - shownScore) > 1);
  }

  function syncHUD() {
    if (!L) return;
    $('hud-world').textContent = L.world.name + ' · Level ' + L.n + (L.daily ? ' · Morning Rounds' : '');
    $('hud-objective').textContent = RR.OBJECTIVE_TEXT(L.def);
    $('hud-moves').textContent = L.moves;
    if (Math.abs(L.score - shownScore) > 4000) shownScore = L.score;   // never lag far behind
    $('hud-combo').textContent = '×' + Math.round(L.mult * 10) / 10;
    var heat = Math.max(0, Math.min(1, (L.chain || 0) / 8));
    $('hud-heat').style.width = (heat * 100) + '%';
    $('hud-combo-wrap').classList.toggle('hot', heat >= 0.5);
    $('hud-progress-bar').style.width = Math.min(100, goalProgress() * 100) + '%';
    ['shuffle', 'beam', 'moves', 'hammer', 'row', 'colour'].forEach(function (k) {
      $('bst-' + k + '-n').textContent = save.boosters[k];
      $('bst-' + k).disabled = save.boosters[k] <= 0 || L.phase !== 'idle';
    });
    $('bst-dictate').disabled = !save.settings.typing || L.phase !== 'idle';
    if (L.boss) {
      $('boss-hp-fill').style.width = Math.max(0, L.boss.hp / L.boss.max * 100) + '%';
      $('boss-weak').textContent = 'weak to ' + RR.GEM_INDEX[L.boss.weak].name;
    }
    if (L.coop.on) {
      $('coop-turn').textContent = 'Player ' + L.coop.turn + "'s read";
      $('coop-m1').style.width = Math.min(100, L.coop.m1) + '%';
      $('coop-m2').style.width = Math.min(100, L.coop.m2) + '%';
    }
  }

  function goalProgress() {
    var d = L.def;
    switch (d.type) {
      case 'score':   return L.score / d.target;
      case 'collect': return (L.collected[d.gem] || 0) / d.target;
      case 'fog':     return L.fogCleared / d.target;
      case 'files':   return L.filesDelivered / d.target;
      case 'boss':    return 1 - L.boss.hp / L.boss.max;
    }
    return 0;
  }
  function goalMet() { return goalProgress() >= 1; }

  /* ── swapping ───────────────────────────────────────────── */
  function trySwap(r, c, r2, c2) {
    if (L.phase !== 'idle' || L.over) return;
    if (TUT.on && TUT.block) return;
    if (TUT.on && TUT.gate) {
      var g = TUT.gate;
      var same = (g.r === r && g.c === c && g.r2 === r2 && g.c2 === c2) ||
                 (g.r === r2 && g.c === c2 && g.r2 === r && g.c2 === c);
      if (!same) { A.deny(); toast('Swap the two highlighted gems.'); return; }
      TUT.gate = null;
      $('tut-hole').classList.remove('pulse');
    }
    if (!L.board.canSwap(r, c, r2, c2)) {
      A.deny();
      var v = view(r, c);
      v.dx = (c2 - c) * 8; v.dy = (r2 - r) * 8;
      L.phase = 'unswap'; L.anim = 0; L.animDur = 0.10; L.next = { r: r, c: c, r2: r2, c2: c2 };
      return;
    }
    A.swap();
    L.board.swap(r, c, r2, c2);
    var a = view(r, c), b = view(r2, c2);
    a.dx = (c2 - c) * TILE; a.dy = (r2 - r) * TILE;
    b.dx = (c - c2) * TILE; b.dy = (r - r2) * TILE;
    L.sel = null;
    L.phase = 'swap'; L.anim = 0; L.animDur = 0.10;
    L.next = { r: r, c: c, r2: r2, c2: c2 };
  }

  function afterSwap() {
    var s = L.next;
    var A1 = L.board.grid[s.r][s.c], B1 = L.board.grid[s.r2][s.c2];
    spendMove();
    if (A1.special || B1.special) {
      var cells = [], seen = {};
      // core + gem: the core takes the other tile's colour and detonates every copy
      if (A1.special === 'core' && !B1.special) { A1.gem = B1.gem; }
      if (B1.special === 'core' && !A1.special) { B1.gem = A1.gem; }
      if (A1.special === 'core' && B1.special === 'core') {
        for (var r = 0; r < RR.SIZE; r++) for (var c = 0; c < RR.SIZE; c++) cells.push([r, c]);
        A.core();
      } else {
        if (A1.special) L.board.blastCells(s.r, s.c, cells, seen);
        if (B1.special) L.board.blastCells(s.r2, s.c2, cells, seen);
        // beam + beam clears the full cross
        if (A1.special === 'beam' && B1.special === 'beam') {
          for (var i = 0; i < RR.SIZE; i++) { cells.push([s.r, i]); cells.push([i, s.c]); }
        }
        // beam + bolus widens the beam to three lanes
        if ((A1.special === 'beam' && B1.special === 'bolus') ||
            (A1.special === 'bolus' && B1.special === 'beam')) {
          var dir = (A1.special === 'beam' ? A1.dir : B1.dir);
          for (var k = 0; k < RR.SIZE; k++) for (var off = -1; off <= 1; off++) {
            if (dir === 'h') cells.push([s.r + off, k]); else cells.push([k, s.c + off]);
          }
          banner('WIDE BEAM', 3);
        }
        // bolus + bolus is a five-wide detonation
        if (A1.special === 'bolus' && B1.special === 'bolus') {
          for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++) {
            cells.push([s.r + dr, s.c + dc]);
          }
          banner('DOUBLE BOLUS', 3);
        }
        A.special();
      }
      FX.shake(14);
      applyClears(cells, []);
      return;
    }
    L.chain = 0;
    resolveMatches({ r: s.r, c: s.c, r2: s.r2, c2: s.c2 });
  }

  function spendMove() {
    L.moves--;
    L.touchedCols = {};
    if (L.eventMoves > 0 && --L.eventMoves === 0) L.eventMult = 1;                 // files only sink in columns the player actually cleared
    if (L.bonusWindow > 0) L.bonusWindow--;
    if (L.boss) {
      L.boss.movesSince++;
      L.boss.weakSince++;
      if (L.boss.weakSince >= 4) {
        L.boss.weakSince = 0;
        L.boss.weak = RR.GEMS[L.board.rnd(6)].id;
        FX.text(canvas.width / 2, TILE * 0.6, 'WEAKNESS: ' + RR.GEM_INDEX[L.boss.weak].name.toUpperCase(),
          RR.GEM_INDEX[L.boss.weak].glow, { size: 22 });
      }
    }
    if (L.coop.on) L.coop.turn = L.coop.turn === 1 ? 2 : 1;
    if (L.moves === 4 && !L.warnedLow) { L.warnedLow = true; react('low', true); }
    syncHUD();
  }

  /* ── the cascade ────────────────────────────────────────── */
  function resolveMatches(origin) {
    var groups = L.board.findMatches();
    if (!groups.length) { endCascade(); return; }
    L.chain++;
    var cells = [], seen = {}, makes = [];
    groups.forEach(function (g) {
      var sp = RR.specialFor(g);
      var at = null;
      if (sp) {
        at = g.cells[0];
        if (origin) {                                   // the special lands under the player's finger
          for (var i = 0; i < g.cells.length; i++) {
            var p = g.cells[i];
            if ((p[0] === origin.r && p[1] === origin.c) || (p[0] === origin.r2 && p[1] === origin.c2)) { at = p; break; }
          }
        }
        makes.push({ r: at[0], c: at[1], type: sp.type, dir: sp.dir || 'h', gem: g.gem });
      }
      g.cells.forEach(function (p) { L.board.blastCells(p[0], p[1], cells, seen); });
    });
    applyClears(cells, makes);
  }

  /** Deep chains resolve faster and faster — the board runs away with you. */
  function chainSpeed(base) {
    return Math.max(base * 0.55, base - (L.chain - 1) * 0.018);
  }

  function applyClears(cells, makes) {
    // SURGE — from the third link on, the scanner overdrives and detonates a
    // free burst of its own, so long chains visibly snowball.
    if (L.chain >= 3 && L.chain % 2 === 1 && cells.length) {
      var sr = L.board.rnd(RR.SIZE), sc = L.board.rnd(RR.SIZE), extra = [], seenS = {};
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
        L.board.blastCells(sr + dr, sc + dc, extra, seenS);
      }
      cells = cells.concat(extra);
      A.beam();
      FX.ring(sc * TILE + TILE / 2, sr * TILE + TILE / 2, '#ffcf6a', TILE * 0.3, TILE * 3.4, 0.45);
      FX.burst(sc * TILE + TILE / 2, sr * TILE + TILE / 2, '#ffcf6a', 26, { speed: 320, size: 5 });
      punch = Math.max(punch, 0.05);
      var wrap = document.getElementById('board-wrap');
      wrap.classList.remove('surge'); void wrap.offsetWidth; wrap.classList.add('surge');
      clearTimeout(surgeTimer);
      surgeTimer = setTimeout(function () { wrap.classList.remove('surge'); }, 600);
    }
    var res = L.board.clearCells(cells);
    if (!res.cleared.length && !res.armor.length) { endCascade(); return; }

    var mult = Math.min(8, Math.max(1, L.chain)) * (L.bonusWindow > 0 ? 1.5 : 1) * (L.eventMult || 1);
    L.mult = mult;
    var gain = Math.round(res.gems * 60 * mult);
    L.score += gain;
    if (L.coop.on) coopCharge(gain);

    Object.keys(res.collected).forEach(function (k) {
      L.collected[k] = (L.collected[k] || 0) + res.collected[k];
    });
    L.fogCleared += res.fog;

    // boss damage: only the weakness modality hurts it, and it is always shown on screen
    if (L.boss) {
      var w = res.collected[L.boss.weak] || 0;
      if (w) {
        var dmg = Math.round(w * 9 * Math.min(3, mult) * (L.boss.dbl ? 2 : 1));
        var wasAbove = L.boss.hp / L.boss.max > 0.35;
        L.boss.hp = Math.max(0, L.boss.hp - dmg);
        if (wasAbove && L.boss.hp / L.boss.max <= 0.35) react('boss');
        L.boss.dbl = false;
        A.bossHit(); FX.shake(10);
        FX.text(canvas.width / 2, TILE * 1.4, '−' + dmg, '#ff8a8a', { size: 30 });
      }
    }

    // visuals for everything that just happened
    res.cleared.forEach(function (cell) {
      if (L.touchedCols) L.touchedCols[cell.c] = true;
      var g = RR.GEMS[cell.gem];
      L.dying.push({ r: cell.r, c: cell.c, gem: cell.gem, special: cell.special, t: 0 });
      FX.burst(cell.c * TILE + TILE / 2, cell.r * TILE + TILE / 2, g ? g.glow : '#fff',
        cell.special ? 22 : 9, { speed: cell.special ? 320 : 190, size: 4.5 });
    });
    res.armor.forEach(function (p) {
      FX.burst(p[1] * TILE + TILE / 2, p[0] * TILE + TILE / 2, '#dfe9ff', 8, { speed: 150, size: 3 });
    });
    if (res.armor.length) A.armor();
    if (res.fog) A.fogClear();
    if (res.cleaned && res.cleaned.length) A.cleanse();
    if (L.chain >= 2) {
      FX.text(canvas.width / 2, canvas.height * 0.42, '×' + Math.round(mult * 10) / 10, '#ffcf6a', { size: 34 + L.chain * 3 });
    }
    comboCall(L.chain);
    feedZone(L.chain, res.gems);
    A.match(L.chain, res.gems);
    A.setHeat(1 + Math.min(3, Math.floor(L.chain / 2)));   // the music grows with the streak
    buzz(L.chain >= 5 ? [18, 40, 26] : Math.min(30, 8 + L.chain * 4));
    FX.ring(canvas.width / 2, canvas.height / 2, L.world.accent, TILE * 0.4, TILE * 4.2, 0.5);

    L.makes = makes || [];
    L.phase = 'clear'; L.anim = 0; L.animDur = chainSpeed(0.15);
    syncHUD();
  }

  function afterClear() {
    (L.makes || []).forEach(function (m) {
      var cell = L.board.grid[m.r][m.c];
      cell.gem = m.gem; cell.special = m.type; cell.dir = m.dir;
      cell.fog = false; cell.blur = false; cell.infected = false;
      FX.ring(m.c * TILE + TILE / 2, m.r * TILE + TILE / 2, '#fff', TILE * 0.2, TILE * 1.4, 0.45);
    });
    L.makes = [];
    L.dying.length = 0;

    var inFlight = 0;
    for (var fr = 0; fr < RR.SIZE; fr++) for (var fc = 0; fc < RR.SIZE; fc++) if (L.board.grid[fr][fc].file) inFlight++;
    var fileChance = (L.def.type === 'files' && inFlight < 4) ? 0.14 : 0;
    var out = L.board.collapse({ fileChance: fileChance });
    L.filesDelivered += out.delivered;
    if (out.delivered) {
      A.deliver();
      FX.text(canvas.width / 2, canvas.height - TILE * 0.6, 'CASE FILE DELIVERED', '#4ce6a4', { size: 22 });
    }
    out.falls.forEach(function (f) { view(f.to, f.c).dy = -(f.to - f.from) * TILE; });
    out.spawns.forEach(function (s) { view(s.r, s.c).dy = -(s.r + 1.5) * TILE; });
    L.phase = 'fall'; L.anim = 0; L.animDur = chainSpeed(0.17);
  }

  function endCascade() {
    if (TUT.on && !TUT.gate && !TUT.block) setTimeout(tutNext, 420);
    L.chain = 0; L.mult = L.bonusWindow > 0 ? 1.5 : 1;
    A.energy(0.1);
    syncHUD();

    if (L.boss && L.boss.hp <= 0) return finish(true);
    if (goalMet()) return finish(true);

    if (L.boss) {
      var stage = L.boss.hp / L.boss.max;
      if (stage <= 0.5 && !L.staggered.half) { L.staggered.half = true; return stagger(); }
      if (stage <= 0.2 && !L.staggered.low) { L.staggered.low = true; return stagger(); }
      if (L.boss.movesSince >= 3) { L.boss.movesSince = 0; return bossAct(); }
    }

    if (L.def.type === 'files') sinkFiles();
    if (L.moves <= 0) return finish(false);
    if (maybeCurveball()) return;
    if (!L.board.hasMove()) {
      toast('No moves left on the board — reshuffling.');
      L.board.shuffle();
      FX.flash('#3fd8f5', .2);
    }
    L.phase = 'idle';
    syncHUD();
  }

  /** A case file sinks one row when you clear something in its column. Clear beneath it. */
  function sinkFiles() {
    for (var r = RR.SIZE - 2; r >= 0; r--) {
      for (var c = 0; c < RR.SIZE; c++) {
        var here = L.board.grid[r][c], below = L.board.grid[r + 1][c];
        if (!here.file || below.file || below.special) continue;
        if (!L.touchedCols || !L.touchedCols[c]) continue;
        L.board.grid[r][c] = below; L.board.grid[r + 1][c] = here;
        view(r + 1, c).dy = -TILE; view(r, c).dy = TILE;
      }
    }
    var delivered = 0;
    for (var cc = 0; cc < RR.SIZE; cc++) {
      var bottom = L.board.grid[RR.SIZE - 1][cc];
      if (bottom.file) {
        bottom.file = false; bottom.gem = L.board.rnd(6);
        delivered++;
        FX.burst(cc * TILE + TILE / 2, canvas.height - TILE / 2, '#4ce6a4', 26, { speed: 260, size: 5 });
      }
    }
    if (delivered) {
      L.filesDelivered += delivered;
      A.deliver();
      FX.text(canvas.width / 2, canvas.height - TILE * 0.8, 'CASE FILE DELIVERED', '#4ce6a4', { size: 24 });
      announce('Case file delivered. ' + L.filesDelivered + ' of ' + L.def.target + '.');
      if (goalMet()) { syncHUD(); return finish(true); }
    }
  }

  /* ── THE ZONE ─────────────────────────────────────────────────────────
     A single 0-1 number that rises as you string matches together and decays
     when you stop. It drives the music filter, the plate lighting, the particle
     budget and how often the crew lean in. Purely additive: if it stays at 0
     the game behaves exactly as it did before. */
  var zone = 0, zonePeaked = false;

  function feedZone(chain, cleared) {
    var gain = 0.06 + Math.min(0.28, chain * 0.05) + Math.min(0.08, cleared * 0.008);
    zone = Math.min(1, zone + gain);
    if (zone >= 0.999 && !zonePeaked) {
      zonePeaked = true;
      A.zonePeak();
      banner('IN THE ZONE', 4);
      FX.flash('#ffcf6a', 0.22);
      buzz([30, 40, 30, 40, 50]);
      react('zone', true);
      announce('In the zone.');
    }
  }

  function decayZone(dt) {
    if (zone <= 0) return;
    zone = Math.max(0, zone - dt * 0.11);          // ~9 s from full to cold
    if (zone < 0.5) zonePeaked = false;
  }

  /** Push the zone out to everything that listens to it. */
  function applyZone() {
    A.setZone(zone);
    var root = document.documentElement.style;
    root.setProperty('--zone', zone.toFixed(3));
    FX.setCap(Math.round(180 + zone * 240));
    var wrap = document.getElementById('board-wrap');
    if (wrap) wrap.classList.toggle('zoned', zone > 0.55);
    var bar = $('hud-zone');
    if (bar) bar.style.width = (zone * 100) + '%';
  }

  /* ── curve balls: the shift throws something at you every few moves ──
     Mostly generous, occasionally awkward. Always announced, never silent. */
  var CURVEBALLS = [
    { id: 'code-blue', name: 'CODE BLUE', tier: 3, good: true,
      say: 'Code blue — every point counts double for three moves.',
      run: function () { L.eventMult = 2; L.eventMoves = 3; } },
    { id: 'surge', name: 'POWER SURGE', tier: 2, good: true,
      say: 'Power surge — a tile just charged itself into a beam.',
      run: function () {
        var r = L.board.rnd(RR.SIZE), c = L.board.rnd(RR.SIZE), cell = L.board.grid[r][c];
        if (cell.file) return;
        cell.special = 'beam'; cell.dir = Math.random() < 0.5 ? 'h' : 'v';
        cell.infected = false; cell.blur = false;
        FX.ring(c * TILE + TILE / 2, r * TILE + TILE / 2, '#fff', TILE * 0.2, TILE * 2, 0.5);
      } },
    { id: 'spill', name: 'CONTRAST SPILL', tier: 2, good: true,
      say: 'Contrast spill — four tiles just changed type.',
      run: function () {
        var want = L.def.gem ? RR.GEM_INDEX[L.def.gem].i : L.board.rnd(6);
        for (var k = 0; k < 4; k++) {
          var r = L.board.rnd(RR.SIZE), c = L.board.rnd(RR.SIZE), cell = L.board.grid[r][c];
          if (cell.special || cell.file) continue;
          cell.gem = want;
          FX.burst(c * TILE + TILE / 2, r * TILE + TILE / 2, RR.GEMS[want].glow, 10, { speed: 160 });
        }
      } },
    { id: 'stat', name: 'STAT ORDER', tier: 3, good: true,
      say: 'Stat order — one row cleared for you.',
      run: function () {
        var r = L.board.rnd(RR.SIZE), cells = [], seen = {};
        for (var i = 0; i < RR.SIZE; i++) L.board.blastCells(r, i, cells, seen);
        L.pendingBlast = cells;
      } },
    { id: 'second', name: 'SECOND OPINION', tier: 2, good: true,
      say: 'Second opinion — two moves back on the board.',
      run: function () { L.moves += 2; } },
    { id: 'storm', name: 'ARTIFACT STORM', tier: 1, good: false,
      say: 'Artifact storm — three tiles just fogged over.',
      run: function () {
        for (var k = 0; k < 3; k++) {
          var r = L.board.rnd(RR.SIZE), c = L.board.rnd(RR.SIZE);
          L.board.grid[r][c].fog = true;
          FX.burst(c * TILE + TILE / 2, r * TILE + TILE / 2, '#bcd7ff', 8, { speed: 140 });
        }
      } },
    { id: 'shift', name: 'SHIFT CHANGE', tier: 1, good: false,
      say: 'Shift change — the whole board just turned over.',
      run: function () { L.board.shuffle(); }
    }
  ];

  function maybeCurveball() {
    if (!L || L.over || L.tutorialGate) return false;
    if (TUT.on) return false;
    L.sinceEvent = (L.sinceEvent || 0) + 1;
    if (L.sinceEvent < 5) return false;
    if (L.board.rng() < 0.45) return false;              // not every window fires
    L.sinceEvent = 0;
    // three good ones for every awkward one
    var pool = CURVEBALLS.filter(function (e) { return e.good; });
    if (L.board.rng() < 0.25) pool = CURVEBALLS.filter(function (e) { return !e.good; });
    var ev = pool[Math.floor(L.board.rng() * pool.length)];
    ev.run();
    banner(ev.name, ev.tier);
    toast(ev.say);
    A.event(ev.good);
    FX.flash(ev.good ? '#4ce6a4' : '#ff9a5a', 0.16);
    buzz(ev.good ? [18, 40, 18] : 40);
    announce(ev.name + '. ' + ev.say);
    syncHUD();
    if (L.pendingBlast) {
      var cells = L.pendingBlast; L.pendingBlast = null;
      L.chain = 0;
      applyClears(cells, []);
      return true;                                        // the cascade takes over
    }
    return false;
  }

  /* ── combo calls: the escalation ladder ─────────────────────── */
  var punch = 0, surgeTimer = null;
  var COMBO_CALLS = [
    { at: 2, text: 'NICE',               tier: 1 },
    { at: 3, text: 'CRYSTAL CLEAR SCAN', tier: 2, voice: 'crystal' },
    { at: 4, text: 'CLEAN READ',         tier: 2, voice: 'cleanread' },
    { at: 5, text: 'DIAGNOSIS UNLOCKED', tier: 3, voice: 'diagnosis', cheer: true },
    { at: 6, text: 'TEXTBOOK',           tier: 3, voice: 'textbook' },
    { at: 7, text: 'SPECTACULAR READ',   tier: 3 },
    { at: 8, text: 'OVERREAD',           tier: 4, voice: 'overread', cheer: true }
  ];

  function comboCall(chain) {
    var call = null;
    for (var i = 0; i < COMBO_CALLS.length; i++) if (COMBO_CALLS[i].at === chain) call = COMBO_CALLS[i];
    if (!call) return;
    banner(call.text, call.tier);
    punch = Math.max(punch, 0.03 + call.tier * 0.022);
    if (call.tier >= 3) FX.flash(call.tier === 4 ? '#ffcf6a' : '#8ff4ff', 0.12 + call.tier * 0.05);
    A.chainCall(chain);
    if (call.voice) A.say(call.voice);
    if (call.cheer) cheer();
    if (chain === 8) {
      var wrap = document.getElementById('board-wrap');
      wrap.classList.remove('overread'); void wrap.offsetWidth; wrap.classList.add('overread');
      setTimeout(function () { wrap.classList.remove('overread'); }, 1200);
      A.overread();
      L.bonusWindow = Math.max(L.bonusWindow, 2);
      FX.shake(20);
      buzz([30, 50, 30, 50, 60]);
    }
    announce(call.text);
  }

  /* ═══════════════════════ tutorial ═══════════════════════
     Seven short beats, taught on a live board. Every beat either explains one
     thing or asks for one action, and the board is only unlocked when it asks. */
  var TUT = { on: false, i: 0, gate: null, block: false, steps: [] };

  function rectOf(sel) {
    var el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return null;
    var b = el.getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width, h: b.height };
  }

  function cellRect(r, c, r2, c2) {
    var b = canvas.getBoundingClientRect();
    var t = b.width / RR.SIZE;
    var x0 = Math.min(c, c2 == null ? c : c2), y0 = Math.min(r, r2 == null ? r : r2);
    var x1 = Math.max(c, c2 == null ? c : c2) + 1, y1 = Math.max(r, r2 == null ? r : r2) + 1;
    return { x: b.left + x0 * t, y: b.top + y0 * t, w: (x1 - x0) * t, h: (y1 - y0) * t };
  }

  function buildSteps() {
    return [
      { label: 'The reading room', voice: 'tut-welcome', place: 'bottom',
        text: 'You are the resident on shift. You run the scanner by <b>matching three or more</b> modality gems — CT, MRI, X-ray, ultrasound, tracer and contrast.' },

      { label: 'Your goal', target: function () { return rectOf('.hud-objective'); }, place: 'bottom',
        text: 'Every level has <b>one goal</b>, written here, with a progress bar underneath it. Nothing else on screen matters more than that line.' },

      { label: 'Moves, not clocks', target: function () { return rectOf('#hud-moves').w ? rectOf('#hud-moves') : null; }, place: 'bottom',
        text: 'You are never racing a timer. You spend <b>moves</b> — one per swap. Take as long as you like on each one.' },

      { label: 'Make a match', gate: true, place: 'bottom', voice: 'tut-match',
        text: 'Your turn. <b>Swap the two highlighted gems</b> — drag one into the other, or tap one then the other.' },

      { label: 'Chains', voice: 'tut-chain', place: 'bottom',
        text: 'When gems clear, everything above <b>falls into the gap</b> — and if that makes a new match, you get a <b>chain</b>. Each link multiplies your score, the music adds a layer, and from the third link the scanner starts detonating bursts of its own.' },

      { label: 'Power-ups', place: 'bottom',
        text: 'Match <b>4 in a line</b> to forge a <b>Collimator Beam</b> (clears a row or column). <b>5 in an L</b> makes a <b>Contrast Bolus</b> (3×3 blast). <b>5 in a line</b> makes a <b>Recon Core</b> — swap it with any gem to vaporise every gem of that colour.' },

      { label: 'Your kit', target: function () { return rectOf('.boosters'); }, place: 'top',
        text: 'Earned, never bought. <b>Injection</b> reshuffles the board, <b>Windowing</b> charges any tile into a beam, <b>Second Read</b> adds three moves — and <b>Dictate</b> asks you to name a term for +3 moves and a ×1.5 window. A wrong answer costs you nothing.' },

      { label: 'You are on', place: 'bottom',
        text: 'That is the whole game. Clear the artifact, read the case, and the case card is yours.' }
    ];
  }

  function tutStart() {
    TUT.on = true; TUT.i = 0; TUT.gate = null; TUT.steps = buildSteps();
    $('tutorial').hidden = false;
    tutShow();
  }

  function tutShow() {
    var step = TUT.steps[TUT.i];
    if (!step) return tutEnd();
    var card = $('tut-card'), hole = $('tut-hole');
    $('tut-step').textContent = 'Step ' + (TUT.i + 1) + ' of ' + TUT.steps.length + ' · ' + step.label;
    $('tut-text').innerHTML = step.text;
    card.classList.toggle('top', step.place === 'top');

    if (step.gate) {
      // find a real legal swap on the live board and ask for exactly that one
      var mv = L.board.findMove();
      while (mv && mv.special) mv = null;
      if (!mv) { TUT.i++; return tutShow(); }
      TUT.gate = mv; TUT.block = false;
      var rc = cellRect(mv.r, mv.c, mv.r2, mv.c2);
      hole.style.cssText = 'left:' + (rc.x - 6) + 'px;top:' + (rc.y - 6) + 'px;width:' + (rc.w + 12) + 'px;height:' + (rc.h + 12) + 'px';
      hole.classList.add('pulse');
      $('tut-next').hidden = true;
    } else {
      TUT.gate = null; TUT.block = true;
      $('tut-next').hidden = false;
      var t = step.target && step.target();
      if (t) {
        hole.style.cssText = 'left:' + (t.x - 8) + 'px;top:' + (t.y - 8) + 'px;width:' + (t.w + 16) + 'px;height:' + (t.h + 16) + 'px';
        hole.classList.remove('pulse');
      } else {
        hole.style.cssText = 'left:50%;top:50%;width:0;height:0';
        hole.classList.remove('pulse');
      }
    }
    if (step.voice) A.say(step.voice, { force: true });
    A.ping();
    announce(step.label + '. ' + $('tut-text').textContent);
  }

  function tutNext() {
    TUT.i++;
    if (TUT.i >= TUT.steps.length) return tutEnd();
    tutShow();
  }

  function tutEnd() {
    TUT.on = false; TUT.block = false; TUT.gate = null;
    $('tutorial').hidden = true;
    save.seenTutorial = true; persist();
    banner('YOUR SHIFT STARTS', 2);
    A.ui();
  }

  /* ── bosses ─────────────────────────────────────────────── */
  function bossAct() {
    var b = L.boss, g = L.board.grid, hits = [];
    A.bossAttack(); FX.shake(18); FX.flash(b.def.color, .22);
    $('boss-bar').classList.add('stagger');
    setTimeout(function () { $('boss-bar').classList.remove('stagger'); }, 700);

    if (b.def.id === 'rogue') {
      for (var k = 0; k < 2; k++) {
        var r = L.board.rnd(RR.SIZE), c = L.board.rnd(RR.SIZE);
        if (!g[r][c].special && !g[r][c].file) { g[r][c].infected = true; hits.push([r, c]); }
      }
      banner('INFECTION');
    } else if (b.def.id === 'wraith') {
      var r0 = L.board.rnd(RR.SIZE - 2), c0 = L.board.rnd(RR.SIZE - 2);
      for (var dr = 0; dr < 3; dr++) for (var dc = 0; dc < 3; dc++) {
        var cell = g[r0 + dr][c0 + dc];
        if (!cell.special) { cell.blur = true; hits.push([r0 + dr, c0 + dc]); }
      }
      banner('MOTION BLUR');
    } else {
      for (var m = 0; m < 3; m++) {
        var rr = L.board.rnd(RR.SIZE), cc = L.board.rnd(RR.SIZE);
        if (!g[rr][cc].special && !g[rr][cc].file) { g[rr][cc].armor = 1; hits.push([rr, cc]); }
      }
      banner('ARMORED');
    }
    hits.forEach(function (p) {
      FX.burst(p[1] * TILE + TILE / 2, p[0] * TILE + TILE / 2, b.def.color, 12, { speed: 200, size: 4 });
    });
    toast(b.def.taunt[L.board.rnd(b.def.taunt.length)]);
    announce(b.def.name + ' attacks.');
    L.phase = 'boss'; L.anim = 0; L.animDur = 0.32;
  }

  function stagger() {
    banner('CRITICAL READ', 4);
    A.say('critical', { force: true });
    buzz([40, 60, 40]);
    FX.flash('#fff', .3); A.overread();
    if (save.settings.typing) { openDictation('critical'); }
    else {
      L.boss.dbl = true;
      toast('The boss staggers — your next match deals double damage.');
      L.phase = 'idle'; syncHUD();
    }
  }

  /* ── dictation (typing mode) ─────────────────────────────── */
  var dict = { term: null, kind: null };

  function pickTerm() {
    if (L && L.deck && L.deck.length) return RR.TERMS[L.deck[L.board.rnd(L.deck.length)]];
    var owned = Object.keys(save.cards).map(Number);
    if (owned.length && Math.random() < 0.65) {
      owned.sort(function (a, b) { return (save.cards[b].missed || 0) - (save.cards[a].missed || 0); });
      return RR.TERMS[owned[Math.floor(Math.random() * Math.min(6, owned.length))]];
    }
    return RR.TERMS[L ? L.cardIndex : Math.floor(Math.random() * RR.TERMS.length)];
  }

  function openDictation(kind) {
    dict.term = pickTerm();
    dict.kind = kind;
    L.phase = 'prompt';
    $('dict-kicker').textContent = kind === 'critical' ? 'Critical read — name it' : 'Dictation';
    $('dict-def').textContent = dict.term.definition;
    $('dict-hint').textContent = dict.term.specialty + ' · ' + dict.term.word.length + ' letters';
    var input = $('dict-input');
    input.value = ''; input.className = '';
    $('dictation').hidden = false;
    setTimeout(function () { input.focus(); }, 30);
    announce('Dictation. ' + dict.term.definition);
  }

  function normalise(s) { return (s || '').toLowerCase().replace(/[^a-z]/g, ''); }

  function submitDictation() {
    var input = $('dict-input');
    var ok = normalise(input.value) === normalise(dict.term.word);
    var st = cardState(dict.term.i);
    if (ok) {
      save.xp += 120;
      creditLearning(dict.term.i, true);
      input.className = 'good';
      A.correct();
      L.moves += 3; L.bonusWindow = 3;
      FX.flash('#4ce6a4', .18);
      if (dict.kind === 'critical' && L.boss) {
        var dmg = Math.round(L.boss.max * 0.22);
        L.boss.hp = Math.max(0, L.boss.hp - dmg);
        FX.text(canvas.width / 2, canvas.height / 2, 'CRITICAL −' + dmg, '#ff8a8a', { size: 40 });
        A.bossHit(); FX.shake(22);
      }
      toast('“' + dict.term.word + '” — correct. +3 moves, ×1.5 for three moves.');
      buzz([20, 40, 20]);
      react('praise');
    } else {
      creditLearning(dict.term.i, false);
      input.className = 'bad';
      A.wrong();
      toast('It was “' + dict.term.word + '”. No penalty — it goes in tomorrow\'s Morning Rounds.');
      if (dict.kind === 'critical' && L.boss) { L.boss.dbl = true; }
    }
    persist();
    setTimeout(closeDictation, ok ? 420 : 900);
  }

  function closeDictation() {
    $('dictation').hidden = true;
    if (!L || L.over) return;
    if (L.boss && L.boss.hp <= 0) return finish(true);
    if (goalMet()) return finish(true);
    if (L.moves <= 0) return finish(false);
    L.phase = 'idle';
    syncHUD();
    canvas.focus();
  }

  /* ── boosters ────────────────────────────────────────────── */
  var ARMED_HINT = {
    beam:   'Windowing armed — pick a tile to charge it into a beam.',
    hammer: 'Aspirator armed — pick any tile to remove it. Costs no move.',
    row:    'Scanogram armed — pick a tile to clear its whole row.',
    colour: 'Protocol call armed — pick a tile to clear every gem of that type.'
  };

  function useBooster(kind) {
    if (!L || L.phase !== 'idle') return;
    if (kind !== 'dictate' && save.boosters[kind] <= 0) return;
    if (ARMED_HINT[kind]) {                       // targeted tools arm, then wait for a tap
      var was = L.armed;
      document.querySelectorAll('.booster').forEach(function (b) { b.classList.remove('armed'); });
      L.armed = (was === kind) ? null : kind;
      if (L.armed) {
        $('bst-' + kind).classList.add('armed');
        toast(ARMED_HINT[kind]);
        A.arm();
      }
      return;
    }
    if (kind === 'shuffle') {
      save.boosters.shuffle--; L.board.shuffle();
      A.special(); FX.flash(L.world.accent, .2); banner('CONTRAST INJECTION');
    } else if (kind === 'moves') {
      save.boosters.moves--; L.moves += 3;
      A.correct(); FX.text(canvas.width / 2, canvas.height / 2, '+3 MOVES', '#4ce6a4', { size: 34 });
    } else if (kind === 'dictate') {
      openDictation('bonus'); return;
    }
    persist(); syncHUD();
  }

  function applyArmed(r, c) {
    var cell = L.board.grid[r][c];
    if (!cell || cell.gem < 0) return;
    var kind = L.armed;
    L.armed = null;
    document.querySelectorAll('.booster').forEach(function (b) { b.classList.remove('armed'); });

    if (kind === 'beam') {
      if (cell.file) return;
      save.boosters.beam--;
      cell.special = 'beam'; cell.dir = Math.random() < 0.5 ? 'h' : 'v';
      cell.infected = false; cell.blur = false;
      A.special();
      FX.ring(c * TILE + TILE / 2, r * TILE + TILE / 2, '#fff', TILE * 0.2, TILE * 1.6, 0.5);
    } else if (kind === 'hammer') {
      save.boosters.hammer--;
      A.beam(); buzz(18);
      FX.burst(c * TILE + TILE / 2, r * TILE + TILE / 2, '#dfe9ff', 20, { speed: 260, size: 5 });
      L.chain = 0;
      applyClears([[r, c]], []);                 // free: costs no move
      persist(); syncHUD();
      return;
    } else if (kind === 'row') {
      save.boosters.row--;
      var cells = [], seen = {};
      for (var i = 0; i < RR.SIZE; i++) L.board.blastCells(r, i, cells, seen);
      A.beam(); FX.shake(12); buzz([16, 30, 16]);
      banner('SCANOGRAM', 2);
      L.chain = 0;
      applyClears(cells, []);
      persist(); syncHUD();
      return;
    } else if (kind === 'colour') {
      save.boosters.colour--;
      var gem = cell.gem, all = [], seen2 = {};
      for (var rr = 0; rr < RR.SIZE; rr++) for (var cc = 0; cc < RR.SIZE; cc++) {
        if (L.board.grid[rr][cc].gem === gem && !L.board.grid[rr][cc].file) {
          L.board.blastCells(rr, cc, all, seen2);
        }
      }
      A.core(); FX.flash(RR.GEMS[gem].glow, 0.2); FX.shake(14); buzz([20, 40, 20]);
      banner('PROTOCOL CALL', 3);
      L.chain = 0;
      applyClears(all, []);
      persist(); syncHUD();
      return;
    }
    persist(); syncHUD();
  }

  /* ── input ───────────────────────────────────────────────── */
  function cellFromEvent(e) {
    var rect = canvas.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width * RR.SIZE;
    var y = (e.clientY - rect.top) / rect.height * RR.SIZE;
    var c = Math.floor(x), r = Math.floor(y);
    if (r < 0 || c < 0 || r >= RR.SIZE || c >= RR.SIZE) return null;
    return { r: r, c: c };
  }

  var drag = null;
  canvas.addEventListener('pointerdown', function (e) {
    A.resume();
    if (!L || L.phase !== 'idle') return;
    var p = cellFromEvent(e); if (!p) return;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* Safari can refuse capture; the swap still works */ }
    if (L.armed) { applyArmed(p.r, p.c); return; }
    drag = { r: p.r, c: p.c, x: e.clientX, y: e.clientY };
    L.cursor = { r: p.r, c: p.c };
    buzz(8);
    if (L.sel && (Math.abs(L.sel.r - p.r) + Math.abs(L.sel.c - p.c) === 1)) {
      trySwap(L.sel.r, L.sel.c, p.r, p.c);
    } else {
      L.sel = (L.sel && L.sel.r === p.r && L.sel.c === p.c) ? null : p;
      A.select();
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag || !L || L.phase !== 'idle') return;
    var rect = canvas.getBoundingClientRect();
    var tilePx = rect.width / RR.SIZE;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    // a flick of a third of a tile commits the swap — no need to land on the neighbour
    if (Math.max(Math.abs(dx), Math.abs(dy)) < tilePx * 0.33) return;
    var r2 = drag.r, c2 = drag.c;
    if (Math.abs(dx) > Math.abs(dy)) c2 += dx > 0 ? 1 : -1; else r2 += dy > 0 ? 1 : -1;
    if (r2 < 0 || c2 < 0 || r2 >= RR.SIZE || c2 >= RR.SIZE) { drag = null; return; }
    trySwap(drag.r, drag.c, r2, c2);
    drag = null; L.sel = null;
  });
  window.addEventListener('pointerup', function () { drag = null; });

  canvas.addEventListener('keydown', function (e) {
    if (!L) return;
    var k = e.key, cur = L.cursor;
    var moved = false;
    if (k === 'ArrowUp') { cur.r = Math.max(0, cur.r - 1); moved = true; }
    if (k === 'ArrowDown') { cur.r = Math.min(RR.SIZE - 1, cur.r + 1); moved = true; }
    if (k === 'ArrowLeft') { cur.c = Math.max(0, cur.c - 1); moved = true; }
    if (k === 'ArrowRight') { cur.c = Math.min(RR.SIZE - 1, cur.c + 1); moved = true; }
    if (moved) {
      e.preventDefault();
      if (L.sel && (Math.abs(L.sel.r - cur.r) + Math.abs(L.sel.c - cur.c) === 1)) {
        trySwap(L.sel.r, L.sel.c, cur.r, cur.c);
        L.sel = null;
      } else {
        var cell = L.board.grid[cur.r][cur.c];
        announce(RR.GEMS[cell.gem] ? RR.GEMS[cell.gem].name : 'empty');
      }
      return;
    }
    if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      if (L.armed) { applyArmed(cur.r, cur.c); return; }
      L.sel = (L.sel && L.sel.r === cur.r && L.sel.c === cur.c) ? null : { r: cur.r, c: cur.c };
      A.ui();
      announce(L.sel ? 'Selected. Move to a neighbour and press space to swap.' : 'Deselected.');
    }
    if (k === 'Escape') {
      L.sel = null; L.armed = null;
      document.querySelectorAll('.booster').forEach(function (b) { b.classList.remove('armed'); });
    }
  });

  /* ── the frame ───────────────────────────────────────────── */
  var last = 0, frameAvg = 16.7, slowFor = 0;

  function tick(now) {
    requestAnimationFrame(tick);
    if (!last) last = now;
    var frameMs = now - last;
    var dt = Math.min(0.05, frameMs / 1000);
    last = now;
    if (frameMs > 0) frameAvg += (Math.min(120, frameMs) - frameAvg) * 0.05;
    frame(dt);
  }

  /** One simulation step. Split out from tick so it can be driven deterministically. */
  function frame(dt) {
    adapt(dt);
    if (current.screen !== 'game' || !L) return;

    // phase timers
    if (L.animDur > 0) {
      L.anim += dt;
      var k = Math.min(1, L.anim / L.animDur);
      var ease = 1 - Math.pow(1 - k, 3);
      for (var r = 0; r < RR.SIZE; r++) for (var c = 0; c < RR.SIZE; c++) {
        var v = L.view[r][c];
        v.dx *= (1 - ease * 0.35); v.dy *= (1 - ease * 0.35);
        if (k >= 1) { v.dx = 0; v.dy = 0; }
      }
      L.dying.forEach(function (d) { d.t = k; });
      if (k >= 1) {
        L.animDur = 0; L.anim = 0;
        var ph = L.phase;
        if (ph === 'swap') afterSwap();
        else if (ph === 'unswap') { L.phase = 'idle'; L.sel = null; }
        else if (ph === 'clear') afterClear();
        else if (ph === 'fall') resolveMatches(null);
        else if (ph === 'boss') { L.phase = 'idle'; if (L.moves <= 0) finish(false); syncHUD(); }
      }
    }
    if (punch > 0) punch = Math.max(0, punch - dt * 0.9);
    decayZone(dt);
    applyZone();
    rollScore(dt);
    FX.update(dt);
    render();
  }

  function adapt(dt) {
    if (frameAvg > 22) FX.setCap(Math.max(80, FX.cap - 6));
    else if (frameAvg < 18) FX.setCap(Math.min(420, FX.cap + 2));
    if (frameAvg > 28) {
      slowFor += dt;
      if (slowFor > 2 && save.settings.video) {
        save.settings.video = false; $('set-video').checked = false;
        applySettings();
        toast('Frames were slipping, so the video plates paused. Re-enable them in Settings.');
      }
    } else slowFor = Math.max(0, slowFor - dt);
    var chip = $('fps-chip');
    if (chip && current.screen === 'settings') chip.textContent = Math.round(1000 / Math.max(1, frameAvg)) + ' fps · ' + FX.count() + ' particles';
  }

  /* ── rendering ───────────────────────────────────────────── */
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function render() {
    var W = canvas.width, H = canvas.height, S = RR.SIZE;
    ctx.clearRect(0, 0, W, H);
    var off = FX.shakeOffset();
    ctx.save();
    ctx.translate(off[0], off[1]);
    if (punch > 0.001) {                       // a short zoom kick on big chains
      var k = 1 + punch;
      ctx.translate(W / 2, H / 2); ctx.scale(k, k); ctx.translate(-W / 2, -H / 2);
    }

    // slots
    for (var r = 0; r < S; r++) for (var c = 0; c < S; c++) {
      var x = c * TILE, y = r * TILE;
      ctx.fillStyle = ((r + c) & 1) ? 'rgba(255,255,255,.030)' : 'rgba(255,255,255,.016)';
      roundRect(x + 3, y + 3, TILE - 6, TILE - 6, TILE * 0.18);
      ctx.fill();
    }

    // tiles
    for (r = 0; r < S; r++) for (c = 0; c < S; c++) {
      var cell = L.board.grid[r][c];
      if (cell.gem < 0 && !cell.file) continue;
      drawTile(cell, r, c, L.view[r][c], 1, 1);
    }

    // dying tiles
    L.dying.forEach(function (d) {
      var t = d.t, cell = { gem: d.gem, special: d.special, fog: false, armor: 0, infected: false, blur: false, file: false };
      drawTile(cell, d.r, d.c, { dx: 0, dy: 0 }, 1 - t, 1 + t * 0.45);
    });

    // selection + keyboard cursor
    if (L.sel) outline(L.sel.r, L.sel.c, '#ffffff', 3.5, true);
    if (document.activeElement === canvas) outline(L.cursor.r, L.cursor.c, L.world.accent, 2.5, false);

    FX.draw(ctx);
    ctx.restore();
    FX.drawFlash(ctx, W, H);
  }

  function outline(r, c, color, w, glow) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = w * DPR;
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 18 * DPR; }
    roundRect(c * TILE + 4, r * TILE + 4, TILE - 8, TILE - 8, TILE * 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function drawTile(cell, r, c, v, alpha, scale) {
    var size = Math.round(TILE * 0.86);
    var cx = c * TILE + TILE / 2 + (v.dx || 0);
    var cy = r * TILE + TILE / 2 + (v.dy || 0);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    if (scale !== 1) ctx.scale(scale, scale);

    if (cell.file) {                                   // a case file, drawn not sprited
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      roundRect(-size * 0.32, -size * 0.4, size * 0.64, size * 0.8, size * 0.08);
      ctx.shadowColor = '#4ce6a4'; ctx.shadowBlur = 22 * DPR; ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(20,40,60,.55)';
      for (var i = 0; i < 4; i++) ctx.fillRect(-size * 0.22, -size * 0.24 + i * size * 0.14, size * 0.44, size * 0.045);
      ctx.restore();
      return;
    }

    var gem = RR.GEMS[cell.gem];
    var name = cell.special === 'core' ? 'tile-prism.png'
      : cell.special ? 'tile-bomb.png'
      : (gem ? gem.sprite : null);
    var img = name && sprite(name, size);
    if (cell.blur) ctx.globalAlpha = alpha * 0.45;
    if (img) {
      if (cell.special) { ctx.shadowColor = gem ? gem.glow : '#fff'; ctx.shadowBlur = 26 * DPR; }
      if (cell.blur) { ctx.drawImage(img, -size / 2 - size * 0.12, -size / 2, size, size); }
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.shadowBlur = 0;
    } else if (gem) {
      ctx.fillStyle = gem.color;
      roundRect(-size / 2, -size / 2, size, size, size * 0.24);
      ctx.fill();
    }

    if (cell.special === 'beam') {                     // direction is readable at a glance
      ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 3 * DPR;
      ctx.beginPath();
      if (cell.dir === 'h') { ctx.moveTo(-size * 0.46, 0); ctx.lineTo(size * 0.46, 0); }
      else { ctx.moveTo(0, -size * 0.46); ctx.lineTo(0, size * 0.46); }
      ctx.stroke();
    }
    if (cell.armor > 0) {
      ctx.strokeStyle = 'rgba(226,236,255,.95)'; ctx.lineWidth = 5 * DPR;
      roundRect(-size / 2, -size / 2, size, size, size * 0.22); ctx.stroke();
      ctx.fillStyle = 'rgba(200,220,255,.18)'; ctx.fill();
    }
    if (cell.fog) {
      ctx.fillStyle = 'rgba(190,215,255,.30)';
      roundRect(-TILE * 0.46, -TILE * 0.46, TILE * 0.92, TILE * 0.92, TILE * 0.18); ctx.fill();
      ctx.strokeStyle = 'rgba(230,240,255,.55)'; ctx.lineWidth = 2 * DPR;
      ctx.setLineDash([6 * DPR, 5 * DPR]); ctx.stroke(); ctx.setLineDash([]);
    }
    if (cell.infected) {
      var pulse = 0.5 + 0.5 * Math.sin(performance.now() / 260);
      ctx.fillStyle = 'rgba(255,60,190,' + (0.42 + pulse * 0.26) + ')';
      roundRect(-TILE * 0.46, -TILE * 0.46, TILE * 0.92, TILE * 0.92, TILE * 0.18); ctx.fill();
      ctx.strokeStyle = 'rgba(255,150,225,' + (0.7 + pulse * 0.3) + ')';
      ctx.lineWidth = 4 * DPR; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.font = '900 ' + Math.round(size * 0.34) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('✕', 0, 0);
    }
    if (save.settings.glyphs && gem && !cell.special) {
      ctx.globalAlpha = alpha * 0.95;
      ctx.font = '800 ' + Math.round(size * 0.26) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(6,10,18,.72)';
      ctx.beginPath(); ctx.arc(size * 0.3, -size * 0.3, size * 0.17, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(gem.glyph, size * 0.3, -size * 0.28);
    }
    ctx.restore();
  }

  /* ── co-op charge: your combo powers your partner, never yourself ── */
  function coopCharge(gain) {
    var key = L.coop.turn === 1 ? 'm1' : 'm2';         // turn has already passed to the partner
    L.coop[key] = Math.min(100, L.coop[key] + gain / 40);
    if (L.coop[key] >= 100) {
      L.coop[key] = 0;
      var pick = ['shuffle', 'beam', 'moves'][L.board.rnd(3)];
      save.boosters[pick]++;
      persist();
      toast('Player ' + L.coop.turn + ' charged the attending meter — booster earned.');
      A.correct();
    }
  }

  /* ── end of level ────────────────────────────────────────── */
  function finish(win) {
    if (L.over) return;
    L.over = true; L.phase = 'over';
    A.stopMusic();

    var stars = 0;
    if (win) { L.def.star.forEach(function (th) { if (L.score >= th) stars++; }); stars = Math.max(1, stars); }

    var prev = starsFor(L.n);
    if (stars > prev) { save.stars[L.n] = stars; }
    var xpGain = Math.round(L.score / 10) + stars * 120 + (win ? 200 : 40);
    var rankBefore = RR.rankFor(save.xp);
    save.xp += xpGain;

    var card = RR.TERMS[L.cardIndex];
    var st = cardState(L.cardIndex);
    if (win) { st.seen++; st.at = Date.now(); }
    var bonusCard = null;
    if (win && stars === 3) {                     // perfect read: a second card
      for (var bi = 0; bi < RR.TERMS.length; bi++) {
        var idx = (L.cardIndex + 1 + bi) % RR.TERMS.length;
        if (!save.cards[idx]) { bonusCard = idx; cardState(idx).at = Date.now(); break; }
      }
    }
    if (win && stars === 3) save.boosters[['shuffle', 'beam', 'moves'][L.n % 3]]++;
    persist();

    // fill the result card
    $('result-kicker').textContent = win ? (L.def.type === 'boss' ? 'Boss defeated' : 'Level complete') : 'Out of moves';
    $('result-title').textContent = L.world.name + ' · Level ' + L.n;
    $('result-score').textContent = L.score.toLocaleString();
    $('case-term').textContent = card.word;
    $('case-def').textContent = card.definition;
    $('case-example').textContent = card.example;
    $('result-case').style.display = win ? '' : 'none';
    $('case-inner').classList.remove('flipped');
    document.querySelector('.result-card').classList.toggle('gold', win && stars === 3);

    var rank = RR.rankFor(save.xp);
    if (rankBefore && rank.name !== rankBefore.name) {
      setTimeout(function () {
        A.rankUp();
        toast('Promoted — you are ' + rank.name + ' now.');
        cheer(true);
      }, 1400);
    }
    var next = RR.RANKS[RR.RANKS.indexOf(rank) + 1];
    var pct = next ? (save.xp - rank.xp) / (next.xp - rank.xp) * 100 : 100;
    $('result-rank').textContent = rank.name + ' · +' + xpGain + ' XP';
    if (bonusCard != null) {
      setTimeout(function () {
        toast('Perfect read — bonus case card: “' + RR.TERMS[bonusCard].word + '”');
        A.ping();
      }, 1800);
    }
    $('result-next').disabled = !win || L.n >= RR.LEVELS.length;

    var starEls = $('result-stars').children;
    for (var i = 0; i < 3; i++) starEls[i].classList.remove('on');
    $('result-xp').style.width = '0%';

    show('result');
    if (win) A.win(); else A.lose();
    buzz(win ? [26, 60, 26, 60, 40] : 60);

    // 1. stars punch in on the rising stinger
    for (var s = 0; s < stars; s++) {
      (function (idx) {
        setTimeout(function () {
          starEls[idx].classList.add('on');
          A.star(idx);
          buzz(18);
        }, 300 + idx * 260);
      })(s);
    }
    // 2. then, and only then, the card turns over
    var cardAt = 320 + stars * 260;
    if (win) {
      setTimeout(function () {
        A.cardFlip();
        $('case-inner').classList.add('flipped');
        setTimeout(function () { A.stamp(); buzz(22); }, 620);
      }, cardAt);
      setTimeout(function () { A.say('caseclosed'); cheer(true); }, cardAt + 900);
    }
    // 3. the XP bar fills last, so the eye is never split
    setTimeout(function () { $('result-xp').style.width = pct + '%'; }, cardAt + (win ? 1250 : 300));
    announce((win ? 'Level complete. ' : 'Out of moves. ') + stars + ' stars. ' + L.score + ' points. Case card: ' + card.word);
    FX.clear();
  }

  /* ── wiring ──────────────────────────────────────────────── */
  var coopPending = false;

  function wire() {
    $('btn-play').addEventListener('click', function () { coopPending = false; A.ui(); show('map'); });
    $('btn-coop').addEventListener('click', function () {
      coopPending = true; A.ui(); show('map');
      toast('Co-op · Double Read: pick a level. Players alternate turns and charge each other.');
    });
    $('btn-daily').addEventListener('click', function () { A.ui(); startDaily(); });
    $('btn-glossary').addEventListener('click', function () { A.ui(); show('glossary'); });
    $('btn-settings').addEventListener('click', function () { A.ui(); show('settings'); });
    document.querySelectorAll('[data-nav]').forEach(function (b) {
      b.addEventListener('click', function () { A.nav(true); show(b.dataset.nav); });
    });
    $('btn-quit').addEventListener('click', function () { A.stopMusic(); L = null; show('map'); });

    $('result-map').addEventListener('click', function () { A.ui(); show('map'); });
    $('result-retry').addEventListener('click', function () { A.ui(); startLevel(L.n, { coop: L.coop.on }); });
    $('result-next').addEventListener('click', function () { A.ui(); startLevel(Math.min(RR.LEVELS.length, L.n + 1), { coop: L.coop.on }); });

    $('bst-shuffle').addEventListener('click', function () { useBooster('shuffle'); });
    $('bst-beam').addEventListener('click', function () { useBooster('beam'); });
    $('bst-moves').addEventListener('click', function () { useBooster('moves'); });
    $('bst-hammer').addEventListener('click', function () { useBooster('hammer'); });
    $('bst-row').addEventListener('click', function () { useBooster('row'); });
    $('bst-colour').addEventListener('click', function () { useBooster('colour'); });
    $('bst-dictate').addEventListener('click', function () { useBooster('dictate'); });

    $('tut-next').addEventListener('click', function () { A.ui(); tutNext(); });
    $('tut-skip').addEventListener('click', function () { A.ui(); tutEnd(); toast('Tutorial skipped — replay it any time in Settings.'); });
    window.addEventListener('resize', function () { if (TUT.on) tutShow(); });

    $('dict-go').addEventListener('click', submitDictation);
    $('dict-skip').addEventListener('click', function () {
      cardState(dict.term.i).missed++; persist();
      closeDictation();
    });
    $('dict-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); submitDictation(); }
      else if (e.key === 'Escape') { e.preventDefault(); closeDictation(); }
      else if (e.key.length === 1) A.key(e.key.charCodeAt(0));
    });

    /* ── audio unlock ─────────────────────────────────────────────
       Desktop wakes on the first click. iOS Safari is fussier: it wants a
       gesture it trusts, and it can refuse the first few. So we keep trying on
       every interaction until the context is genuinely running, and if it still
       is not, we ask for one deliberate tap. */
    function tryUnlock() {
      var wasRunning = A.isRunning();
      A.unlock();
      A.loadVoices();
      var live = A.isRunning();
      RR.plate.resume();            // the same gesture also unblocks the video plate
      $('sound-nudge').hidden = live;
      // resume() settles asynchronously on Safari — look again before nagging
      setTimeout(function () {
        var now = A.isRunning();
        $('sound-nudge').hidden = now;
        if (now && !wasRunning && L && !L.over && current.screen === 'game') startWorldMusic(L.world);
      }, 450);
      if (live && !wasRunning && L && !L.over && current.screen === 'game') {
        startWorldMusic(L.world);       // the level started deaf — start its track now
      }
      return live;
    }
    ['pointerdown', 'touchend', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, function () {
        if (!A.isRunning()) tryUnlock();
      }, { passive: true });
    });
    $('sound-nudge').addEventListener('click', function (e) {
      e.stopPropagation();
      A.ui();
      if (tryUnlock()) toast('Sound on. If it is still silent, check the iPhone ringer switch.');
    });

    /* Safari suspends the context whenever the app goes to the background. */
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible') return;
      A.rewake();
      $('sound-nudge').hidden = A.isRunning();
    });
    window.addEventListener('pageshow', function () { A.rewake(); RR.plate.resume(); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') RR.plate.resume(); else RR.plate.suspend();
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && current.screen === 'game' && L && !L.over && $('dictation').hidden) {
        $('btn-quit').click();
      }
    });
  }

  /* the map's level buttons need to know whether co-op was requested */
  var _renderMap = renderMap;
  renderMap = function () {
    _renderMap();
    $('map-scroll').querySelectorAll('.node').forEach(function (b) {
      var n = +b.dataset.level;
      b.onclick = function () { A.ui(); startLevel(n, { coop: coopPending }); };
    });
  };

  /* ── boot ────────────────────────────────────────────────── */
  function init() {
    bindSettings();
    applySettings();
    wire();
    setPlate(MENU_WORLD);
    refreshTitle();
    loadSprites(function () {
      document.getElementById('app').classList.remove('boot');
      fitCanvas();
    });
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  RR.debug = function () { return { save: save, level: L }; };
  RR.step = frame;   // deterministic stepping, used by tests
  RR.tut = TUT;      // inspected by tests
})(window.RR = window.RR || {});

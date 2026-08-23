/* RADIOLOGY RUSH — board engine. Pure logic: no DOM, no canvas, no timing.
   Every mutation returns a step list so the renderer can animate it. */
(function (RR) {
  'use strict';

  var SIZE = 8;
  RR.SIZE = SIZE;

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function Cell(gem) {
    this.gem = gem; this.special = null; this.dir = 'h';
    this.fog = false; this.blur = false; this.infected = false; this.armor = 0; this.file = false;
  }

  function Board(opts) {
    opts = opts || {};
    this.rng = mulberry32(opts.seed || (Math.random() * 1e9) | 0);
    this.types = opts.types || 6;
    this.grid = [];
    this.reset();
  }
  RR.Board = Board;

  Board.prototype.rnd = function (n) { return Math.floor(this.rng() * n); };

  Board.prototype.reset = function () {
    var r, c;
    for (r = 0; r < SIZE; r++) {
      this.grid[r] = [];
      for (c = 0; c < SIZE; c++) this.grid[r][c] = new Cell(this.rnd(this.types));
    }
    // deal a board with no free matches and at least one legal move
    var guard = 0;
    while ((this.findMatches().length || !this.hasMove()) && guard++ < 500) {
      for (r = 0; r < SIZE; r++) for (c = 0; c < SIZE; c++) {
        if (this.findMatches().length) this.grid[r][c].gem = this.rnd(this.types);
      }
      if (!this.hasMove()) this.grid[this.rnd(SIZE)][this.rnd(SIZE)].gem = this.rnd(this.types);
    }
  };

  Board.prototype.at = function (r, c) {
    return (r >= 0 && r < SIZE && c >= 0 && c < SIZE) ? this.grid[r][c] : null;
  };

  /** A cell can take part in a match only if it is a plain, unobstructed gem. */
  function matchable(cell) {
    return !!cell && cell.gem >= 0 && !cell.blur && !cell.infected && !cell.file;
  }

  /* ---------- match detection ---------- */
  Board.prototype.findMatches = function () {
    var runs = [], r, c, i;
    for (r = 0; r < SIZE; r++) {
      c = 0;
      while (c < SIZE) {
        var a = this.grid[r][c];
        if (!matchable(a)) { c++; continue; }
        var end = c + 1;
        while (end < SIZE && matchable(this.grid[r][end]) && this.grid[r][end].gem === a.gem) end++;
        if (end - c >= 3) { var cells = []; for (i = c; i < end; i++) cells.push([r, i]); runs.push({ dir: 'h', cells: cells, gem: a.gem }); }
        c = end;
      }
    }
    for (c = 0; c < SIZE; c++) {
      r = 0;
      while (r < SIZE) {
        var b = this.grid[r][c];
        if (!matchable(b)) { r++; continue; }
        var e2 = r + 1;
        while (e2 < SIZE && matchable(this.grid[e2][c]) && this.grid[e2][c].gem === b.gem) e2++;
        if (e2 - r >= 3) { var cl = []; for (i = r; i < e2; i++) cl.push([i, c]); runs.push({ dir: 'v', cells: cl, gem: b.gem }); }
        r = e2;
      }
    }
    // merge runs that share a cell → groups (an L or T is one group, not two)
    var groups = [];
    runs.forEach(function (run) {
      var key = function (p) { return p[0] * SIZE + p[1]; };
      var hit = null;
      for (var g = 0; g < groups.length; g++) {
        if (groups[g].gem !== run.gem) continue;
        for (var k = 0; k < run.cells.length; k++) {
          if (groups[g].keys[key(run.cells[k])]) { hit = groups[g]; break; }
        }
        if (hit) break;
      }
      if (!hit) { hit = { gem: run.gem, cells: [], keys: {}, dirs: {}, maxRun: 0 }; groups.push(hit); }
      hit.dirs[run.dir] = true;
      hit.maxRun = Math.max(hit.maxRun, run.cells.length);
      run.cells.forEach(function (p) {
        if (!hit.keys[key(p)]) { hit.keys[key(p)] = true; hit.cells.push(p); }
      });
      hit.lastDir = run.dir;
    });
    return groups;
  };

  /** What special, if any, a group earns. */
  function specialFor(group) {
    var bothDirs = group.dirs.h && group.dirs.v;
    if (group.maxRun >= 5) return { type: 'core' };
    if (bothDirs && group.cells.length >= 5) return { type: 'bolus' };
    if (group.maxRun === 4) return { type: 'beam', dir: group.dirs.h ? 'h' : 'v' };
    return null;
  }

  /* ---------- legal-move search ---------- */
  Board.prototype.hasMove = function () { return !!this.findMove(); };

  Board.prototype.findMove = function () {
    for (var r = 0; r < SIZE; r++) for (var c = 0; c < SIZE; c++) {
      var here = this.grid[r][c];
      if (here.special) return { r: r, c: c, r2: r, c2: c, special: true };
      var dirs = [[0, 1], [1, 0]];
      for (var d = 0; d < 2; d++) {
        var r2 = r + dirs[d][0], c2 = c + dirs[d][1];
        if (r2 >= SIZE || c2 >= SIZE) continue;
        if (this.wouldMatch(r, c, r2, c2)) return { r: r, c: c, r2: r2, c2: c2 };
      }
    }
    return null;
  };

  Board.prototype.canSwap = function (r, c, r2, c2) {
    var a = this.at(r, c), b = this.at(r2, c2);
    if (!a || !b) return false;
    if (Math.abs(r - r2) + Math.abs(c - c2) !== 1) return false;
    if (a.infected || b.infected || a.file || b.file) return false;
    if (a.special || b.special) return true;               // specials can always be launched
    return this.wouldMatch(r, c, r2, c2);
  };

  Board.prototype.wouldMatch = function (r, c, r2, c2) {
    var a = this.grid[r][c], b = this.grid[r2][c2];
    if (!matchable(a) || !matchable(b)) return false;
    var t = a.gem; a.gem = b.gem; b.gem = t;
    var found = this.findMatches().length > 0;
    t = a.gem; a.gem = b.gem; b.gem = t;
    return found;
  };

  Board.prototype.swap = function (r, c, r2, c2) {
    var a = this.grid[r][c];
    this.grid[r][c] = this.grid[r2][c2];
    this.grid[r2][c2] = a;
  };

  /* ---------- clearing ---------- */
  /** Collect every cell a special detonation touches, recursively. */
  Board.prototype.blastCells = function (r, c, out, seen) {
    var cell = this.at(r, c);
    if (!cell) return;
    var k = r * SIZE + c;
    if (seen[k]) return;
    seen[k] = true;
    out.push([r, c]);
    if (!cell.special) return;
    var i;
    if (cell.special === 'beam') {
      if (cell.dir === 'h') { for (i = 0; i < SIZE; i++) this.blastCells(r, i, out, seen); }
      else { for (i = 0; i < SIZE; i++) this.blastCells(i, c, out, seen); }
    } else if (cell.special === 'bolus') {
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) this.blastCells(r + dr, c + dc, out, seen);
    } else if (cell.special === 'core') {
      var gem = cell.gem;
      for (var rr = 0; rr < SIZE; rr++) for (var cc = 0; cc < SIZE; cc++) {
        if (this.grid[rr][cc].gem === gem && !this.grid[rr][cc].file) this.blastCells(rr, cc, out, seen);
      }
    }
  };

  /**
   * Clear a set of cells, honouring armor, fog, infection and case files.
   * Returns the accounting the level rules need.
   */
  Board.prototype.clearCells = function (cells, ctx) {
    var self = this, res = {
      cleared: [], fog: 0, armor: [], collected: {}, files: 0, gems: 0, cleaned: []
    };
    var seen = {};
    cells.forEach(function (p) {
      var r = p[0], c = p[1], k = r * SIZE + c;
      if (seen[k]) return; seen[k] = true;
      var cell = self.grid[r][c];
      if (!cell) return;
      if (cell.armor > 0) { cell.armor--; res.armor.push([r, c]); return; }   // armor eats the hit
      if (cell.file) return;                                                  // files are delivered, never matched away
      if (cell.fog) { cell.fog = false; res.fog++; }
      if (cell.blur) { cell.blur = false; }
      var gid = RR.GEMS[cell.gem] && RR.GEMS[cell.gem].id;
      if (gid) res.collected[gid] = (res.collected[gid] || 0) + 1;
      res.cleared.push({ r: r, c: c, gem: cell.gem, special: cell.special });
      res.gems++;
      cell.gem = -1; cell.special = null;
      // an adjacent clear cleans infection
      [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(function (n) {
        var m = self.at(n[0], n[1]);
        if (m && m.infected) { m.infected = false; res.cleaned.push([n[0], n[1]]); }
      });
    });
    return res;
  };

  /* ---------- gravity + refill ---------- */
  Board.prototype.collapse = function (opts) {
    opts = opts || {};
    var falls = [], spawns = [], delivered = 0;
    for (var c = 0; c < SIZE; c++) {
      var write = SIZE - 1;
      for (var r = SIZE - 1; r >= 0; r--) {
        var cell = this.grid[r][c];
        if (cell.gem < 0 && !cell.file) continue;
        if (write !== r) {
          this.grid[write][c] = cell;
          this.grid[r][c] = new Cell(-1);
          falls.push({ c: c, from: r, to: write });
        }
        write--;
      }
      for (var w = write; w >= 0; w--) {
        var fresh = new Cell(this.rnd(this.types));
        if (opts.fileChance && this.rng() < opts.fileChance) { fresh.file = true; }
        this.grid[w][c] = fresh;
        spawns.push({ r: w, c: c, gem: fresh.gem, file: fresh.file, from: w - (write + 1) - 1 });
      }
    }
    // deliver any case file that reached the bottom row
    for (var cc = 0; cc < SIZE; cc++) {
      var bottom = this.grid[SIZE - 1][cc];
      if (bottom.file) { bottom.file = false; bottom.gem = this.rnd(this.types); delivered++; }
    }
    return { falls: falls, spawns: spawns, delivered: delivered };
  };

  Board.prototype.shuffle = function () {
    var pool = [], r, c;
    for (r = 0; r < SIZE; r++) for (c = 0; c < SIZE; c++) {
      if (this.grid[r][c].gem >= 0 && !this.grid[r][c].special) pool.push(this.grid[r][c].gem);
    }
    var guard = 0;
    do {
      for (var i = pool.length - 1; i > 0; i--) {
        var j = this.rnd(i + 1), t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      }
      var k = 0;
      for (r = 0; r < SIZE; r++) for (c = 0; c < SIZE; c++) {
        if (this.grid[r][c].gem >= 0 && !this.grid[r][c].special) this.grid[r][c].gem = pool[k++];
      }
    } while ((this.findMatches().length || !this.hasMove()) && guard++ < 200);
  };

  RR.specialFor = specialFor;
  RR.matchable = matchable;
})(window.RR = window.RR || {});

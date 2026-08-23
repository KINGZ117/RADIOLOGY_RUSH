/* RADIOLOGY RUSH — background plate.
   Two video elements crossfaded 0.7 s before the end, so any clip loops with no
   visible seam, whatever its last frame does. The key-art still sits behind them
   and takes over whenever video is off, unsupported, or too expensive to run. */
(function (RR) {
  'use strict';

  var FADE = 0.7;
  var P = {
    enabled: true, current: 0, src: '', still: null, vids: [], ready: false, fading: false
  };
  RR.plate = P;

  P.mount = function () {
    if (P.ready) return;
    P.still = document.getElementById('plate-still');
    P.vids = [document.getElementById('plate-a'), document.getElementById('plate-b')];
    P.vids.forEach(function (v) {
      v.muted = true; v.loop = false; v.playsInline = true;
      v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
      v.preload = 'auto';
      v.addEventListener('timeupdate', function () { maybeCrossfade(v); });
      v.addEventListener('ended', function () { if (v === active()) swap(); });
      // show it the moment it actually starts, whatever route got it there —
      // the play() promise is unreliable in background tabs and on iOS
      v.addEventListener('playing', function () { if (v === active()) v.classList.add('on'); });
    });
    P.ready = true;
    clearInterval(P.watch);
    P.watch = setInterval(watchdog, 200);
  };

  function other() { return P.vids[1 - P.current]; }
  function active() { return P.vids[P.current]; }

  /**
   * Hand over to the other element and crossfade. Everything here is explicit —
   * media events throttle in background tabs and lie on iOS, so the watchdog
   * below drives this on a timer and these calls have to be idempotent.
   */
  function swap() {
    if (!P.enabled || P.fading) return;
    var out = active(), next = other();
    if (next.readyState < 2) return;           // not decodable yet; try again next tick
    P.fading = true;
    try { next.currentTime = 0; } catch (e) {}
    var play = next.play();
    if (play && play.catch) play.catch(function () {});
    next.classList.add('on');
    out.classList.remove('on');
    P.current = 1 - P.current;
    setTimeout(function () {
      try { out.pause(); out.currentTime = 0; } catch (e) {}   // primed for its next turn
      P.fading = false;
    }, FADE * 1000);
  }

  function maybeCrossfade(v) {
    if (!P.enabled || v !== active() || P.fading) return;
    if (!v.duration || isNaN(v.duration)) return;
    if (v.currentTime >= v.duration - FADE) swap();
  }

  /** Runs regardless of whether timeupdate is firing. */
  function watchdog() {
    if (!P.enabled || !P.ready) return;
    var v = active();
    if (!v || !v.duration || isNaN(v.duration)) return;
    if (v.paused && !P.fading && document.visibilityState === 'visible') {
      var play = v.play();                    // recover from any stall
      if (play && play.catch) play.catch(function () {});
      return;
    }
    maybeCrossfade(v);
  }

  /** Point the plate at a world (or the menu). Still first, video when it can. */
  P.set = function (stillSrc, loopSrc) {
    P.mount();
    if (P.still && stillSrc && P.still.getAttribute('src') !== stillSrc) {
      P.still.setAttribute('src', stillSrc);
    }
    if (!P.enabled || !loopSrc) { P.off(); return; }
    if (P.src === loopSrc && active().readyState >= 2) return;   // already running it
    P.src = loopSrc;
    P.vids.forEach(function (v) {
      v.classList.remove('on');
      if (v.getAttribute('src') !== loopSrc) { v.setAttribute('src', loopSrc); v.load(); }
    });
    P.current = 0;
    var v0 = P.vids[0];
    v0.currentTime = 0;
    var play = v0.play();
    if (play && play.then) {
      play.then(function () { v0.classList.add('on'); })
          .catch(function () { P.blocked = true; });   // autoplay refused: the still carries it
    } else {
      v0.classList.add('on');
    }
  };

  P.off = function () {
    if (!P.ready) return;
    P.vids.forEach(function (v) { v.classList.remove('on'); try { v.pause(); } catch (e) {} });
  };

  P.setEnabled = function (on) {
    P.enabled = !!on;
    if (!on) P.off();
  };

  /** Free the decoders when the tab is hidden; iOS is unforgiving about this. */
  P.suspend = function () { if (P.ready) P.vids.forEach(function (v) { try { v.pause(); } catch (e) {} }); };
  /** Called on every user gesture and on tab return: the retry that beats autoplay policy. */
  P.resume = function () {
    if (!P.ready || !P.enabled) return;
    var v = active();
    var play = v.play();
    if (play && play.then) {
      play.then(function () { P.blocked = false; v.classList.add('on'); }).catch(function () {});
    }
  };
})(window.RR = window.RR || {});

/* hero.js — architectural frame: parallax + scroll-driven doorway expansion */
(function () {
  'use strict';

  var frame   = document.querySelector('.hero-frame');
  var caption = document.querySelector('.hero-frame-caption');
  var hero    = document.getElementById('home');
  if (!frame || !hero) return;

  /* ── Touch detection — skip parallax/float on mobile ── */
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  /* ── Mouse parallax ───────────────────────────────── */
  var mx = 0, my = 0;
  var cx = 0, cy = 0;   /* smoothed */

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX / window.innerWidth  - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  });

  /* ── Scroll progress ──────────────────────────────── */
  var scrollProg = 0;

  function updateScroll() {
    /* Complete at 78% of hero height */
    scrollProg = Math.max(0, Math.min(1, window.scrollY / (hero.offsetHeight * 0.78)));
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  /* ── Easing ───────────────────────────────────────── */
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /* ── Reduced-motion ───────────────────────────────── */
  var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Animation loop ───────────────────────────────── */
  (function tick() {
    requestAnimationFrame(tick);

    var eased = easeInOut(scrollProg);

    /* Scale 1.0 → 2.2 expanding from transform-origin: right top
       The top-right stays anchored (partially off-screen).
       The opening grows downward and leftward — doorway effect.    */
    var scale = 1 + eased * 1.2;

    /* Slight leftward drift as doorway opens */
    var drift = eased * -24;

    /* Border fades: 0.18 → near 0 */
    var borderAlpha = (0.18 * (1 - eased * 0.90)).toFixed(3);
    frame.style.borderColor = 'rgba(25, 25, 24, ' + borderAlpha + ')';

    /* Caption fades immediately */
    if (caption) {
      caption.style.opacity = Math.max(0, 1 - eased * 5).toFixed(3);
    }

    if (motionOK && !isTouch) {
      cx += (mx - cx) * 0.032;
      cy += (my - cy) * 0.032;

      /* Idle float — slow sinusoidal drift, always active.
         Two slightly different periods create organic Lissajous motion.
         ~9 s horizontal cycle, ~13 s vertical cycle.                   */
      var now = Date.now();
      var idleX = Math.sin(now * 0.0016)  * 16;
      var idleY = Math.cos(now * 0.0011) * 22;

      /* Parallax amplitude decreases as frame expands */
      var amp = 1 - eased * 0.90;
      var tx = (cx * -60 * amp + drift + idleX * amp).toFixed(2);
      var ty = (cy * -80 * amp + idleY * amp).toFixed(2);

      frame.style.transform =
        'perspective(1400px) rotateY(-1.5deg)' +
        ' translateY(' + ty + 'px) translateX(' + tx + 'px)' +
        ' scale(' + scale.toFixed(3) + ')';
    } else {
      frame.style.transform =
        'translateX(' + drift.toFixed(2) + 'px) scale(' + scale.toFixed(3) + ')';
    }
  })();
})();

/* audio.js — Within Cells Interlinked custom audio player
   Vanilla JS + native HTML Audio API. No external libraries.       */

(function () {
  'use strict';

  var AUDIO_BASE = 'assets/Audio/WithinCellsInterlinked/';
  var currentPlayer = null;   /* reference to the currently playing player */

  /* ── Utilities ──────────────────────────────────────── */
  function fmt(s) {
    if (isNaN(s) || s == null) return '--:--';
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  /* ── Player factory ─────────────────────────────────── */
  /* containerEl must be a .wci-player element.
     Works for both the stereo player and stem players.             */
  function makePlayer(containerEl) {
    var audio    = containerEl.querySelector('audio');
    var playBtn  = containerEl.querySelector('.wci-play');
    var iconPlay = containerEl.querySelector('.wci-icon-play');
    var iconPause = containerEl.querySelector('.wci-icon-pause');
    var bar      = containerEl.querySelector('.wci-bar');
    var fill     = containerEl.querySelector('.wci-bar-fill');
    var timeEl   = containerEl.querySelector('.wci-time');

    if (!audio || !playBtn) return null;

    /* Attach src from data attribute */
    var src = containerEl.dataset.src;
    if (src) audio.src = src;

    /* Stem-specific elements (null for the stereo player) */
    var stemEl       = containerEl.closest('.wci-stem');
    var stemProgress = stemEl ? stemEl.querySelector('.wci-stem-progress') : null;

    /* Hide stem time until active */
    if (timeEl && stemEl) timeEl.style.display = 'none';

    function updateUI() {
      var pct = audio.duration ? (audio.currentTime / audio.duration * 100) : 0;
      if (fill)   fill.style.width = pct.toFixed(2) + '%';
      if (timeEl) timeEl.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
    }

    function setActive(on) {
      if (iconPlay)  iconPlay.hidden  =  on;
      if (iconPause) iconPause.hidden = !on;
      if (stemProgress) stemProgress.hidden = !on;
      if (timeEl && stemEl) timeEl.style.display = on ? '' : 'none';
    }

    var self = {
      pause: function () {
        audio.pause();
        setActive(false);
      }
    };

    function play() {
      /* Stop whatever is currently playing */
      if (currentPlayer && currentPlayer !== self) currentPlayer.pause();
      audio.play().catch(function () {});
      setActive(true);
      currentPlayer = self;
    }

    playBtn.addEventListener('click', function () {
      if (audio.paused) play(); else self.pause();
    });

    audio.addEventListener('timeupdate', updateUI);
    audio.addEventListener('loadedmetadata', updateUI);
    audio.addEventListener('ended', function () {
      setActive(false);
      if (currentPlayer === self) currentPlayer = null;
    });

    /* Click-to-seek */
    if (bar) {
      bar.addEventListener('click', function (e) {
        if (!audio.duration) return;
        var r = bar.getBoundingClientRect();
        audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
      });
    }

    return self;
  }

  /* ── Build stem list ────────────────────────────────── */
  function buildStems(listEl) {
    for (var i = 1; i <= 10; i++) {
      var n   = i < 10 ? '0' + i : String(i);
      var src = AUDIO_BASE + 'Channel-' + n + '.mp3';

      var stem = document.createElement('div');
      stem.className = 'wci-stem';
      stem.innerHTML =
        '<div class="wci-player wci-stem-player" data-src="' + src + '">' +
          '<audio preload="metadata"></audio>' +
          '<div class="wci-stem-row">' +
            '<span class="wci-stem-num">' + n + '</span>' +
            '<span class="wci-stem-name">Channel ' + n + '</span>' +
            '<span class="wci-time"></span>' +
            '<button class="wci-play" aria-label="Play channel ' + n + '">' +
              '<span class="wci-icon-play">&#9654;</span>' +
              '<span class="wci-icon-pause" hidden>&#9646;&#9646;</span>' +
            '</button>' +
          '</div>' +
          '<div class="wci-stem-progress" hidden>' +
            '<div class="wci-bar" role="slider" aria-label="Seek channel ' + n + '" tabindex="0">' +
              '<div class="wci-bar-fill"></div>' +
            '</div>' +
          '</div>' +
        '</div>';

      listEl.appendChild(stem);
      makePlayer(stem.querySelector('.wci-player'));
    }
  }

  /* ── Open / close ───────────────────────────────────── */
  window.openWCIModal = function () {
    var modal = document.getElementById('wci-modal');
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  function closeWCI() {
    var modal = document.getElementById('wci-modal');
    if (!modal) return;
    if (currentPlayer) { currentPlayer.pause(); currentPlayer = null; }
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ── Init ───────────────────────────────────────────── */
  function init() {
    var modal = document.getElementById('wci-modal');
    if (!modal) return;

    /* Close triggers */
    var closeBtn = document.getElementById('wci-close');
    if (closeBtn) closeBtn.addEventListener('click', closeWCI);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeWCI();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeWCI();
    });

    /* Stereo player */
    var stereoEl = document.getElementById('wci-stereo');
    if (stereoEl) makePlayer(stereoEl);

    /* Stems */
    var listEl = document.getElementById('wci-stems-list');
    if (listEl) buildStems(listEl);
  }

  /* ── Symbol X modal ──────────────────────────────────── */
  window.openSXModal = function () {
    var modal = document.getElementById('sx-modal');
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  function closeSX() {
    var modal = document.getElementById('sx-modal');
    if (!modal) return;
    if (currentPlayer) { currentPlayer.pause(); currentPlayer = null; }
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initSX() {
    var modal = document.getElementById('sx-modal');
    if (!modal) return;

    var closeBtn = document.getElementById('sx-close');
    if (closeBtn) closeBtn.addEventListener('click', closeSX);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeSX();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeSX();
    });

    var playerEl = document.getElementById('sx-player');
    if (playerEl) makePlayer(playerEl);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); initSX(); });
  } else {
    init(); initSX();
  }

})();

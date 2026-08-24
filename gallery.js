/* gallery.js — Three.js museum gallery
   Requires global THREE from three.min.js                               */

(function () {

  // ── Guard ────────────────────────────────────────────────────────────────
  var wrap = document.getElementById('gallery-wrap');
  if (!wrap) return;

  if (typeof THREE === 'undefined') {
    wrap.innerHTML = '<p style="color:#8B1A1A;font-family:monospace;padding:40px">three.min.js failed to load — check console.</p>';
    return;
  }

  // ── Works data ───────────────────────────────────────────────────────────
  var WORKS = [
    { title:'L-Bow',               year:'2026', category:'systems',
      desc:'A wearable IMU system that maps bowing gestures to real-time sound processing. It extends the violin’s expressive possibilities without modifying the instrument or bow.',
      venue:'DAFx 2026 & ICSC 2026', link:null,   hex:'#6B8FAF', image:'assets/Figure/L-Bow.jpg' },
    { title:'emoChord',            year:'2026', category:'systems',
      desc:'A native Csound opcode using embedded ONNX Runtime machine learning to generate chord progressions from emotion input.',
      venue:'ICSC 2026', link:null,   hex:'#4A6E54', image:'assets/Figure/emoChord.png' },
    { title:'Symbol X',            year:'2026', category:'sound',
      desc:'A six-piece work for violin and live electronics built around mathematical symbols and impossible equations. Each section reflects a different social pressure surrounding women, including gaze, prejudice, comparison, anxiety, and the search for balance.',
      venue:'ICSC 2026', link:'https://drive.google.com/file/d/1aRsWuiuuo78p70wuGEUpE5amaRuDt0gY/view?usp=sharing',   hex:'#B09832', image:'assets/Figure/symbolX.jpg', cropX:0.5 },
    { title:'Within Cells Interlinked',  year:'2025', category:'sound',
      desc:'A 10-channel spatial composition work built entirely from the spoken phrase “within cells interlinked” from Blade Runner 2049. The voice is fragmented, transformed, and reshaped into the piece’s instrumental material, while the spatial design draws inspiration from the vast, immersive sonic world of Dune.',
      venue:'Berklee',   link:null,   hex:'#8F6B52', image:'assets/Figure/WithinCells.jpg' },
    { title:'Ghost of Tsushima',   year:'2024', category:'sound',
      desc:'Original trailer score — Japanese folk idioms with orchestral tension',
      venue:'', link:'https://www.youtube.com/watch?v=kYYymKHw5Nk', hex:'#3D5C50' },
    { title:'The Batman',          year:'2024', category:'sound',
      desc:'Original trailer score — dread built through layered electronics and strings',
      venue:'', link:'https://www.youtube.com/watch?v=mIj61l3lFkk', hex:'#2A2D38' },
    { title:'Ysaÿe — Sonata No. 3', year:'2023', category:'performance',
      desc:'Solo violin — Ballade in d minor, op. 27',
      venue:'', link:'https://www.youtube.com/watch?v=JnZwyq5XMro', hex:'#7B5E8A' },
    { title:'Solo Concert I',      year:'2023', category:'performance',
      desc:'Bach · Mozart · Wieniawski — solo violin recital',
      venue:'', link:'https://www.youtube.com/watch?v=f-_DaB4pyy0', hex:'#5E7B8A' },
    { title:'Solo Concert II',     year:'2023', category:'performance',
      desc:'Mozart · Violin Concerto No. 3 · Mendelssohn · Concerto in e minor',
      venue:'', link:'https://www.youtube.com/watch?v=50Av8G7vLJM', hex:'#8A7B5E' }
  ];

  // ── Constants ────────────────────────────────────────────────────────────
  var PW      = 4.5;     // painting width  (1.5× scaled)
  var PH      = 3.0;     // painting height (1.5× scaled)
  var PAD     = 0.30;    // mat padding
  var BW      = 0.33;    // frame bar width
  var BD      = 0.18;    // frame bar depth
  var SPACING = 7.5;
  var CAM_Z   = 8.5;
  var OW      = PW + (PAD + BW) * 2;   // outer frame width
  var OH      = PH + (PAD + BW) * 2;   // outer frame height

  // ── Renderer ─────────────────────────────────────────────────────────────
  var W = wrap.clientWidth  || 800;
  var H = wrap.clientHeight || 480;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  } catch(e) {
    wrap.innerHTML = '<p style="color:#8B1A1A;font-family:monospace;padding:40px">WebGL unavailable: ' + e + '</p>';
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W, H);
  renderer.domElement.style.display = 'block';   // kills inline-block baseline gap
  wrap.appendChild(renderer.domElement);

  // ── Scene ────────────────────────────────────────────────────────────────
  var scene  = new THREE.Scene();
  scene.background = new THREE.Color(0xF2EDE3);  // warm museum white

  var camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);

  // ── No lights needed — MeshBasicMaterial ignores lighting ────────────────
  // (MeshStandardMaterial + physical lights in r155+ requires intensity in lumens,
  //  which was causing invisible renders)

  // ── Floor ────────────────────────────────────────────────────────────────
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 20),
    new THREE.MeshBasicMaterial({ color: 0xE2DDD3 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.0;
  scene.add(floor);

  // ── Placeholder texture ──────────────────────────────────────────────────
  function makeTex(work) {
    var cw = 512, ch = 340;
    var cv  = document.createElement('canvas');
    cv.width = cw; cv.height = ch;
    var ctx = cv.getContext('2d');

    var r = parseInt(work.hex.slice(1,3), 16);
    var g = parseInt(work.hex.slice(3,5), 16);
    var b = parseInt(work.hex.slice(5,7), 16);
    var dr = Math.round(r * 0.55);
    var dg = Math.round(g * 0.55);
    var db = Math.round(b * 0.55);

    var grad = ctx.createLinearGradient(0, 0, cw, ch);
    grad.addColorStop(0, 'rgb(' + r  + ',' + g  + ',' + b  + ')');
    grad.addColorStop(1, 'rgb(' + dr + ',' + dg + ',' + db + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    // Faint grid
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    for (var x = 0; x <= cw; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
    }
    for (var y = 0; y <= ch; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
    }

    // Ghost initial letter
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.font = 'bold ' + Math.round(ch * 0.9) + 'px Georgia,serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(work.title[0].toUpperCase(), cw / 2, ch / 2);

    return new THREE.CanvasTexture(cv);
  }

  // ── Drop-shadow texture — directional, heavier below (natural hung-frame shadow) ──
  var _shadowTex = (function () {
    var s = 512;
    var cv = document.createElement('canvas');
    cv.width = s; cv.height = s;
    var ctx = cv.getContext('2d');
    var pad = 120;
    ctx.shadowColor   = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur    = 55;
    ctx.shadowOffsetX = 8;   // slight right
    ctx.shadowOffsetY = 18;  // heavier below — top-left light source
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(pad, pad, s - pad * 2, s - pad * 2);
    // Erase centre so only the cast-shadow ring remains
    ctx.globalCompositeOperation = 'destination-out';
    ctx.shadowColor = 'transparent';
    ctx.fillRect(pad, pad, s - pad * 2, s - pad * 2);
    return new THREE.CanvasTexture(cv);
  })();

  // ── Frame group builder ──────────────────────────────────────────────────
  var FRAME_COLOR = 0x201408;   // dark walnut

  function makeFrameGroup(work) {
    var g = new THREE.Group();

    // Wall shadow (rendered first, behind everything)
    var wallShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(OW + 1.6, OH + 1.6),
      new THREE.MeshBasicMaterial({ map: _shadowTex, transparent: true, depthWrite: false })
    );
    wallShadow.position.set(0.12, -0.18, -0.08);
    g.add(wallShadow);

    // 4 frame bars (BoxGeometry, clearly 3D)
    var fmat = new THREE.MeshBasicMaterial({ color: FRAME_COLOR });
    var zc   = BD / 2;
    [
      [OW,  BW,             BD,  0,              OH / 2 - BW / 2,  zc],
      [OW,  BW,             BD,  0,            -(OH / 2 - BW / 2), zc],
      [BW,  OH - BW * 2,   BD, -(OW / 2 - BW / 2), 0,             zc],
      [BW,  OH - BW * 2,   BD,  (OW / 2 - BW / 2), 0,             zc]
    ].forEach(function(b) {
      var bar = new THREE.Mesh(new THREE.BoxGeometry(b[0], b[1], b[2]), fmat);
      bar.position.set(b[3], b[4], b[5]);
      g.add(bar);
    });

    // Cream mat (behind painting)
    var mat = new THREE.Mesh(
      new THREE.PlaneGeometry(PW + PAD * 2, PH + PAD * 2),
      new THREE.MeshBasicMaterial({ color: 0xF7F3EA })
    );
    mat.position.z = 0.005;
    g.add(mat);

    // Painting surface
    var painting = new THREE.Mesh(
      new THREE.PlaneGeometry(PW, PH),
      new THREE.MeshBasicMaterial({ map: makeTex(work) })
    );
    painting.position.z = 0.010;
    painting.userData.work = work;
    g.add(painting);

    return g;
  }

  // ── Thin horizontal rule below each frame (museum placard line) ───────────
  function makeRule() {
    return new THREE.Mesh(
      new THREE.PlaneGeometry(OW * 0.6, 0.012),
      new THREE.MeshBasicMaterial({ color: 0xB09060 })
    );
  }

  // ── Build frames ─────────────────────────────────────────────────────────
  var frames = [];  // { group, painting, labelEl, work }

  // Label overlay container
  var labelCtn = document.createElement('div');
  labelCtn.style.cssText =
    'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;';
  wrap.appendChild(labelCtn);

  WORKS.forEach(function(work, i) {
    var group = makeFrameGroup(work);

    var rule = makeRule();
    rule.position.set(0, -(OH / 2 + 0.06), 0);
    group.add(rule);

    group.position.x = i * SPACING;
    group.userData.category = work.category;
    scene.add(group);

    // DOM placard label
    var labelEl = document.createElement('div');
    labelEl.className = 'gallery-label';
    labelEl.setAttribute('data-category', work.category);
    labelEl.style.opacity = '0';
    labelEl.innerHTML =
      '<span class="gl-title">' + work.title + '</span>' +
      '<span class="gl-meta">' + work.year +
        (work.venue ? ' &middot; ' + work.venue : '') + '</span>';
    labelCtn.appendChild(labelEl);

    frames.push({
      group:   group,
      painting: group.children[3],  // painting mesh (index 4: bars=0..3, mat=4, painting=5)
      labelEl: labelEl,
      work:    work
    });
  });

  // Fix painting reference — iterate to find mesh with userData.work
  frames.forEach(function(fr) {
    fr.group.traverse(function(child) {
      if (child.userData && child.userData.work) fr.painting = child;
    });
  });

  // ── Load real images where available, swap canvas placeholder ────────────
  var texLoader = new THREE.TextureLoader();
  frames.forEach(function(fr) {
    if (!fr.work.image || !fr.painting) return;
    texLoader.load(fr.work.image, function(tex) {
      tex.colorSpace = THREE.SRGBColorSpace;
      /* Cover-fit: show center crop so image fills frame without distortion */
      var frameAspect = PW / PH;
      var imgAspect   = tex.image.width / tex.image.height;
      if (imgAspect > frameAspect) {
        /* Image wider than frame — fit height, crop based on cropX (0=left,0.5=center,1=right) */
        var rx = frameAspect / imgAspect;
        var cropX = typeof fr.work.cropX === 'number' ? fr.work.cropX : 0;
        tex.repeat.set(rx, 1);
        tex.offset.set((1 - rx) * cropX, 0);
      } else {
        /* Image taller than frame — fit width, crop top/bottom */
        var ry = imgAspect / frameAspect;
        tex.repeat.set(1, ry);
        tex.offset.set(0, (1 - ry) / 2);
      }
      tex.needsUpdate = true;
      fr.painting.material.map = tex;
      fr.painting.material.needsUpdate = true;
    }, undefined, function(err) {
      console.error('[gallery] texture failed to load:', fr.work.image, err);
    });
  });

  // ── Camera / pan state ───────────────────────────────────────────────────
  var SPAN    = (WORKS.length - 1) * SPACING;
  var targetX = SPAN / 2;
  var currX   = targetX;
  camera.position.set(currX, 0, CAM_Z);

  function clampX(v) { return Math.max(-SPACING, Math.min(SPAN + SPACING, v)); }

  var dragging = false, wasDrag = false, drag0X = 0, cam0X = 0;
  var hovIdx   = -1;

  wrap.addEventListener('mousedown', function(e) {
    dragging = true; wasDrag = false;
    drag0X = e.clientX; cam0X = targetX;
    wrap.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', function() {
    dragging = false;
    wrap.style.cursor = hovIdx >= 0 ? 'pointer' : 'grab';
  });
  window.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    if (Math.abs(e.clientX - drag0X) > 4) wasDrag = true;
    targetX = clampX(cam0X - (e.clientX - drag0X) / W * SPAN * 0.57);
  });
  wrap.addEventListener('wheel', function(e) {
    e.preventDefault();
    targetX = clampX(targetX + e.deltaY * 0.015);
  }, { passive: false });

  // Touch
  var tX0 = 0, tY0 = 0, tc0 = 0, isH = null;
  wrap.addEventListener('touchstart', function(e) {
    tX0 = e.touches[0].clientX; tY0 = e.touches[0].clientY;
    tc0 = targetX; isH = null;
  }, { passive: true });
  wrap.addEventListener('touchmove', function(e) {
    var dx = e.touches[0].clientX - tX0, dy = e.touches[0].clientY - tY0;
    if (isH === null) isH = Math.abs(dx) > Math.abs(dy);
    if (isH) { e.preventDefault(); targetX = clampX(tc0 - dx / W * SPAN * 0.57); }
  }, { passive: false });

  // ── Raycasting ───────────────────────────────────────────────────────────
  var ray   = new THREE.Raycaster();
  var mouse = new THREE.Vector2(-9, -9);

  wrap.addEventListener('mousemove', function(e) {
    if (dragging) return;
    var r = wrap.getBoundingClientRect();
    mouse.x =  ((e.clientX - r.left) / W) * 2 - 1;
    mouse.y = -((e.clientY - r.top)  / H) * 2 + 1;
  });
  wrap.addEventListener('mouseleave', function() { mouse.set(-9, -9); });

  wrap.addEventListener('click', function() {
    if (wasDrag) return;
    var paintings = frames.filter(function(f) { return f.group.visible && f.painting; })
                          .map(function(f)   { return f.painting; });
    ray.setFromCamera(mouse, camera);
    var hits = ray.intersectObjects(paintings);
    if (hits.length) openModal(hits[0].object.userData.work);
  });

  function updateHover() {
    var paintings = frames.filter(function(f) { return f.group.visible && f.painting; })
                          .map(function(f)   { return f.painting; });
    ray.setFromCamera(mouse, camera);
    var hits = ray.intersectObjects(paintings);
    var ni = hits.length ? hits[0].object.userData._index : -1;

    if (ni === hovIdx) return;
    if (hovIdx >= 0 && frames[hovIdx]) frames[hovIdx].group.scale.setScalar(1);
    if (ni >= 0 && frames[ni] && frames[ni].group.visible) {
      frames[ni].group.scale.setScalar(1.04);
      wrap.style.cursor = 'pointer';
    } else {
      wrap.style.cursor = dragging ? 'grabbing' : 'grab';
    }
    hovIdx = ni;
  }

  // Store index on painting userData so raycasting can identify it
  frames.forEach(function(fr, i) {
    if (fr.painting) fr.painting.userData._index = i;
  });

  // ── Filter ───────────────────────────────────────────────────────────────
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var f  = btn.dataset.filter;
      var xs = [];
      frames.forEach(function(fr, i) {
        var show = f === 'all' || fr.work.category === f;
        fr.group.visible = show;
        if (show) xs.push(i * SPACING);
      });
      hovIdx = -1;
      if (xs.length) targetX = clampX((Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2);
    });
  });

  // ── Modal ────────────────────────────────────────────────────────────────
  function openModal(work) {
    /* Within Cells Interlinked has its own audio detail modal */
    if (work.title === 'Within Cells Interlinked') {
      if (typeof window.openWCIModal === 'function') window.openWCIModal();
      return;
    }
    var m = document.getElementById('work-modal');
    if (!m) return;
    m.querySelector('.wm-category').textContent = work.category;
    m.querySelector('.wm-title').textContent    = work.title;
    m.querySelector('.wm-year').textContent     =
      work.year + (work.venue ? ' · ' + work.venue : '');
    m.querySelector('.wm-desc').textContent     = work.desc;
    var lk = m.querySelector('.wm-link');
    lk.href = work.link || '#';
    lk.style.display = work.link ? '' : 'none';
    m.setAttribute('aria-hidden', 'false');
    m.classList.add('active');
  }
  function closeModal() {
    var m = document.getElementById('work-modal');
    if (!m) return;
    m.classList.remove('active');
    m.setAttribute('aria-hidden', 'true');
  }
  var wmc = document.getElementById('wm-close');
  if (wmc) wmc.addEventListener('click', closeModal);
  var wm = document.getElementById('work-modal');
  if (wm) wm.addEventListener('click', function(e) { if (e.target === e.currentTarget) closeModal(); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

  // ── Label positioning ────────────────────────────────────────────────────
  var _lv = new THREE.Vector3();

  function updateLabels() {
    frames.forEach(function(fr, i) {
      var lel = fr.labelEl;
      if (!fr.group.visible) { lel.style.opacity = '0'; return; }

      _lv.set(fr.group.position.x, -(OH / 2 + 0.5), 0);
      _lv.project(camera);
      if (_lv.z >= 1) { lel.style.opacity = '0'; return; }

      var sx = (_lv.x * 0.5 + 0.5) * W;
      var sy = (-_lv.y * 0.5 + 0.5) * H;
      if (sx < -280 || sx > W + 280) { lel.style.opacity = '0'; return; }

      lel.style.left    = sx + 'px';
      lel.style.top     = sy + 'px';
      lel.style.opacity = '1';
    });
  }

  // ── Resize ───────────────────────────────────────────────────────────────
  window.addEventListener('resize', function() {
    W = wrap.clientWidth;
    H = wrap.clientHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  // ── Render loop ───────────────────────────────────────────────────────────
  (function animate() {
    requestAnimationFrame(animate);
    currX += (targetX - currX) * 0.07;
    camera.position.set(currX, 0, CAM_Z);
    camera.lookAt(currX, 0, 0);
    updateHover();
    updateLabels();
    renderer.render(scene, camera);
  })();

})();

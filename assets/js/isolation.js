/* BTP Confort Avenir — page Isolation : coupe thermique et maison éclatée */
(function () {
  'use strict';
  const A = window.App;
  if (!A) return;
  const { calm, qs, qsa } = A;
  const hasGsap = !!window.gsap;

  /* Titre */
  const title = qs('[data-iso-title]');
  if (title && hasGsap && !calm && window.SplitText) {
    const sp = new SplitText(title, { type: 'words,chars', mask: 'words', wordsClass: 'w' });
    gsap.from(sp.chars, { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.04, delay: 0.25 });
  }

  /* =========================================================
     Coupe thermique : la chaleur s'échappe, puis l'isolant la retient
     ========================================================= */
  const box = qs('[data-coupe-box]');
  if (box) {
    const svg = qs('svg[data-coupe]', box);
    const cv = qs('canvas[data-heat]', box);
    const ctx = cv.getContext('2d');
    const gRoof = qs('[data-iso-roof]', svg), gAttic = qs('[data-iso-attic]', svg), gWalls = qs('[data-iso-walls]', svg);
    const stateEl = qs('[data-coupe-state]', box);
    const bar = qs('.coupe__bar', box);
    let W = 0, H = 0, s = 1, ox = 0, oy = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    let k = calm ? 1 : 0;
    let kRoof = 0, kAttic = 0, kWalls = 0;
    let visible = false, raf = 0;
    const roofY = (x) => (x < 400 ? 232 - (x - 140) * (134 / 260) : 98 + (x - 400) * (134 / 260));
    const P = [];
    const N = 110;
    function spawn(p) {
      p.x = 175 + Math.random() * 450; p.y = 300 + Math.random() * 95;
      p.vx = (Math.random() - 0.5) * 0.9; p.vy = -0.5 - Math.random() * 0.9;
      p.life = 0; p.max = 260 + Math.random() * 260; p.out = false; p.a = 0;
      return p;
    }
    for (let i = 0; i < N; i++) { const p = spawn({}); p.life = Math.random() * p.max; P.push(p); }
    function resize() {
      const r = box.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      s = Math.min(W / 800, H / 450); ox = (W - 800 * s) / 2; oy = (H - 450 * s) / 2;
      draw();
    }
    function setK(v) {
      k = Math.max(0, Math.min(1, v));
      kRoof = Math.min(1, k * 3); kAttic = Math.min(1, Math.max(0, k * 3 - 1)); kWalls = Math.min(1, Math.max(0, k * 3 - 2));
      gRoof.style.opacity = kRoof; gAttic.style.opacity = kAttic; gWalls.style.opacity = kWalls;
      bar.style.setProperty('--k', k.toFixed(3));
      stateEl.textContent = k < 0.03 ? 'Avant isolation' : k < 0.34 ? 'Pose sous la toiture' : k < 0.67 ? 'Isolation des combles' : k < 0.98 ? 'Isolation des murs' : 'Après isolation';
    }
    function step() {
      for (const p of P) {
        p.life++;
        p.a = Math.min(1, p.a + 0.04);
        p.vx += (Math.random() - 0.5) * 0.12; p.vx *= 0.985;
        p.vy += -0.012 + (Math.random() - 0.5) * 0.06; p.vy = Math.max(-1.8, Math.min(1.2, p.vy));
        const nx = p.x + p.vx, ny = p.y + p.vy;
        if (!p.out) {
          // plafond / combles
          if (p.y >= 230 && ny < 230) { if (Math.random() < kAttic) { p.vy = Math.abs(p.vy) * 0.6; } }
          // toiture
          if (ny < roofY(nx) + 2 && p.y >= roofY(p.x) + 2) { if (Math.random() < kRoof) { p.vy = Math.abs(p.vy) * 0.7; p.vx *= -0.5; } else p.out = true; }
          // murs
          if (p.y > 230) {
            if ((nx < 166 && p.x >= 166) || (nx > 634 && p.x <= 634)) { if (Math.random() < kWalls) p.vx = -p.vx * 0.8; else p.out = true; }
          }
          if (ny > 396) p.vy = -Math.abs(p.vy);
        }
        p.x += p.vx; p.y += p.vy;
        if (p.out) p.a -= 0.012;
        if (p.life > p.max || p.a <= 0 || p.y < 40 || p.x < 0 || p.x > 800) spawn(p);
      }
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (const p of P) {
        const x = ox + p.x * s, y = oy + p.y * s;
        ctx.globalAlpha = Math.max(0, p.a) * (p.out ? 0.55 : 0.9);
        ctx.fillStyle = p.out ? '#C86F0E' : '#F79F31';
        ctx.beginPath(); ctx.arc(x, y, Math.max(1.6, 3 * s), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function loop() { raf = 0; if (!visible || calm) return; step(); draw(); raf = requestAnimationFrame(loop); }
    new ResizeObserver(resize).observe(box);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf && !calm) raf = requestAnimationFrame(loop); }).observe(box);
    setK(k);
    if (calm) { for (let i = 0; i < 200; i++) step(); }
    if (hasGsap && !calm) {
      const desk = window.matchMedia('(min-width: 900px)').matches;
      if (desk) {
        ScrollTrigger.create({ trigger: box, start: 'center center', end: '+=140%', pin: qs('#coupe'), scrub: 0.6, onUpdate: (st) => setK(st.progress) });
      } else {
        ScrollTrigger.create({ trigger: box, start: 'top 75%', end: 'bottom 25%', scrub: 0.6, onUpdate: (st) => setK(st.progress) });
      }
      A.prep(svg);
      ScrollTrigger.create({ trigger: box, start: 'top 85%', once: true, onEnter: () => A.drawIn(svg, { duration: 1.6 }) });
    }
  }

  /* =========================================================
     Maison éclatée : 6 zones
     ========================================================= */
  const zonesBox = qs('[data-zones]');
  if (zonesBox) {
    const svg = qs('svg', zonesBox);
    const groups = qsa('.zone-g', svg);
    const btns = qsa('[data-z]', zonesBox);
    function select(z) {
      btns.forEach((b) => {
        const on = b.dataset.z === z;
        b.setAttribute('aria-pressed', String(on));
        const d = qs(`[data-zd="${b.dataset.z}"]`, zonesBox);
        if (d) d.hidden = !on;
      });
      groups.forEach((g) => g.classList.toggle('is-on', g.dataset.zone === z));
      svg.classList.add('has-on');
    }
    btns.forEach((b) => b.addEventListener('click', () => select(b.dataset.z)));
    groups.forEach((g) => {
      g.addEventListener('click', () => select(g.dataset.zone));
      g.addEventListener('pointerenter', () => { if (A.fine) select(g.dataset.zone); });
    });
    select('toiture');
    if (hasGsap && !calm) {
      const offs = { 'sous-sols': 36, planchers: 20, murs: 0, ouvertures: 0, combles: -24, toiture: -40 };
      A.prep(svg);
      groups.forEach((g) => gsap.set(g, { y: offs[g.dataset.zone] || 0 }));
      ScrollTrigger.create({
        trigger: zonesBox, start: 'top 72%', once: true,
        onEnter: () => {
          A.drawIn(svg, { duration: 1.4 });
          gsap.to(groups, { y: 0, duration: 1.6, ease: 'expo.inOut', delay: 0.6, stagger: 0.04 });
        },
      });
    }
  }
})();

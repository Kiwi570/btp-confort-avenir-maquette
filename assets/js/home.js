/* BTP Confort Avenir — page d'accueil */
(function () {
  'use strict';
  const A = window.App;
  if (!A) return;
  const { calm, qs, qsa, store } = A;
  const hasGsap = !!window.gsap;
  const html = document.documentElement;
  const useGL = !calm && A.webgl && hasGsap;
  const glMod = useGL ? import('./gl.js?v=20261031').catch(() => null) : Promise.resolve(null);
  if (useGL) html.classList.add('has-gl');

  /* =========================================================
     1. Accueil : calques photo et ouverture orchestrée
     ========================================================= */
  const media = qs('[data-hero-media]');
  const heroImgs = media ? qsa('img', media) : [];
  const tabs = qsa('.calque-tab');
  let cur = 0, heroGL = null, busy = false, auto = null;

  function markTab(i) { tabs.forEach((t, k) => t.setAttribute('aria-pressed', String(k === i))); }
  function showCalque(i) {
    if (i === cur || busy) return;
    busy = true;
    const prev = cur;
    cur = i;
    markTab(i);
    if (heroGL) heroGL.transitionTo(heroImgs[i]).then(() => { busy = false; });
    else { heroImgs[prev].classList.remove('is-on'); heroImgs[i].classList.add('is-on'); busy = false; }
    runAuto();
  }
  function runAuto() {
    if (!hasGsap || calm) return;
    if (auto) auto.kill();
    tabs.forEach((t) => t.style.setProperty('--p', 0));
    const t = tabs[cur];
    auto = gsap.fromTo(t, { '--p': 0 }, { '--p': 1, duration: 7, ease: 'none', onComplete: () => showCalque((cur + 1) % tabs.length) });
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => showCalque(i)));
  const tabWrap = qs('.calques');
  if (tabWrap) {
    tabWrap.addEventListener('pointerenter', () => auto && auto.pause());
    tabWrap.addEventListener('pointerleave', () => auto && auto.resume());
    tabWrap.addEventListener('focusin', () => auto && auto.pause());
    tabWrap.addEventListener('focusout', () => auto && auto.resume());
  }
  document.addEventListener('visibilitychange', () => { if (!auto) return; document.hidden ? auto.pause() : auto.resume(); });

  const title = qs('[data-hero-title]');
  const coteHero = qs('[data-gen="cote-hero"]');
  function heroText(delay = 0) {
    if (!hasGsap || calm) return;
    if (window.SplitText && title) {
      const sp = new SplitText(title, { type: 'words,chars', mask: 'words', wordsClass: 'w' });
      gsap.from(sp.chars, { yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: 0.016, delay });
    }
    gsap.from(['.hero__eyebrow', '.hero__lead', '.hero__cta > *', '.calques > *', '.hero__hint'], { y: 26, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.07, delay: delay + 0.35 });
    if (coteHero) A.drawIn(coteHero, { duration: 1.2, delay: delay + 0.6, ease: 'power3.inOut' });
  }

  const intro = qs('[data-intro]');
  const playIntro = html.classList.contains('js-intro') && intro && hasGsap && !calm;
  function startHeroGL(GL) {
    if (!GL || !media || !heroImgs.length) return null;
    try {
      heroGL = new GL.PlanReveal(media, heroImgs[0], { progress: 0, lens: true, lensR: 130, lensTarget: qs('[data-hero]'), onSlow: dropGL });
      return heroGL;
    } catch (e) { html.classList.remove('has-gl'); return null; }
  }
  /* Garde-fou : si l'appareil n'affiche pas l'effet de façon fluide, on revient aux photos */
  let glDisabled = false;
  function dropGL() {
    if (glDisabled) return;
    glDisabled = true;
    busy = false;
    if (heroGL) { heroGL.destroy(); heroGL = null; }
    glPlanches.forEach((g) => g.destroy());
    glPlanches.clear();
    html.classList.remove('has-gl');
    heroImgs.forEach((im, i) => im.classList.toggle('is-on', i === cur));
  }
  function pour(delay) {
    if (!heroGL) return;
    const o = { p: 0 };
    gsap.to(o, { p: 1, duration: 1.7, delay, ease: 'power2.inOut', onUpdate: () => { if (heroGL) heroGL.setProgress(o.p); } });
  }

  if (playIntro) {
    store.set('btp-intro', '1', true);
    const draw = qs('.intro__draw', intro);
    const count = qs('.intro__count', intro);
    const tl = gsap.timeline({ paused: true });
    requestAnimationFrame(() => requestAnimationFrame(() => tl.play()));
    const els = A.prep(draw);
    tl.to(els, { strokeDashoffset: 0, duration: 1.15, ease: 'power2.inOut', stagger: { each: 0.008 } }, 0);
    tl.from(qsa('text', draw), { opacity: 0, duration: 0.4, stagger: 0.05 }, 0.7);
    tl.from(qs('.intro__cart', intro), { opacity: 0, y: 10, duration: 0.5 }, 0.2);
    const c = { v: 0 };
    tl.to(c, { v: 100, duration: 1.5, ease: 'power1.inOut', onUpdate: () => { count.textContent = `Tracé ${String(Math.round(c.v)).padStart(3, '0')} %`; } }, 0);
    tl.to(intro, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.85, ease: 'expo.inOut' }, 1.55);
    tl.add(() => { html.classList.remove('js-intro'); intro.remove(); }, 2.45);
    glMod.then((GL) => { startHeroGL(GL); pour(1.5); });
    heroText(1.75);
  } else {
    if (intro) intro.remove();
    html.classList.remove('js-intro');
    glMod.then((GL) => { startHeroGL(GL); if (heroGL) pour(0.1); });
    heroText(html.classList.contains('from-sheet') ? 0.6 : 0.1);
  }
  if (!useGL) heroImgs.forEach((im, i) => im.classList.toggle('is-on', i === 0));
  markTab(0);
  if (hasGsap && !calm) {
    setTimeout(runAuto, playIntro ? 2600 : 900);
    ScrollTrigger.create({ trigger: '[data-hero]', start: 'top top', end: 'bottom top', onLeave: () => auto && auto.pause(), onEnterBack: () => auto && auto.resume() });
  }

  /* =========================================================
     2. Entreprise : la cote d'expérience se mesure au défilement
     ========================================================= */
  const coteXp = qs('[data-gen="cote-xp"]');
  if (coteXp && hasGsap && !calm) {
    const line = qs('[data-cote-line]', coteXp);
    const num = qs('[data-count-svg]', coteXp);
    const len = 600;
    line.style.strokeDasharray = `${len} ${len}`;
    line.style.strokeDashoffset = String(len);
    const o = { p: 0 };
    gsap.to(o, {
      p: 1, ease: 'none',
      scrollTrigger: { trigger: coteXp, start: 'top 90%', end: 'top 45%', scrub: 0.6 },
      onUpdate: () => { line.style.strokeDashoffset = String(len * (1 - o.p)); num.textContent = Math.round(30 * o.p) + '+'; },
    });
    A.prep(coteXp);
    ScrollTrigger.create({ trigger: coteXp, start: 'top 90%', once: true, onEnter: () => A.drawIn(coteXp, { duration: 1 }) });
  }

  /* =========================================================
     3. Les cinq planches métiers
     ========================================================= */
  const sec = qs('[data-planches-sec]');
  const planches = qsa('.planche');
  const desktopH = window.matchMedia('(min-width: 1100px)').matches && !calm && hasGsap;
  const glPlanches = new Map();

  function activate(pl, on) {
    pl.classList.toggle('is-active', on);
    if (on && !pl.__drawn) {
      pl.__drawn = true;
      const d = qs('.planche__draw', pl);
      A.drawIn(d, { duration: 1.6, stagger: { each: 0.01 } });
      qsa('.block', pl).forEach((b, i) => setTimeout(() => b.classList.add('is-on'), 500 + i * 55));
    }
    if (pl.dataset.planche === 'electricite') leds(pl, on);
  }
  function leds(pl, on) {
    clearInterval(pl.__ledT);
    const L = qsa('[data-led]', pl);
    if (!on) return;
    let i = 0;
    pl.__ledT = setInterval(() => {
      if (i >= L.length) { L.forEach((l) => l.classList.remove('on')); i = 0; return; }
      L[i++].classList.add('on');
    }, 420);
  }
  if (calm) {
    planches.forEach((pl) => { A.prep(pl); A.finish(pl); qsa('.block', pl).forEach((b) => b.classList.add('is-on')); qsa('[data-led]', pl).forEach((l) => l.classList.add('on')); });
  }

  function glFor(pl) {
    const box = qs('.planche__photo[data-gl]', pl);
    if (!box || glPlanches.has(pl)) return glPlanches.get(pl);
    const img = qs(':scope > img', box);
    if (!img || !window.__GL || glDisabled) return null;
    try {
      const g = new window.__GL.PlanReveal(box, img, { progress: 0, lens: true, lensR: 90, onSlow: dropGL });
      glPlanches.set(pl, g);
      return g;
    } catch (e) { return null; }
  }

  if (sec && hasGsap && !calm) {
    if (desktopH) {
      sec.classList.add('is-pinned-h');
      const wrapEl = qs('.planches', sec);
      const track = qs('.planches__track', sec);
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: wrapEl, pin: true, scrub: 0.8, start: 'top top', end: () => '+=' + dist(), invalidateOnRefresh: true },
      });
      planches.forEach((pl) => {
        ScrollTrigger.create({ trigger: pl, containerAnimation: tween, start: 'left 70%', end: 'right 30%', onToggle: (s) => activate(pl, s.isActive) });
        ScrollTrigger.create({
          trigger: pl, containerAnimation: tween, start: 'left 85%', end: 'left 20%',
          onUpdate: (s) => { const g = glFor(pl); if (g) g.setProgress(s.progress); },
          onEnter: () => glFor(pl),
        });
      });
    } else {
      planches.forEach((pl) => {
        ScrollTrigger.create({ trigger: pl, start: 'top 75%', end: 'bottom 25%', onToggle: (s) => activate(pl, s.isActive) });
        ScrollTrigger.create({
          trigger: qs('.planche__photo', pl) || pl, start: 'top 92%', end: 'top 35%',
          onUpdate: (s) => { const g = glFor(pl); if (g) g.setProgress(s.progress); },
        });
      });
    }
  }
  glMod.then((GL) => {
    if (!GL) return;
    window.__GL = GL;
    if (hasGsap) ScrollTrigger.refresh();
  });

  /* =========================================================
     4. Méthode : le bâtiment monte, le niveau se cale
     ========================================================= */
  const meth = qs('[data-methode]');
  if (meth) {
    const svg = qs('svg', meth);
    const layers = qsa('.layer', svg);
    const steps = qsa('.step', meth);
    const niveau = qs('.niveau', meth);
    const tube = qs('.niveau__tube', meth);
    const lbl = qs('.niveau__lbl', meth);
    const setStep = (idx) => steps.forEach((s, k) => s.classList.toggle('is-on', k === idx));
    if (calm || !hasGsap) {
      layers.forEach((l) => { A.prep(l); A.finish(l); });
      steps.forEach((s) => s.classList.add('is-on'));
      if (tube) tube.style.setProperty('--n', 0.5);
      if (niveau) { niveau.classList.add('is-level'); lbl.textContent = 'De niveau ✓'; }
    } else {
      const tl = gsap.timeline({ paused: true });
      layers.forEach((l, i) => {
        const els = A.prep(l);
        const fills = qsa('polygon, rect', l).filter((e) => /fill-/.test(e.getAttribute('class') || '') || e.getAttribute('style'));
        const texts = qsa('text', l);
        gsap.set(fills, { fillOpacity: 0 });
        gsap.set(texts, { opacity: 0 });
        tl.to(els, { strokeDashoffset: 0, duration: 1, ease: 'none', stagger: { each: 0.6 / Math.max(1, els.length) } }, i);
        tl.to(fills, { fillOpacity: 1, duration: 0.5, ease: 'none' }, i + 0.5);
        tl.to(texts, { opacity: 1, duration: 0.3 }, i + 0.2);
      });
      ScrollTrigger.create({
        trigger: qs('.steps', meth), start: 'top 65%', end: 'bottom 55%', scrub: 0.6,
        onUpdate: (s) => {
          const p = s.progress;
          tl.progress(p);
          setStep(Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999)));
          tube.style.setProperty('--n', (0.5 * Math.min(1, p / 0.96)).toFixed(4));
          const level = p > 0.96;
          niveau.classList.toggle('is-level', level);
          lbl.textContent = level ? 'De niveau ✓' : `Calage ${Math.round(p * 100)} %`;
        },
      });
      setStep(0);
    }
  }

  /* =========================================================
     5. Activités : pose carreau par carreau, cartes inclinables
     ========================================================= */
  qsa('[data-tiles]').forEach((box) => {
    if (calm || !hasGsap) return;
    const cols = 6, rows = 4;
    const g = document.createElement('div');
    g.className = 'tiles';
    g.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    g.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    for (let i = 0; i < cols * rows; i++) { const t = document.createElement('i'); t.className = 'tile'; g.appendChild(t); }
    box.appendChild(g);
    const tiles = qsa('.tile', g);
    ScrollTrigger.create({
      trigger: box, start: 'top 85%', once: true,
      onEnter: () => {
        gsap.to(tiles, {
          rotateX: -92, opacity: 0, duration: 0.55, ease: 'power2.in',
          stagger: { grid: [rows, cols], from: 'start', each: 0.035 },
          onComplete: () => g.remove(),
        });
      },
    });
  });
  if (A.fine && !calm && hasGsap) {
    qsa('.act').forEach((card) => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 9);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 7);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* =========================================================
     6. Engagements : tampons « Bon pour exécution »
     ========================================================= */
  const engs = qsa('.eng');
  if (engs.length && hasGsap && !calm) {
    const stamps = engs.map((e) => qs('.stamp', e));
    gsap.set(stamps, { opacity: 0, scale: 2.4, rotation: -32 });
    ScrollTrigger.create({
      trigger: '.engage__list', start: 'top 70%', once: true,
      onEnter: () => {
        engs.forEach((card, i) => {
          const tl = gsap.timeline({ delay: i * 0.32 });
          tl.to(stamps[i], { opacity: 0.9, scale: 1, rotation: -12, duration: 0.32, ease: 'power4.in' });
          tl.fromTo(card, { x: 0 }, { x: 2, duration: 0.05, repeat: 3, yoyo: true, ease: 'none' });
        });
      },
    });
  }

  /* =========================================================
     7. Zone d'intervention : le compas trace
     ========================================================= */
  const mapBox = qs('.zone__map');
  if (mapBox && window.Draw) {
    const svg = qs('svg[data-map]', mapBox);
    const V = window.Draw.map.views;
    const home = window.Draw.map.home();
    const ring = qs('[data-ring]', svg);
    const paca = qs('[data-paca]', svg);
    const rays = qs('[data-rays]', svg);
    const rot = qs('[data-compass-rot]', svg);
    const legs = qs('[data-legs]', svg);
    const hinge = qs('[data-hinge]', svg);
    const tip = qs('[data-tip]', svg);
    const compass = qs('[data-compass]', svg);
    const scaleLbl = qs('[data-zone-scale]');
    const btns = qsa('[data-zone]');
    const cities = qsa('[data-city]', svg);
    let cw = V.paca.w;
    function sizeLabels(w) {
      cities.forEach((c) => {
        const t = qs('text', c), ci = qs('circle', c);
        t.setAttribute('font-size', (w * 0.032).toFixed(2));
        t.setAttribute('x', (parseFloat(ci.getAttribute('cx')) + w * 0.018).toFixed(2));
        t.setAttribute('y', (parseFloat(ci.getAttribute('cy')) + w * 0.011).toFixed(2));
        ci.setAttribute('r', (w * (c.classList.contains('home') ? 0.016 : 0.009)).toFixed(2));
      });
      ring.style.strokeWidth = (w * 0.0042).toFixed(3);
    }
    let ringR = 30;
    function legLen(w) {
      const r = ringR;
      legs.setAttribute('points', `0,0 ${(r * 0.5).toFixed(2)},${(-r * 0.42).toFixed(2)} ${r.toFixed(2)},0`);
      legs.style.strokeWidth = (w * 0.005).toFixed(3);
      hinge.setAttribute('cx', (r * 0.5).toFixed(2)); hinge.setAttribute('cy', (-r * 0.42).toFixed(2)); hinge.setAttribute('r', (w * 0.012).toFixed(2));
      tip.setAttribute('cx', r.toFixed(2)); tip.setAttribute('r', (w * 0.009).toFixed(2));
    }
    function setView(key, animate) {
      const v = V[key];
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.zone === key)));
      if (scaleLbl) scaleLbl.textContent = 'Échelle : ' + v.level;
      const vb = `${(v.c[0] - v.w / 2).toFixed(1)} ${(v.c[1] - v.w / 2).toFixed(1)} ${v.w} ${v.w}`;
      const r = window.Draw.map.degToUnits(v.ring || 0.05);
      ringR = r;
      compass.style.opacity = key === 'france' ? 0 : 1;
      const show = { paca: key !== 'marseille' ? 1 : 0, rays: key === 'france' ? 1 : 0, ring: key === 'france' ? 0 : 1 };
      if (!animate || calm || !hasGsap) {
        svg.setAttribute('viewBox', vb); sizeLabels(v.w); legLen(v.w); cw = v.w;
        ring.setAttribute('r', r); ring.style.opacity = show.ring; paca.style.opacity = show.paca; rays.style.opacity = show.rays;
        ring.style.strokeDasharray = 'none';
        return;
      }
      const o = { w: cw };
      gsap.to(svg, { attr: { viewBox: vb }, duration: 1.4, ease: 'expo.inOut' });
      gsap.to(o, { w: v.w, duration: 1.4, ease: 'expo.inOut', onUpdate: () => { sizeLabels(o.w); legLen(o.w); }, onComplete: () => { cw = v.w; } });
      gsap.to(paca, { opacity: show.paca, duration: 0.8, delay: 0.6 });
      gsap.to(rays, { opacity: show.rays, duration: 0.8, delay: 0.8 });
      ring.setAttribute('r', r);
      const circ = 2 * Math.PI * r;
      ring.style.opacity = show.ring;
      if (show.ring) {
        swing(circ, 1.2, 1.1);
      }
    }
    function swing(circ, dur, delay) {
      const o = { a: 0 };
      ring.style.strokeDasharray = `${circ} ${circ}`;
      ring.style.strokeDashoffset = String(circ);
      gsap.to(o, { a: 1, duration: dur, delay, ease: 'power2.inOut', onUpdate: () => {
        ring.style.strokeDashoffset = String(circ * (1 - o.a));
        rot.setAttribute('transform', `rotate(${(o.a * 360 - 90).toFixed(2)})`);
      } });
    }
    btns.forEach((b) => b.addEventListener('click', () => setView(b.dataset.zone, true)));
    setView('paca', false);
    if (!calm && hasGsap) {
      ScrollTrigger.create({ trigger: mapBox, start: 'top 70%', once: true, onEnter: () => {
        const r = parseFloat(ring.getAttribute('r'));
        swing(2 * Math.PI * r, 1.4, 0);
      } });
    }
  }

  /* =========================================================
     8. Devis en 4 étapes (simulé)
     ========================================================= */
  const form = qs('[data-devis]');
  if (form) {
    const steps = qsa('fieldset[data-step]', form);
    const prog = qsa('.form__progress li', form);
    const prev = qs('[data-prev]', form);
    const next = qs('[data-next]', form);
    const done = qs('[data-done]', form);
    const nav = qs('.form__nav', form);
    const house = qs('.form__house svg', form);
    const surf = qs('#f-surface', form), surfOut = qs('#f-surface-out', form);
    let step = 0;
    const hParts = house ? qsa('[data-h]', house) : [];
    hParts.forEach((g) => { A.prep(g); g.style.opacity = '0'; });
    function paintHouse(n) {
      hParts.forEach((g) => {
        const k = parseInt(g.dataset.h, 10);
        const on = k <= n;
        if (on && g.style.opacity === '0') {
          g.style.opacity = '1';
          A.drawIn(g, { duration: 0.9 });
        } else if (!on && g.style.opacity !== '0') { g.style.opacity = '0'; A.prep(g); }
      });
    }
    if (surf) { const upd = () => { surfOut.textContent = surf.value >= 400 ? '400 m² et +' : `${surf.value} m²`; }; surf.addEventListener('input', upd); upd(); }
    const err = (name, msg) => { const e = qs(`[data-err="${name}"]`, form); if (e) e.textContent = msg || ''; };
    function validate(i) {
      let ok = true;
      if (i === 0) { const c = qsa('input[name="travaux"]:checked', form).length; err('travaux', c ? '' : 'Choisissez au moins un type de travaux.'); ok = !!c; }
      if (i === 1) {
        const t = qs('input[name="bien"]:checked', form); err('bien', t ? '' : 'Indiquez le type de bien.'); ok = !!t;
        const cp = qs('#f-cp', form);
        const vcp = /^\d{5}$/.test(cp.value.trim());
        cp.setAttribute('aria-invalid', String(!vcp)); err('cp', vcp ? '' : 'Saisissez un code postal à 5 chiffres, par exemple 13014.');
        ok = ok && vcp;
      }
      if (i === 2) { const d = qs('input[name="delai"]:checked', form); err('delai', d ? '' : 'Choisissez un délai.'); ok = !!d; }
      if (i === 3) {
        const nom = qs('#f-nom', form), tel = qs('#f-tel', form), mail = qs('#f-mail', form), ok1 = qs('#f-rgpd', form);
        const vn = nom.value.trim().length > 1;
        const vt = tel.value.replace(/[\s.\-]/g, '').match(/^(\+33|0)[1-9]\d{8}$/);
        const vm = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim());
        nom.setAttribute('aria-invalid', String(!vn)); err('nom', vn ? '' : 'Indiquez votre nom.');
        tel.setAttribute('aria-invalid', String(!vt)); err('tel', vt ? '' : 'Saisissez un numéro français, par exemple 06 12 34 56 78.');
        mail.setAttribute('aria-invalid', String(!vm)); err('mail', vm ? '' : 'Saisissez une adresse email valide.');
        err('rgpd', ok1.checked ? '' : 'Cochez la case pour que nous puissions vous répondre.');
        ok = vn && !!vt && vm && ok1.checked;
      }
      return ok;
    }
    function go(i) {
      steps.forEach((s, k) => { s.hidden = k !== i; });
      prog.forEach((p, k) => { if (k === i) p.setAttribute('aria-current', 'step'); else p.removeAttribute('aria-current'); p.classList.toggle('is-done', k < i); });
      prev.disabled = i === 0;
      qs('.btn__label', next).textContent = i === steps.length - 1 ? 'Envoyer la demande' : 'Continuer';
      step = i;
      paintHouse(i + 1);
      if (hasGsap && !calm) gsap.from(steps[i], { x: 24, opacity: 0, duration: 0.5, ease: 'power3.out' });
      const first = qs('input, textarea', steps[i]);
      if (first && form.__touched) first.focus({ preventScroll: true });
    }
    next.addEventListener('click', () => {
      form.__touched = true;
      if (!validate(step)) { const bad = qs('[aria-invalid="true"], .ferr:not(:empty)', steps[step]); if (bad && bad.focus) bad.focus(); return; }
      if (step < steps.length - 1) go(step + 1); else finish();
    });
    prev.addEventListener('click', () => { form.__touched = true; if (step > 0) go(step - 1); });
    form.addEventListener('submit', (e) => { e.preventDefault(); next.click(); });
    form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio') { e.preventDefault(); next.click(); } });
    function finish() {
      const val = (n) => qsa(`input[name="${n}"]:checked`, form).map((i) => i.value).join(', ');
      const rows = [
        ['Travaux', val('travaux')], ['Bien', val('bien')], ['Code postal', qs('#f-cp', form).value],
        ['Surface', surfOut ? surfOut.textContent : ''], ['Délai', val('delai')],
        ['Nom', qs('#f-nom', form).value], ['Téléphone', qs('#f-tel', form).value], ['Email', qs('#f-mail', form).value],
      ];
      qs('[data-recap]', done).innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(v || '—')}</dd>`).join('');
      steps.forEach((s) => { s.hidden = true; });
      prog.forEach((p) => { p.removeAttribute('aria-current'); p.classList.add('is-done'); });
      done.hidden = false;
      nav.hidden = true;
      paintHouse(5);
      if (hasGsap && !calm) gsap.from(done.children, { y: 20, opacity: 0, stagger: 0.08, duration: 0.6 });
      const h = qs('h3', done); h.setAttribute('tabindex', '-1'); h.focus();
    }
    qs('[data-restart]', form).addEventListener('click', () => {
      form.reset(); if (surf) surf.dispatchEvent(new Event('input'));
      done.hidden = true; nav.hidden = false; go(0);
    });
    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    function preset(name) {
      if (!name) return;
      const box = qsa('input[name="travaux"]', form).find((i) => i.value.toLowerCase() === name.toLowerCase());
      if (box) box.checked = true;
      store.del('btp-preset', true);
      if (step !== 0 && done.hidden) go(0);
    }
    document.addEventListener('devis:preset', (e) => preset(e.detail));
    preset(store.get('btp-preset', true));
    go(0);
    if (location.hash === '#devis') setTimeout(() => { const t = document.getElementById('devis'); if (t) A.scrollTo(t); }, 400);
  }
})();

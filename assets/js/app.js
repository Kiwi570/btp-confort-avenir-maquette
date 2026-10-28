/* BTP Confort Avenir — comportements communes à toutes les pages */
(function () {
  'use strict';
  const D = window.BTP_DATA || {};
  const html = document.documentElement;
  const calm = html.classList.contains('is-calm');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!window.gsap;
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const store = {
    get(k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) { /* stockage indisponible */ } },
    del(k, s) { try { (s ? sessionStorage : localStorage).removeItem(k); } catch (e) { /* stockage indisponible */ } },
  };
  const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    if (window.Flip) gsap.registerPlugin(Flip);
    gsap.defaults({ ease: 'power3.out' });
  }
  const App = window.App = { calm, fine, webgl, store, qs, qsa, lenis: null };

  /* ---------- Coordonnées ---------- */
  const todo = '<span class="todo">à compléter</span>';
  qsa('[data-bind]').forEach((el) => {
    const v = D[el.dataset.bind];
    if (v) el.textContent = v; else el.innerHTML = todo;
  });
  qsa('[data-href]').forEach((el) => { const v = D[el.dataset.href]; if (v) el.href = v; });
  qsa('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  qsa('[data-today]').forEach((el) => {
    el.textContent = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Paris' }).format(new Date());
  });

  /* ---------- Horaires et « ouvert maintenant » (heure de Paris) ---------- */
  const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  function parisNow() {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const get = (t) => (parts.find((p) => p.type === t) || {}).value;
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day: wd, h: parseInt(get('hour'), 10) + parseInt(get('minute'), 10) / 60 };
  }
  const fmtH = (h) => { const m = Math.round((h % 1) * 60); return `${Math.floor(h)} h${m ? String(m).padStart(2, '0') : ''}`; };
  App.openState = function () {
    const H = D.horaires || {};
    const now = parisNow();
    const today = H[now.day];
    if (today && now.h >= today[0] && now.h < today[1]) return { open: true, text: `Ouvert · jusqu’à ${fmtH(today[1])}` };
    for (let k = 0; k < 8; k++) {
      const d = (now.day + k) % 7;
      const h = H[d];
      if (!h) continue;
      if (k === 0 && now.h < h[0]) return { open: false, text: `Fermé · ouvre à ${fmtH(h[0])}` };
      if (k === 0) continue;
      const when = k === 1 ? 'demain' : DAYS[d];
      return { open: false, text: `Fermé · ouvre ${when} à ${fmtH(h[0])}` };
    }
    return { open: false, text: 'Horaires à compléter' };
  };
  function paintOpen() {
    const st = App.openState();
    qsa('[data-open]').forEach((el) => {
      el.classList.toggle('is-open', st.open);
      const t = qs('[data-open-txt]', el);
      if (t) t.textContent = st.text;
    });
    const now = parisNow();
    qsa('[data-hours]').forEach((el) => {
      const H = D.horaires || {};
      el.innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => {
        const h = H[d];
        const cls = d === now.day ? ' class="today"' : '';
        return `<span${cls}>${DAYS[d][0].toUpperCase() + DAYS[d].slice(1)}</span><span${cls}>${h ? `${fmtH(h[0])} – ${fmtH(h[1])}` : 'Fermé'}</span>`;
      }).join('');
    });
  }
  paintOpen();
  setInterval(paintOpen, 60000);

  /* ---------- Mode calme ---------- */
  qsa('[data-calm]').forEach((b) => {
    b.setAttribute('aria-pressed', String(calm));
    b.addEventListener('click', () => { store.set('btp-calm', calm ? '0' : '1'); location.reload(); });
  });

  /* ---------- Copier ---------- */
  qsa('[data-copy]').forEach((b) => {
    b.addEventListener('click', () => {
      const txt = b.dataset.copy;
      const done = () => { const o = b.textContent; b.textContent = 'Copié'; setTimeout(() => { b.textContent = o; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done).catch(() => selectText(b.previousElementSibling));
      } else selectText(b.previousElementSibling);
    });
  });
  function selectText(el) { if (!el) return; const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }

  /* ---------- En-tête ---------- */
  const header = qs('.header');
  let lastY = 0;
  function onScrollHeader(y) {
    if (!header) return;
    header.classList.toggle('is-solid', y > 30 || !header.hasAttribute('data-transparent'));
    const down = y > lastY + 4, up = y < lastY - 4;
    if (y > 400 && down && !html.classList.contains('menu-open')) header.classList.add('is-hidden');
    if (up || y < 200) header.classList.remove('is-hidden');
    lastY = y;
  }
  onScrollHeader(window.scrollY);
  addEventListener('scroll', () => onScrollHeader(window.scrollY), { passive: true });
  header && header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  /* ---------- Hauteurs mesurées : en-tête (--entete-h) et barre du bas (--barres-h) ---------- */
  const bar = qs('[data-bar]');
  function measureBars() {
    html.style.setProperty('--entete-h', (header ? header.offsetHeight : 0) + 'px');
    const shown = bar && getComputedStyle(bar).display !== 'none';
    html.style.setProperty('--barres-h', (shown ? bar.offsetHeight : 0) + 'px');
    html.classList.toggle('has-bar', !!shown);
  }
  measureBars();
  if (window.ResizeObserver) { const ro = new ResizeObserver(measureBars); header && ro.observe(header); bar && ro.observe(bar); }
  addEventListener('resize', measureBars);

  /* Barre du bas : apparaît après le premier écran, masquée quand le formulaire de devis ou le pied de page est à l'écran */
  if (bar && window.IntersectionObserver) {
    const seen = new Set();
    const paintBar = () => bar.classList.toggle('is-off', seen.size > 0 || window.scrollY < window.innerHeight * 0.6);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      paintBar();
    });
    qsa('#devis, .footer').forEach((el) => io.observe(el));
    paintBar();
    addEventListener('scroll', paintBar, { passive: true });
  }

  /* ---------- Menu mobile ---------- */
  const menuBtn = qs('.menu-btn');
  const menu = qs('.mobile-menu');
  function setMenu(open) {
    html.classList.toggle('menu-open', open);
    menuBtn && menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn && menuBtn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    if (menu) menu.inert = !open;
    if (App.lenis) open ? App.lenis.stop() : App.lenis.start();
    if (open && menu) { const a = qs('a', menu); a && a.focus(); }
  }
  if (menu) menu.inert = true;
  menuBtn && menuBtn.addEventListener('click', () => setMenu(!html.classList.contains('menu-open')));
  menu && menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && html.classList.contains('menu-open')) { setMenu(false); menuBtn && menuBtn.focus(); } });

  /* ---------- Défilement fluide ---------- */
  if (!calm && window.Lenis && hasGsap) {
    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 });
    App.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(500, 33);
  }
  App.scrollTo = function (target) {
    const off = -(header ? header.offsetHeight : 0) - 8;
    if (App.lenis) App.lenis.scrollTo(target, { offset: off, duration: 1.3 });
    else { const y = target.getBoundingClientRect().top + window.scrollY + off; window.scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' }); }
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    setTimeout(() => target.focus({ preventScroll: true }), calm ? 0 : 900);
  };

  /* ---------- Liens : ancres, préréglage du devis, transition de calque ---------- */
  const sheet = qs('.sheet');
  const sheetName = qs('[data-sheet-name]');
  const samePage = (u) => u.origin === location.origin && u.pathname.replace(/(index)?(\.html)?$/, '') === location.pathname.replace(/(index)?(\.html)?$/, '');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.dataset.preset) store.set('btp-preset', a.dataset.preset, true);
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (/^(mailto:|tel:|sms:)/.test(href)) return;
    let u;
    try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin !== location.origin) return;
    if (samePage(u)) {
      if (!u.hash) return;
      const t = document.getElementById(decodeURIComponent(u.hash.slice(1)));
      if (!t) return;
      e.preventDefault();
      if (a.dataset.preset) document.dispatchEvent(new CustomEvent('devis:preset', { detail: a.dataset.preset }));
      App.scrollTo(t);
      return;
    }
    if (!sheet || calm || !hasGsap) return;
    e.preventDefault();
    if (sheetName) sheetName.textContent = a.dataset.name || a.textContent.trim().replace(/\s+/g, ' ').slice(0, 40);
    store.set('btp-sheet', '1', true);
    gsap.fromTo(sheet, { yPercent: 101 }, { yPercent: 0, duration: 0.7, ease: 'expo.inOut', onComplete: () => { location.href = a.href; } });
  });
  if (sheet && html.classList.contains('from-sheet') && hasGsap) {
    store.del('btp-sheet', true);
    gsap.set(sheet, { yPercent: 0 });
    html.classList.remove('from-sheet');
    gsap.to(sheet, { yPercent: -101, duration: 0.9, ease: 'expo.inOut', delay: 0.15 });
  } else if (html.classList.contains('from-sheet')) { html.classList.remove('from-sheet'); store.del('btp-sheet', true); }
  addEventListener('pageshow', (e) => { if (e.persisted && sheet && hasGsap) gsap.set(sheet, { yPercent: 101 }); });

  /* ---------- Curseur réticule ---------- */
  const ret = qs('.reticle');
  if (ret && fine && !calm && hasGsap) {
    html.classList.add('has-reticle');
    const lbl = qs('.reticle__lbl', ret);
    const xTo = gsap.quickTo(ret, 'x', { duration: 0.25, ease: 'power3' });
    const yTo = gsap.quickTo(ret, 'y', { duration: 0.25, ease: 'power3' });
    const mm = (v) => String(Math.round(v * 0.2646)).padStart(4, '0');
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!html.classList.contains('reticle-moved')) { gsap.set(ret, { x: e.clientX, y: e.clientY }); html.classList.add('reticle-moved'); }
      xTo(e.clientX); yTo(e.clientY);
      lbl.textContent = `X ${mm(e.clientX)} · Y ${mm(e.clientY + window.scrollY)}`;
      const t = e.target;
      ret.classList.toggle('is-hover', !!(t.closest && t.closest('a, button, label, input[type="range"], summary, [data-hover]')));
      ret.classList.toggle('on-dark', !!(t.closest && t.closest('.is-dark, .hero, .footer, .band, .mobile-menu, .planche__photo, .dlg__media')));
    }, { passive: true });
    document.addEventListener('pointerleave', () => { ret.style.opacity = '0'; });
    document.addEventListener('pointerenter', () => { ret.style.opacity = ''; });
  }

  /* ---------- Boutons magnétiques ---------- */
  if (fine && !calm && hasGsap) {
    qsa('.js-magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, .5)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, .5)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Traits de plan : préparation et tracé ---------- */
  const GEOM = 'path, line, polyline, polygon, rect, circle, ellipse';
  App.prep = function (root) {
    const els = qsa(GEOM, root).filter((el) => !el.classList.contains('nodraw') && !el.closest('.nodraw-g, defs, pattern, filter, text'));
    els.forEach((el) => {
      let len = 0;
      try { len = el.getTotalLength(); } catch (e) { len = 0; }
      if (!len) return;
      el.style.strokeDasharray = `${len} ${len}`;
      el.style.strokeDashoffset = String(len);
      el.__len = len;
    });
    return els.filter((el) => el.__len);
  };
  App.drawIn = function (root, opts = {}) {
    const els = App.prep(root);
    if (calm || !hasGsap) { els.forEach((el) => { el.style.strokeDashoffset = '0'; }); return null; }
    return gsap.to(els, Object.assign({ strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: { each: 0.012 } }, opts));
  };
  App.finish = function (root) { qsa(GEOM, root).forEach((el) => { if (el.__len) el.style.strokeDashoffset = '0'; }); };

  /* Dessins tracés à l'entrée dans l'écran */
  qsa('[data-draw-on-view]').forEach((el) => {
    if (calm || !hasGsap) return;
    App.prep(el);
    ScrollTrigger.create({ trigger: el, start: 'top 82%', once: true, onEnter: () => App.drawIn(el, { duration: 1.4 }) });
  });

  /* ---------- Révélations ---------- */
  function initReveals() {
    if (calm || !hasGsap) return;
    qsa('[data-split]').forEach((el) => {
      if (!window.SplitText) return;
      const sp = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
      gsap.from(sp.lines, { yPercent: 105, duration: 1.1, ease: 'power4.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
    });
    qsa('[data-reveal="mask"]').forEach((el) => {
      const img = qs('img', el);
      gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      if (img) gsap.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    qsa('[data-parallax]').forEach((img) => {
      const box = img.parentElement;
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    qsa('[data-fade]').forEach((el) => {
      gsap.from(el.children, { y: 24, opacity: 0, duration: 0.9, stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  }
  App.countUp = function (el) {
    const end = parseFloat(el.dataset.count);
    const suf = el.dataset.suffix || '';
    if (calm || !hasGsap) { el.textContent = end + suf; return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v) + suf; }, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  };
  qsa('[data-count]').forEach(App.countUp);

  /* ---------- Avant / après au réglet ---------- */
  App.initBA = function (el) {
    if (!el || el.__ba) return;
    el.__ba = true;
    const range = qs('.ba__range', el);
    const val = qs('.ba__val', el);
    const rule = qs('.ba__rule', el);
    if (rule && window.Draw && !qs('svg', rule)) rule.insertAdjacentHTML('afterbegin', window.Draw.reglet(1400));
    const set = (v) => {
      el.style.setProperty('--pos', v + '%');
      if (val) val.textContent = `Avant ${Math.round(v)} % · Après ${Math.round(100 - v)} %`;
    };
    range.addEventListener('input', () => set(range.value));
    set(range.value);
    if (calm || !hasGsap) return;
    const scan = qs('.ba__scan', el);
    const o = { v: 82 };
    ScrollTrigger.create({
      trigger: el, start: 'top 72%', once: true,
      onEnter: () => {
        if (scan) gsap.fromTo(scan, { top: '0%', opacity: 1 }, { top: '100%', duration: 1.3, ease: 'power1.inOut', onComplete: () => gsap.to(scan, { opacity: 0, duration: 0.3 }) });
        gsap.fromTo(o, { v: 86 }, { v: 50, duration: 1.6, delay: 0.9, ease: 'expo.inOut', onUpdate: () => { range.value = o.v; set(o.v); } });
      },
    });
  };
  qsa('[data-ba]').forEach(App.initBA);

  /* ---------- Démarrage ---------- */
  const start = () => { initReveals(); if (hasGsap) ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
  addEventListener('load', () => { if (hasGsap) ScrollTrigger.refresh(); });
})();

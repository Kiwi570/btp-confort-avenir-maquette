/* BTP Confort Avenir — page Réalisations : filtres et fiches chantier dépliables */
(function () {
  'use strict';
  const A = window.App;
  if (!A) return;
  const { calm, qs, qsa } = A;
  const hasGsap = !!window.gsap;

  const title = qs('[data-iso-title]');
  if (title && hasGsap && !calm && window.SplitText) {
    const sp = new SplitText(title, { type: 'words,chars', mask: 'words', wordsClass: 'w' });
    gsap.from(sp.chars, { yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: 0.03, delay: 0.25 });
  }

  /* Filtres */
  const gal = qs('[data-gallery]');
  const items = qsa('.fiche', gal);
  const chips = qsa('[data-filter]');
  const cats = chips.map((c) => c.dataset.filter);
  function filter(cat, animate) {
    if (!cats.includes(cat)) cat = 'tout';
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === cat)));
    const apply = () => items.forEach((it) => { it.hidden = !(cat === 'tout' || it.dataset.cat === cat); });
    if (!animate || calm || !hasGsap || !window.Flip) { apply(); return; }
    const state = Flip.getState(items);
    apply();
    Flip.from(state, {
      duration: 0.65, ease: 'power3.inOut', absolute: true, scale: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.5 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.35 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }
  chips.forEach((c) => c.addEventListener('click', () => filter(c.dataset.filter, true)));
  const fromHash = () => location.hash.replace('#', '');
  filter(fromHash() || 'tout', false);
  if (fromHash() && cats.includes(fromHash())) setTimeout(() => { const g = document.getElementById('galerie'); if (g) A.scrollTo(g); }, 500);
  addEventListener('hashchange', () => filter(fromHash(), true));

  if (hasGsap && !calm) {
    gsap.from(items, { y: 40, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: gal, start: 'top 85%', once: true } });
  }

  /* Fiche chantier dépliable */
  const dlg = qs('#fiche-dlg');
  const media = qs('[data-dlg-media]', dlg);
  const panel = qs('.dlg__panel', dlg);
  const baTpl = qs('.real-hero .ba');
  let uid = 0;
  function open(btn) {
    media.innerHTML = '';
    if (btn.dataset.hasBa && baTpl) {
      const c = baTpl.cloneNode(true);
      c.__ba = false;
      c.classList.remove('ba--wide');
      const r = qs('.ba__range', c); r.id = 'ba-dlg-' + (++uid); r.value = 50;
      const rule = qs('.ba__rule', c); const old = qs('svg', rule); if (old && old.parentElement === rule) old.remove();
      qsa('img', c).forEach((im) => { im.loading = 'eager'; });
      media.appendChild(c);
      A.initBA(c);
    } else {
      const im = qs('img', btn).cloneNode();
      im.loading = 'eager';
      im.sizes = '(min-width: 800px) 60vw, 100vw';
      media.appendChild(im);
    }
    qs('[data-dlg-title]', dlg).textContent = btn.dataset.title;
    qs('[data-dlg-metier]', dlg).textContent = btn.dataset.metier;
    qs('[data-dlg-num]', dlg).textContent = 'Fiche chantier · ' + (qs('.fiche__meta .mono', btn) || {}).textContent;
    dlg.showModal();
    if (A.lenis) A.lenis.stop();
    if (hasGsap && !calm) {
      gsap.fromTo(panel, { rotateY: -96, opacity: 0.2 }, { rotateY: 0, opacity: 1, duration: 0.9, ease: 'expo.out' });
      gsap.fromTo(media, { clipPath: 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'expo.inOut' });
    }
  }
  items.forEach((it) => { if (it.tagName === 'BUTTON') it.addEventListener('click', () => open(it)); });
  function close() { dlg.close(); }
  qs('[data-close]', dlg).addEventListener('click', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener('close', () => { if (A.lenis) A.lenis.start(); });
})();

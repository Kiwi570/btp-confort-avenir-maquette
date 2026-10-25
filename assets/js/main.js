/* BTP Confort Avenir — maquette « Du plan au chantier »
   Animations : GSAP + ScrollTrigger + SplitText, défilement Lenis, WebGL OGL. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var CALM = root.classList.contains('calm');
  var G = window.gsap, ST = window.ScrollTrigger;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var PAGE = root.getAttribute('data-page');
  var isDesk = function () { return window.innerWidth >= 1024; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  function mod(name, fn) { try { fn(); } catch (e) { if (window.console) console.warn('[btpca] ' + name, e); } }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  var WEBGL = (function () {
    if (!window.OGL || /[?&]sans-webgl/.test(location.search)) return false;
    try { var c = d.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; }
  })();
  root.classList.add(WEBGL ? 'webgl' : 'no-webgl');

  if (G) {
    G.registerPlugin(ST);
    if (window.SplitText) G.registerPlugin(window.SplitText);
    G.defaults({ ease: 'power3.out', duration: 1 });
  }

  /* ---------------------------------------------------------------- mode calme */
  mod('calm', function () {
    $$('[data-calm-toggle] b').forEach(function (b) { b.textContent = CALM ? 'oui' : 'non'; });
    $$('[data-calm-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', CALM ? 'true' : 'false');
      btn.addEventListener('click', function () {
        var v = CALM ? '0' : '1';
        try { localStorage.setItem('btpca-calm', v); } catch (e) {}
        window.name = 'btpca-calm=' + v;
        location.reload();
      });
    });
  });

  /* ---------------------------------------------------------------- défilement fluide */
  var lenis = null;
  mod('lenis', function () {
    if (CALM || !window.Lenis || !G) return;
    lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  });
  function headerOffset() { return -(($('[data-header]') || {}).offsetHeight || 70) - 8; }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: headerOffset(), duration: 1.4 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + headerOffset(), behavior: CALM ? 'auto' : 'smooth' });
  }

  /* ---------------------------------------------------------------- liens d'ancre et transitions de page */
  mod('links', function () {
    var curtain = $('[data-curtain]');
    var here = location.pathname.split('/').pop() || 'index.html';
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      var href = a.getAttribute('href');
      if (/^(tel:|mailto:|https?:)/.test(href)) return;
      var parts = href.split('#'), file = parts[0], hash = parts[1];
      var samePage = !file || file === here || (file === 'index.html' && (here === '' || here === 'index' || here === 'index.html')) || file.replace('.html', '') === here.replace('.html', '');
      if (samePage && hash) {
        var t = d.getElementById(hash);
        if (t) { e.preventDefault(); closeMenu(); scrollToEl(t); history.replaceState(null, '', '#' + hash); }
        return;
      }
      if (!file || !/\.html$/.test(file)) return;
      if (CALM || !G || !curtain) return;
      e.preventDefault();
      closeMenu();
      store('btpca-curtain', '1');
      $('[data-curtain-label]').textContent = 'Planche suivante · ' + (a.textContent || '').trim().slice(0, 40);
      G.set(curtain, { transformOrigin: 'bottom', scaleY: 0 });
      G.to(curtain, { scaleY: 1, duration: 0.55, ease: 'power3.inOut', onComplete: function () { location.href = href; } });
    });
    if (curtain && G) {
      if (store('btpca-curtain') === '1' && !CALM) {
        store('btpca-curtain', '0');
        G.set(curtain, { scaleY: 1, transformOrigin: 'top' });
        G.to(curtain, { scaleY: 0, duration: 0.8, ease: 'power3.inOut', delay: 0.05 });
      }
      window.addEventListener('pageshow', function (ev) { if (ev.persisted) G.set(curtain, { scaleY: 0 }); });
    }
    if (location.hash && location.hash.length > 1) {
      var target = d.getElementById(location.hash.slice(1));
      if (target) window.addEventListener('load', function () { setTimeout(function () { scrollToEl(target); }, 120); });
    }
  });

  /* ---------------------------------------------------------------- en-tête et menu */
  function closeMenu() {
    if (!root.classList.contains('menu-open')) return;
    root.classList.remove('menu-open');
    var b = $('[data-burger]'); if (b) { b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Ouvrir le menu'); }
    var m = $('[data-menu]'); if (m) m.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
  }
  mod('header', function () {
    var h = $('[data-header]'); if (!h) return;
    var last = 0;
    function onScroll() {
      var y = window.scrollY;
      h.classList.toggle('is-solid', y > 30);
      if (!CALM && !root.classList.contains('menu-open')) h.classList.toggle('is-hidden', y > 500 && y > last + 2);
      if (y < last - 2) h.classList.remove('is-hidden');
      last = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    var b = $('[data-burger]'), m = $('[data-menu]');
    if (b && m) {
      b.addEventListener('click', function () {
        var open = !root.classList.contains('menu-open');
        if (!open) return closeMenu();
        root.classList.add('menu-open');
        b.setAttribute('aria-expanded', 'true'); b.setAttribute('aria-label', 'Fermer le menu');
        m.setAttribute('aria-hidden', 'false');
        if (lenis) lenis.stop();
        if (G && !CALM) G.from($$('nav a', m), { y: 40, opacity: 0, stagger: 0.05, duration: 0.7, delay: 0.15 });
      });
      d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    }
  });

  /* ---------------------------------------------------------------- curseur réticule */
  mod('cursor', function () {
    var c = $('[data-cursor]'); if (!c || !FINE || CALM || !G) return;
    var xy = $('[data-xy]', c);
    var qx = G.quickTo(c, 'x', { duration: 0.18, ease: 'power3' }), qy = G.quickTo(c, 'y', { duration: 0.18, ease: 'power3' });
    var pad = function (n) { return ('0000' + Math.round(n)).slice(-4); };
    window.addEventListener('mousemove', function (e) {
      root.classList.add('has-cursor');
      qx(e.clientX); qy(e.clientY);
      xy.textContent = 'X ' + pad(e.clientX) + ' · Y ' + pad(e.clientY + window.scrollY);
    }, { passive: true });
    d.addEventListener('mouseleave', function () { root.classList.remove('has-cursor'); });
    d.addEventListener('mouseover', function (e) {
      var t = e.target.closest && e.target.closest('a, button, [data-tilt], [data-compare], label.chip, .cs-frame');
      c.classList.toggle('is-hover', !!t);
    });
  });

  /* ---------------------------------------------------------------- boutons magnétiques */
  mod('magnetic', function () {
    if (!FINE || CALM || !G) return;
    $$('.magnetic').forEach(function (el) {
      var qx = G.quickTo(el, 'x', { duration: 0.4, ease: 'power3' }), qy = G.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.28); qy((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('mouseleave', function () { qx(0); qy(0); });
    });
  });

  /* ---------------------------------------------------------------- tracé SVG */
  function prepDraw(els) {
    els.forEach(function (p) {
      if (!p.getTotalLength) return;
      var L = 0; try { L = p.getTotalLength(); } catch (e) {}
      if (!L) return;
      p.style.strokeDasharray = L + ' ' + L;
      p.style.strokeDashoffset = L;
    });
    return els;
  }
  function draw(els, o) {
    o = o || {};
    return G.to(els, { strokeDashoffset: 0, duration: o.duration || 1.2, ease: o.ease || 'power2.inOut', stagger: o.stagger === undefined ? 0.03 : o.stagger, delay: o.delay || 0, scrollTrigger: o.scrollTrigger });
  }

  /* ---------------------------------------------------------------- textes et révélations */
  function splits() {
    if (CALM || !G || !window.SplitText) return;
    $$('[data-split]').forEach(function (el) {
      window.SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
        onSplit: function (self) {
          return G.from(self.lines, { yPercent: 115, duration: 1.15, ease: 'power4.out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
        }
      });
    });
  }
  mod('reveal', function () {
    if (CALM || !G) return;
    $$('[data-reveal]').forEach(function (el) {
      G.from(el, { y: 34, opacity: 0, duration: 1.1, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    // le plan devient photo : voile bleu qui se retire, image qui se pose
    $$('.visual .frame').forEach(function (fr) {
      var im = $('img', fr), ph = $('.ph', fr);
      if (im) {
        var veil = d.createElement('span');
        veil.className = 'veil'; veil.setAttribute('aria-hidden', 'true');
        veil.style.cssText = 'position:absolute;inset:0;z-index:2;background-color:#10305A;background-image:linear-gradient(rgba(220,231,245,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(220,231,245,.14) 1px,transparent 1px);background-size:24px 24px;transform-origin:top;pointer-events:none';
        fr.appendChild(veil);
        var tl = G.timeline({ scrollTrigger: { trigger: fr, start: 'top 85%', once: true } });
        tl.fromTo(veil, { scaleY: 1 }, { scaleY: 0, duration: 1.2, ease: 'power4.inOut' })
          .fromTo(im, { scale: 1.25 }, { scale: 1, duration: 1.6, ease: 'power3.out' }, 0);
        if (fr.hasAttribute('data-parallax')) {
          G.fromTo(im, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: fr, start: 'top bottom', end: 'bottom top', scrub: true } });
          im.style.height = '112%'; im.style.top = '-6%';
        }
      }
      if (ph) {
        var paths = prepDraw($$('svg path, svg circle', ph));
        draw(paths, { duration: 1.4, stagger: 0.025, scrollTrigger: { trigger: fr, start: 'top 85%', once: true } });
      }
    });
    $$('[data-parallax-bg] img').forEach(function (im) {
      G.fromTo(im, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: im.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  /* ---------------------------------------------------------------- compteurs */
  mod('counters', function () {
    $$('[data-count]').forEach(function (el) {
      var n = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', pad = +(el.getAttribute('data-pad') || 0);
      var fmt = function (v) { var s = String(Math.round(v)); while (s.length < pad) s = '0' + s; return s + suf; };
      if (CALM || !G) { el.textContent = fmt(n); return; }
      var o = { v: 0 }; el.textContent = fmt(0);
      G.to(o, { v: n, duration: 2, ease: 'power2.out', onUpdate: function () { el.textContent = fmt(o.v); }, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  });

  /* ---------------------------------------------------------------- cartouche vivant et niveau à bulle */
  mod('cartouche', function () {
    var c = $('[data-cartouche]'); if (!c || !ST) return;
    var pl = $('[data-c-pl]', c), ti = $('[data-c-title]', c), sc = $('[data-c-scale]', c), vial = $('[data-vial]', c), wrapV = $('[data-vial-wrap]', c);
    function set(s) {
      pl.textContent = s.getAttribute('data-sheet') || '';
      ti.textContent = s.getAttribute('data-title') || '';
      sc.textContent = s.getAttribute('data-scale') || '';
    }
    $$('[data-sheet]').forEach(function (s) {
      ST.create({
        trigger: s, start: 'top 55%', end: 'bottom 55%',
        onToggle: function (self) { if (self.isActive) set(s); if (s.getAttribute('data-sheet') === '99') c.classList.toggle('is-off', self.isActive); },
        onUpdate: function (self) {
          var off = (self.progress - 0.5) * 2;
          vial.style.transform = 'translateX(' + (off * 28).toFixed(1) + 'px)';
          wrapV.classList.toggle('is-level', Math.abs(off) < 0.12);
        }
      });
    });
  });

  /* ---------------------------------------------------------------- héro : surimpression du plan */
  function buildHeroSvg(svg, frame) {
    var W = frame.clientWidth, H = frame.clientHeight, NS = 'http://www.w3.org/2000/svg', o = [];
    var p = function (dd, cls) { o.push('<path class="' + (cls || '') + '" d="' + dd + '" fill="none" stroke="currentColor" stroke-width="1"/>'); };
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    p('M0 0H' + W + 'V' + H + 'H0Z');
    var cols = [0, W / 3, 2 * W / 3, W], L = ['A', 'B', 'C', 'D'];
    cols.forEach(function (x, i) {
      p('M' + x + ' -18V' + (H + 8), 'dash');
      o.push('<circle cx="' + x + '" cy="-30" r="11" fill="none" stroke="currentColor" stroke-width="1"/><text x="' + x + '" y="-26" text-anchor="middle">' + L[i] + '</text>');
    });
    [0, H / 2, H].forEach(function (y, i) {
      p('M-18 ' + y + 'H' + (W + 8), 'dash opt');
      o.push('<g class="opt"><circle cx="-30" cy="' + y + '" r="11" fill="none" stroke="currentColor" stroke-width="1"/><text x="-30" y="' + (y + 4) + '" text-anchor="middle">' + (i + 1) + '</text></g>');
    });
    p('M0 ' + (H + 22) + 'H' + W + 'M0 ' + (H + 15) + 'V' + (H + 29) + 'M' + W + ' ' + (H + 15) + 'V' + (H + 29));
    p('M' + (W + 20) + ' 0V' + H + 'M' + (W + 13) + ' 0H' + (W + 27) + 'M' + (W + 13) + ' ' + H + 'H' + (W + 27), 'opt');
    var hx = W - 64, hy = 0;
    for (var k = 0; k < 9; k++) p('M' + (hx + k * 8) + ' ' + hy + 'L' + (hx + k * 8 - 14) + ' ' + (hy + 14), 'hatch');
    o.push('<text x="' + (W - 6) + '" y="' + (H + 40) + '" text-anchor="end" class="opt">éch. 1:100</text>');
    svg.innerHTML = o.join('');
    $$('.dash', svg).forEach(function (e) { e.setAttribute('stroke-dasharray', '3 5'); e.setAttribute('opacity', '.55'); });
    $$('.hatch', svg).forEach(function (e) { e.setAttribute('stroke', '#E9A06A'); });
    return svg;
  }

  /* ---------------------------------------------------------------- héro WebGL */
  var heroGL = null;
  mod('heroGL', function () {
    var canvas = $('[data-hero-canvas]'), frame = $('[data-hero-frame]'), img = $('[data-hero-img]');
    if (!canvas || !frame || !img || !WEBGL) return;
    var O = window.OGL;
    var renderer = new O.Renderer({ canvas: canvas, dpr: Math.min(window.devicePixelRatio || 1, 1.75), alpha: false, antialias: false });
    var gl = renderer.gl;
    gl.clearColor(0.063, 0.188, 0.353, 1);
    var tex = new O.Texture(gl, { flipY: false, generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
    var u = {
      uTex: { value: tex }, uRes: { value: [1, 1] }, uRect: { value: [0, 0, 1, 1] }, uMouse: { value: [-999, -999] }, uHover: { value: 0 },
      uReveal: { value: CALM ? 1 : 0 }, uImgSize: { value: [2048, 1315] }, uTime: { value: 0 }, uDpr: { value: renderer.dpr }, uLoaded: { value: 0 }
    };
    var vert = 'attribute vec2 uv;attribute vec2 position;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,0.,1.);}';
    var frag = [
      'precision highp float;',
      'uniform sampler2D uTex;uniform vec2 uRes;uniform vec4 uRect;uniform vec2 uMouse;uniform float uHover;uniform float uReveal;uniform vec2 uImgSize;uniform float uTime;uniform float uDpr;uniform float uLoaded;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
      'float gridL(vec2 p,float s,float w){vec2 g=abs(fract(p/s-.5)-.5)*s;return 1.-smoothstep(0.,w,min(g.x,g.y));}',
      'float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}',
      'void main(){',
      ' vec2 px=vec2(gl_FragCoord.x,uRes.y*uDpr-gl_FragCoord.y)/uDpr;',
      ' vec2 dm=px-uMouse;float fall=exp(-dot(dm,dm)/(170.*170.))*uHover;',
      ' vec2 wp=px-dm*fall*.22;',
      ' vec2 sp=px/uRes;',
      ' vec3 bg=vec3(.063,.188,.353)*(.78+.32*(1.-length(sp-vec2(.3,.45))));',
      ' float g=gridL(wp,24.,1.)*.06+gridL(wp,120.,1.2)*.12;',
      ' vec3 col=bg+vec3(.86,.9,.96)*g*(1.+fall*3.);',
      ' vec2 q=(px-uRect.xy)/uRect.zw;',
      ' if(q.x>0.&&q.x<1.&&q.y>0.&&q.y<1.&&uLoaded>.5){',
      '  float ra=uRect.z/uRect.w,ri=uImgSize.x/uImgSize.y;vec2 uv=q;',
      '  if(ra>ri){uv.y=(q.y-.5)*(ri/ra)+.5;}else{uv.x=(q.x-.5)*(ra/ri)+.5;}',
      '  float lf=exp(-dot(dm,dm)/(130.*130.))*uHover;uv-=(dm/uRect.zw)*.035*lf;',
      '  vec3 c=texture2D(uTex,uv).rgb;float l=lum(c);',
      '  vec2 tx=1.4/uRect.zw;',
      '  float e=clamp((abs(l-lum(texture2D(uTex,uv+vec2(tx.x,0.)).rgb))+abs(l-lum(texture2D(uTex,uv+vec2(0.,tx.y)).rgb)))*5.5,0.,1.);',
      '  vec3 blue=mix(vec3(.035,.11,.23),vec3(.5,.64,.82),smoothstep(.08,.92,l));',
      '  blue=mix(blue,vec3(.93,.96,1.),e*.85)+vec3(.86,.9,.96)*gridL(px-uRect.xy,24.,1.)*.05;',
      '  float n=noise(q*vec2(7.,4.)+uTime*.06);',
      '  float sw=(1.-q.y)*.62+q.x*.22+n*.32;',
      '  float th=uReveal*1.32-.08;',
      '  float m=smoothstep(th,th-.07,sw);',
      '  float lens=smoothstep(100.,86.,length(dm))*uHover*step(.995,uReveal);',
      '  m*=1.-lens;',
      '  vec3 ic=mix(blue,c*1.03,m);',
      '  float edge=smoothstep(.028,0.,abs(sw-th+.035))*(1.-step(.995,uReveal));',
      '  ic=mix(ic,vec3(.913,.627,.416),edge*.95);',
      '  float ring=smoothstep(1.6,0.,abs(length(dm)-93.))*uHover*step(.995,uReveal);',
      '  col=mix(ic,vec3(.913,.627,.416),ring);',
      ' }',
      ' gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n');
    var program = new O.Program(gl, { vertex: vert, fragment: frag, uniforms: u });
    var mesh = new O.Mesh(gl, { geometry: new O.Triangle(gl), program: program });
    var image = new Image();
    image.onload = function () { tex.image = image; u.uImgSize.value = [image.naturalWidth, image.naturalHeight]; u.uLoaded.value = 1; };
    image.src = img.currentSrc || img.src;
    if (!img.complete) img.addEventListener('load', function () { if (image.src !== (img.currentSrc || img.src)) image.src = img.currentSrc || img.src; });
    var hero = canvas.parentElement, visible = true, mx = -999, my = -999, hoverT = 0;
    function resize() {
      var r = hero.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      u.uRes.value = [r.width, r.height];
    }
    resize(); window.addEventListener('resize', resize);
    hero.addEventListener('mousemove', function (e) { var r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; hoverT = CALM ? 0 : 1; });
    hero.addEventListener('mouseleave', function () { hoverT = 0; });
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);
    var sm = [-999, -999];
    function frameLoop(t) {
      if (visible) {
        var cr = canvas.getBoundingClientRect(), fr = frame.getBoundingClientRect();
        u.uRect.value = [fr.left - cr.left, fr.top - cr.top, fr.width, fr.height];
        if (sm[0] < -900) sm = [mx, my];
        sm[0] += (mx - sm[0]) * 0.12; sm[1] += (my - sm[1]) * 0.12;
        u.uMouse.value = sm;
        u.uHover.value += (hoverT - u.uHover.value) * 0.06;
        u.uTime.value = t / 1000;
        renderer.render({ scene: mesh });
      }
      requestAnimationFrame(frameLoop);
    }
    requestAnimationFrame(frameLoop);
    heroGL = { u: u };
  });

  /* ---------------------------------------------------------------- ouverture orchestrée */
  mod('intro', function () {
    var intro = $('[data-intro]'), frame = $('[data-hero-frame]'), svg = $('[data-hero-svg]');
    if (svg && frame) {
      buildHeroSvg(svg, frame);
      var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { buildHeroSvg(svg, frame); }, 150); });
    }
    if (!intro) return;
    var seen = store('btpca-intro') === '1';
    if (CALM || !G) { intro.remove(); return; }
    var tl = G.timeline();
    if (!seen) {
      store('btpca-intro', '1');
      var type = $('[data-i-type]', intro), count = $('[data-i-count]', intro), msg = 'BTP Confort Avenir — Planche 01 — Marseille 13014', c = { v: 0 }, ty = { n: 0 };
      if (lenis) lenis.stop();
      tl.from($$('.lh', intro), { scaleX: 0, duration: 0.6, ease: 'power3.inOut', stagger: 0.08 })
        .from($$('.lv', intro), { scaleY: 0, duration: 0.6, ease: 'power3.inOut', stagger: 0.08 }, 0.1)
        .to($('.i-logo', intro), { opacity: 1, duration: 0.5 }, 0.25)
        .to(ty, { n: msg.length, duration: 0.7, ease: 'none', onUpdate: function () { type.textContent = msg.slice(0, Math.round(ty.n)); } }, 0.2)
        .to(c, { v: 100, duration: 1.0, ease: 'power2.inOut', onUpdate: function () { count.textContent = ('00' + Math.round(c.v)).slice(-3); } }, 0.2)
        .to(intro, { clipPath: 'inset(0 0 100% 0)', duration: 0.65, ease: 'power4.inOut', onComplete: function () { intro.remove(); if (lenis) lenis.start(); } }, 1.3);
    } else {
      intro.remove();
    }
    var at = seen ? 0.15 : 1.45;
    tl.from('[data-hero-title] .line > span', { yPercent: 115, duration: 1.15, ease: 'power4.out', stagger: 0.09 }, at)
      .from('[data-hero-fade]', { y: 26, opacity: 0, stagger: 0.08, duration: 0.9 }, at + 0.35);
    if (svg) {
      var paths = prepDraw($$('path, circle', svg));
      tl.add(draw(paths, { duration: 1.1, stagger: 0.02 }), at + 0.1);
      tl.from($$('text', svg), { opacity: 0, duration: 0.4, stagger: 0.03 }, at + 0.6);
    }
    if (heroGL) tl.to(heroGL.u.uReveal, { value: 1, duration: 1.7, ease: 'power2.inOut' }, at + 0.05);
    else if (frame) tl.fromTo(frame, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'power4.inOut' }, at);
  });

  /* ---------------------------------------------------------------- métiers : coupe de mur */
  mod('wall', function () {
    var svg = $('.wall-svg'); if (!svg || !ST) return;
    var layers = $$('.layer', svg), legend = $$('[data-wall-legend] span'), bubbles = $$('.bubble', svg), drawn = {};
    layers.forEach(function (l) { l._paths = $$('.ln', l); });
    if (!CALM && G) layers.forEach(function (l) { prepDraw(l._paths); });
    function setActive(n) {
      layers.forEach(function (l, i) {
        var k = i + 1;
        l.classList.toggle('is-active', k === n);
        l.classList.toggle('is-done', k < n);
        l.classList.toggle('is-future', k > n);
        if (k <= n && !drawn[k] && !CALM && G) { drawn[k] = 1; draw(l._paths, { duration: k === n ? 1.4 : 0.6, stagger: 0.012 }); }
      });
      legend.forEach(function (s, i) { s.classList.toggle('is-active', i + 1 === n); s.classList.toggle('is-done', i + 1 < n); });
      bubbles.forEach(function (b, i) { b.style.opacity = i + 1 <= n ? 1 : 0.25; b.style.color = i + 1 === n ? '#E9A06A' : ''; });
    }
    setActive(1);
    $$('[data-trade]').forEach(function (t) {
      var n = +t.getAttribute('data-trade');
      ST.create({ trigger: t, start: 'top 62%', end: 'bottom 62%', onToggle: function (s) { if (s.isActive) setActive(n); } });
    });
  });

  /* ---------------------------------------------------------------- avant / après */
  mod('compare', function () {
    $$('[data-compare]').forEach(function (box) {
      var range = $('[data-compare-range]', box), out = $('[data-readout]', box);
      function set(v) {
        v = clamp(v, 0, 100);
        box.style.setProperty('--pos', v + '%');
        range.value = v;
        out.textContent = 'Avant ' + Math.round(v) + ' % · Après ' + Math.round(100 - v) + ' %';
      }
      range.addEventListener('input', function () { set(+range.value); });
      range.style.pointerEvents = 'none';
      var dragging = false;
      function fromEvent(e) { var r = box.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
      box.addEventListener('pointerdown', function (e) { dragging = true; box.setPointerCapture(e.pointerId); fromEvent(e); range.focus({ preventScroll: true }); });
      box.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
      box.addEventListener('pointerup', function () { dragging = false; });
      box.addEventListener('pointercancel', function () { dragging = false; });
      set(50);
      if (!CALM && G) {
        var o = { v: 100 };
        G.to(o, { v: 50, duration: 1.8, ease: 'power3.inOut', onUpdate: function () { if (!dragging) set(o.v); }, scrollTrigger: { trigger: box, start: 'top 75%', once: true }, onStart: function () { set(100); } });
      }
    });
  });

  /* ---------------------------------------------------------------- activités : galerie horizontale */
  mod('hscroll', function () {
    var sec = $('[data-hscroll]'); if (!sec) return;
    var track = $('[data-h-track]', sec), scroller = $('[data-h-scroller]', sec), bar = $('[data-h-progress]', sec);
    var setBar = function (p) { if (bar) bar.style.transform = 'scaleX(' + p.toFixed(3) + ')'; };
    scroller.addEventListener('scroll', function () { var m = scroller.scrollWidth - scroller.clientWidth; setBar(m > 0 ? scroller.scrollLeft / m : 0); }, { passive: true });
    if (CALM || !G) return;
    var mm = G.matchMedia();
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', function () {
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tween = G.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, onUpdate: function (s) { setBar(s.progress); } }
      });
      $$('.act-card img', track).forEach(function (im) {
        G.fromTo(im, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: im.closest('.act-card'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return function () { G.set(track, { clearProps: 'transform' }); };
    });
    if (FINE) {
      $$('[data-tilt]').forEach(function (card) {
        var t = $('.tilt', card);
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          G.to(t, { rotateY: x * 9, rotateX: -y * 9, duration: 0.5, ease: 'power3' });
        });
        card.addEventListener('mouseleave', function () { G.to(t, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1, .5)' }); });
      });
    }
  });

  /* ---------------------------------------------------------------- planning */
  mod('gantt', function () {
    var g = $('[data-gantt]'); if (!g) return;
    var bars = $$('[data-bar]', g), lnk = $$('[data-lnk]', g), ms = $$('[data-ms]', g), cards = $$('[data-step-card]');
    var setCards = function (p) { cards.forEach(function (c, i) { c.classList.toggle('is-on', p >= (i + 0.3) / bars.length); }); };
    if (CALM || !G) { setCards(1); return; }
    G.set(bars, { scaleX: 0, transformOrigin: '0% 50%' });
    G.set(lnk, { opacity: 0 }); G.set(ms, { scale: 0, transformOrigin: '50% 50%' });
    var tl = G.timeline({ scrollTrigger: { trigger: g, start: 'top 78%', end: 'bottom 35%', scrub: 0.6, onUpdate: function (s) { setCards(s.progress); } } });
    bars.forEach(function (b, i) {
      tl.to(b, { scaleX: 1, duration: 1, ease: 'none' });
      if (lnk[i]) tl.to(lnk[i], { opacity: 1, duration: 0.2 });
      if (i === 2) tl.to(ms[0], { scale: 1, duration: 0.3, ease: 'back.out(3)' }, '<');
    });
    tl.to(ms[1], { scale: 1, duration: 0.3, ease: 'back.out(3)' });
  });

  /* ---------------------------------------------------------------- tampons */
  mod('stamps', function () {
    var st = $$('[data-stamp]'); if (!st.length || CALM || !G) return;
    var rots = [-2.5, 1.8, -1.2, 2.4];
    G.set(st, { opacity: 0, scale: 1.7, rotate: function (i) { return rots[i % 4] * 4; } });
    ST.batch(st, {
      start: 'top 85%', once: true,
      onEnter: function (els) {
        G.to(els, { opacity: 1, scale: 1, rotate: function (i, el) { return rots[st.indexOf(el) % 4]; }, duration: 0.42, ease: 'power4.in', stagger: 0.2,
          onComplete: function () { } });
        els.forEach(function (el, i) {
          G.fromTo($('.ink', el), { opacity: 0.2 }, { opacity: 0.95, duration: 0.6, delay: 0.42 + i * 0.2 });
          G.fromTo(el, { y: 0 }, { y: 3, yoyo: true, repeat: 1, duration: 0.06, delay: 0.42 + i * 0.2, ease: 'none' });
        });
      }
    });
  });

  /* ---------------------------------------------------------------- carte */
  mod('map', function () {
    var m = $('[data-map]'); if (!m) return;
    var fr = $$('[data-draw]', m), paca = $('[data-paca]', m), pulses = $$('[data-pulse]', m);
    if (CALM || !G) { pulses.forEach(function (p, i) { p.setAttribute('r', 22 + i * 18); p.style.opacity = 0.5 - i * 0.15; }); return; }
    prepDraw(fr);
    G.set(paca, { opacity: 0 });
    var tl = G.timeline({ scrollTrigger: { trigger: m, start: 'top 75%', once: true } });
    tl.add(draw(fr, { duration: 2.2, stagger: 0.3, ease: 'power2.inOut' }))
      .to(paca, { opacity: 1, duration: 0.8 }, '-=0.6');
    pulses.forEach(function (p, i) {
      G.fromTo(p, { attr: { r: 8 }, opacity: 0.9 }, { attr: { r: 70 }, opacity: 0, duration: 2.6, ease: 'power2.out', repeat: -1, delay: 1.6 + i * 0.85 });
    });
  });

  /* ---------------------------------------------------------------- copier */
  mod('copy', function () {
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var txt = b.getAttribute('data-copy'), label = b.textContent;
        var ok = function () { b.textContent = 'Copié'; setTimeout(function () { b.textContent = label; }, 1600); };
        var fallback = function () {
          var v = b.parentElement.querySelector('.v');
          if (v) { var r = d.createRange(); r.selectNodeContents(v); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
          b.textContent = 'Sélectionné'; setTimeout(function () { b.textContent = label; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fallback); else fallback();
      });
    });
  });

  /* ---------------------------------------------------------------- devis en 5 étapes */
  mod('devis', function () {
    $$('[data-devis]').forEach(function (form) {
      var steps = $$('[data-step]', form), bars = $$('.scale-bar i', form), prev = $('[data-prev]', form), next = $('[data-next]', form);
      var done = $('[data-done]', form), nav = $('.devis-nav', form), live = $('[data-step-live]', form), summary = $('[data-summary]', form), cur = 0;
      var preset = $$('input[name="travaux"]:checked', form).map(function (i) { return i.value; });
      var nextLabel = next.innerHTML;
      function show(i, focus) {
        steps.forEach(function (s, k) { s.hidden = k !== i; });
        bars.forEach(function (b, k) { b.classList.toggle('on', k < i); b.classList.toggle('cur', k === i); });
        prev.hidden = i === 0;
        next.innerHTML = i === steps.length - 1 ? 'Envoyer la demande (simulation)' : nextLabel;
        live.textContent = 'Étape ' + (i + 1) + ' sur ' + steps.length;
        if (focus) {
          var f = $('input:not([type=hidden]), textarea', steps[i]); if (f) f.focus({ preventScroll: true });
          if (G && !CALM) G.fromTo(steps[i], { x: 28, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55 });
        }
      }
      function val(name) { var el = form.elements[name]; if (!el) return ''; if (el.length !== undefined && !el.tagName) { for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value; return ''; } return el.type === 'checkbox' ? el.checked : (el.value || '').trim(); }
      function err(i, msg) { var e = $('[data-err]', steps[i]); if (e) e.textContent = msg || ''; return !msg; }
      function validate(i) {
        if (i === 0) return err(0, $$('input[name="travaux"]:checked', form).length ? '' : 'Choisissez au moins un type de travaux.');
        if (i === 1) return err(1, val('bien') ? '' : 'Indiquez le type de bien.');
        if (i === 2) return err(2, !val('ville') ? 'Indiquez la commune ou le code postal du chantier.' : (!val('delai') ? 'Choisissez un délai de démarrage.' : ''));
        if (i === 3) return err(3, val('projet').length < 10 ? 'Décrivez votre projet en quelques mots (10 caractères au moins).' : '');
        if (i === 4) {
          if (!val('nom')) return err(4, 'Indiquez votre nom.');
          if ((val('tel').match(/\d/g) || []).length < 10) return err(4, 'Indiquez un numéro de téléphone à 10 chiffres.');
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) return err(4, 'Indiquez une adresse email valide, par exemple nom@exemple.fr.');
          if (!form.elements.rgpd.checked) return err(4, 'Cochez la case pour accepter le traitement de votre demande.');
          return err(4, '');
        }
        return true;
      }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate(cur)) { var er = $('[data-err]', steps[cur]); if (G && !CALM && er) G.fromTo(er, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, .3)' }); return; }
        if (cur < steps.length - 1) { cur++; show(cur, true); return; }
        var rows = [['Travaux', $$('input[name="travaux"]:checked', form).map(function (i) { return i.value; }).join(', ')], ['Bien', val('bien') + (val('surface') ? ' · ' + val('surface') + ' m²' : '')], ['Lieu', val('ville')], ['Délai', val('delai')], ['Projet', val('projet')], ['Contact', val('nom') + ' · ' + val('tel') + ' · ' + val('email')]];
        summary.innerHTML = '';
        rows.forEach(function (r) { var dt = d.createElement('dt'), dd = d.createElement('dd'); dt.textContent = r[0]; dd.textContent = r[1]; summary.appendChild(dt); summary.appendChild(dd); });
        steps.forEach(function (s) { s.hidden = true; }); nav.hidden = true; done.hidden = false;
        bars.forEach(function (b) { b.classList.add('on'); b.classList.remove('cur'); });
        done.focus({ preventScroll: true });
        if (G && !CALM) {
          G.fromTo($('.big-stamp', done), { scale: 2.4, rotate: -28, opacity: 0 }, { scale: 1, rotate: -8, opacity: 1, duration: 0.5, ease: 'power4.in' });
          G.from($$('h3, p, dl, button', done), { y: 18, opacity: 0, stagger: 0.07, delay: 0.45, duration: 0.6 });
        }
      });
      prev.addEventListener('click', function () { if (cur > 0) { cur--; show(cur, true); } });
      $('[data-restart]', form).addEventListener('click', function () {
        form.reset();
        $$('input[name="travaux"]', form).forEach(function (i) { i.checked = preset.indexOf(i.value) > -1; });
        steps.forEach(function (s, k) { err(k, ''); });
        done.hidden = true; nav.hidden = false; cur = 0; show(0, true);
      });
      show(0, false);
    });
  });

  /* ---------------------------------------------------------------- isolation : caméra thermique */
  mod('thermal', function () {
    var box = $('[data-thermal]'); if (!box) return;
    var ZONES = ['toiture', 'murs', 'planchers', 'combles', 'menuiseries', 'soussols'];
    var NAMES = { toiture: 'toiture', murs: 'murs', planchers: 'planchers', combles: 'combles', menuiseries: 'menuiseries', soussols: 'sous-sols' };
    var ORDER = ['combles', 'toiture', 'murs', 'menuiseries', 'planchers', 'soussols'];
    var BLOBS = [[190, 118, 95, 0], [410, 118, 95, 0], [118, 250, 80, 1], [482, 250, 80, 1], [300, 398, 120, 2], [300, 132, 82, 3], [118, 266, 55, 4], [482, 346, 62, 4], [300, 446, 110, 5]];
    var heat = [1, 1, 1, 1, 1, 1], label = $('[data-t-zone]', box);
    var ins = {}; $$('[data-ins]', box).forEach(function (p) { ins[p.getAttribute('data-ins')] = p; });
    var fb = $('[data-t-fallback]', box), fbEls = [];
    BLOBS.forEach(function (b) { var i = d.createElement('i'); i.style.left = (b[0] / 600 * 100) + '%'; i.style.top = (b[1] / 540 * 100) + '%'; i.style.width = (b[2] * 2.2 / 600 * 100) + '%'; fb.appendChild(i); fbEls.push(i); });
    function apply() {
      BLOBS.forEach(function (b, k) { fbEls[k].style.setProperty('--h', heat[b[3]].toFixed(2)); });
      if (gl) BLOBS.forEach(function (b, k) { gl.u['uB' + k].value = [b[0], b[1], b[2], heat[b[3]]]; });
    }
    var gl = null;
    if (WEBGL) {
      var O = window.OGL, canvas = $('[data-thermal-canvas]', box);
      var renderer = new O.Renderer({ canvas: canvas, dpr: Math.min(window.devicePixelRatio || 1, 1.5), alpha: true });
      var u = { uRes: { value: [1, 1] }, uTime: { value: 0 }, uDpr: { value: renderer.dpr }, uMap: { value: [1, 0, 0] } };
      BLOBS.forEach(function (b, k) { u['uB' + k] = { value: [b[0], b[1], b[2], 1] }; });
      var frag = ['precision highp float;', 'uniform vec2 uRes;uniform float uTime;uniform float uDpr;uniform vec3 uMap;'];
      BLOBS.forEach(function (b, k) { frag.push('uniform vec4 uB' + k + ';'); });
      frag.push(
        'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
        'float bl(vec4 b,vec2 p){vec2 q=p-b.xy;return b.w*exp(-dot(q,q)/(b.z*b.z));}',
        'vec3 pal(float t){t=clamp(t,0.,1.);vec3 a=vec3(.07,.09,.29),b=vec3(.26,.16,.56),c=vec3(.69,.14,.42),e=vec3(.94,.42,.18),f=vec3(1.,.88,.54);',
        ' if(t<.25)return mix(a,b,t/.25);if(t<.5)return mix(b,c,(t-.25)/.25);if(t<.75)return mix(c,e,(t-.5)/.25);return mix(e,f,(t-.75)/.25);}',
        'void main(){',
        ' vec2 px=vec2(gl_FragCoord.x,uRes.y*uDpr-gl_FragCoord.y)/uDpr;',
        ' px=floor(px/5.)*5.+2.5;',
        ' vec2 p=(px-uMap.yz)/uMap.x;'
      );
      var sum = ' float h=0.' + BLOBS.map(function (b, k) { return '+bl(uB' + k + ',p)'; }).join('') + ';';
      frag.push(sum,
        ' h*=.82+.36*noise(p*.03+vec2(uTime*.35,uTime*.2));',
        ' h+=.08*noise(p*.012-uTime*.1);',
        ' vec3 col=pal(h*.95);',
        ' col*=.92+.08*sin(px.y*1.3);',
        ' gl_FragColor=vec4(col,1.);',
        '}');
      var program = new O.Program(renderer.gl, { vertex: 'attribute vec2 uv;attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}', fragment: frag.join('\n'), uniforms: u });
      var mesh = new O.Mesh(renderer.gl, { geometry: new O.Triangle(renderer.gl), program: program });
      var vis = true;
      var resize = function () {
        var r = box.getBoundingClientRect(); renderer.setSize(r.width, r.height); u.uRes.value = [r.width, r.height];
        var s = Math.min(r.width / 600, r.height / 540); u.uMap.value = [s, (r.width - 600 * s) / 2, (r.height - 540 * s) / 2];
      };
      resize(); window.addEventListener('resize', resize);
      new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(box);
      var loop = function (t) { if (vis) { u.uTime.value = t / 1000; renderer.render({ scene: mesh }); } requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      gl = { u: u };
    }
    apply();
    function stateAt(p) {
      var n = ORDER.length, lastName = null;
      ORDER.forEach(function (z, i) {
        var a = clamp(p * n - i, 0, 1);
        heat[ZONES.indexOf(z)] = 1 - 0.86 * a;
        ins[z].setAttribute('opacity', (a * 0.9).toFixed(2));
        if (a > 0.02) lastName = z;
      });
      if (label) label.textContent = p >= 0.995 ? 'enveloppe isolée' : (lastName ? 'isolation : ' + NAMES[lastName] : 'état initial');
      apply();
    }
    if (CALM || !G) { stateAt(1); return; }
    stateAt(0);
    var st = { p: 0 };
    var mm = G.matchMedia();
    mm.add('(min-width: 1024px)', function () {
      G.to(st, { p: 1, ease: 'none', onUpdate: function () { stateAt(st.p); }, scrollTrigger: { trigger: box.closest('section'), start: 'top top', end: '+=110%', pin: true, scrub: 0.6 } });
    });
    mm.add('(max-width: 1023px)', function () {
      G.to(st, { p: 1, duration: 6, ease: 'power1.inOut', delay: 0.8, onUpdate: function () { stateAt(st.p); }, scrollTrigger: { trigger: box, start: 'top 70%', once: true } });
    });
  });

  /* ---------------------------------------------------------------- isolation : zones de la maison */
  mod('zones', function () {
    var cards = $$('[data-zone-card]'); if (!cards.length || !ST) return;
    var zs = $$('.house-svg .z');
    function set(k) { zs.forEach(function (z) { z.classList.toggle('is-active', z.getAttribute('data-zone') === k); }); }
    set(cards[0].getAttribute('data-zone-card'));
    cards.forEach(function (c) {
      ST.create({ trigger: c, start: 'top 62%', end: 'bottom 62%', onToggle: function (s) { if (s.isActive) set(c.getAttribute('data-zone-card')); } });
    });
    if (!CALM && G) { var hp = prepDraw($$('.house-svg .ln')); draw(hp, { duration: 1.6, stagger: 0.01, scrollTrigger: { trigger: '.house-svg', start: 'top 85%', once: true } }); }
  });

  /* ---------------------------------------------------------------- réalisations */
  mod('works', function () {
    var sheet = $('[data-contact-sheet]');
    if (sheet && G && !CALM) {
      var fr = $$('[data-cs]', sheet);
      G.from(fr, { x: function () { return G.utils.random(-260, 260); }, y: function () { return G.utils.random(120, 340); }, rotate: function () { return G.utils.random(-18, 18); }, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.07, delay: store('btpca-curtain') === '0' ? 0.5 : 0.2 });
    }
    var fbtn = $$('[data-filter]'), works = $$('[data-cat]'), live = $('[data-filter-live]');
    fbtn.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-filter'), shown = [];
        fbtn.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var grid = $('[data-work-grid]'); if (grid) grid.classList.toggle('is-all', k === 'all');
        works.forEach(function (w) { var on = k === 'all' || w.getAttribute('data-cat') === k; w.hidden = !on; if (on) shown.push(w); });
        if (live) live.textContent = shown.length + ' chantier' + (shown.length > 1 ? 's' : '') + ' affiché' + (shown.length > 1 ? 's' : '');
        if (G && !CALM) G.fromTo(shown, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.6 });
        if (ST) ST.refresh();
      });
    });
    var lb = $('[data-lightbox]'), data = window.BTPCA_WORKS; if (!lb || !data) return;
    var lbImg = $('[data-lb-img]', lb), lbTitle = $('[data-lb-title]', lb), lbCount = $('[data-lb-count]', lb), loupe = $('[data-loupe]', lb), stage = $('[data-lb-stage]', lb);
    var idx = 0, opener = null;
    function render() {
      var w = data[idx];
      lbImg.src = w.src; lbImg.alt = w.alt;
      lbTitle.textContent = w.title + ' · ' + w.type;
      lbCount.textContent = ('0' + (idx + 1)).slice(-2) + ' / ' + ('0' + data.length).slice(-2);
      loupe.style.backgroundImage = 'url("' + w.src + '")';
      if (G && !CALM) G.fromTo(lbImg, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.5 });
    }
    function open(i) { opener = d.activeElement; idx = i; render(); lb.hidden = false; if (lenis) lenis.stop(); $('[data-lb-close]', lb).focus(); }
    function close() { lb.hidden = true; loupe.classList.remove('on'); if (lenis) lenis.start(); if (opener) opener.focus(); }
    function step(k) { idx = (idx + k + data.length) % data.length; render(); }
    $$('[data-open]').forEach(function (b) { b.addEventListener('click', function () { open(+b.getAttribute('data-open')); }); });
    $('[data-lb-close]', lb).addEventListener('click', close);
    $('[data-lb-prev]', lb).addEventListener('click', function () { step(-1); });
    $('[data-lb-next]', lb).addEventListener('click', function () { step(1); });
    d.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'Tab') {
        var f = $$('button', lb), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    if (FINE) {
      stage.addEventListener('mousemove', function (e) {
        var r = lbImg.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        if (x < 0 || y < 0 || x > r.width || y > r.height) { loupe.classList.remove('on'); return; }
        var z = 2.6;
        loupe.classList.add('on');
        loupe.style.left = (e.clientX - sr.left - 95) + 'px'; loupe.style.top = (e.clientY - sr.top - 95) + 'px';
        loupe.style.backgroundSize = (r.width * z) + 'px ' + (r.height * z) + 'px';
        loupe.style.backgroundPosition = (-(x * z - 95)) + 'px ' + (-(y * z - 95)) + 'px';
      });
      stage.addEventListener('mouseleave', function () { loupe.classList.remove('on'); });
    }
  });

  /* ---------------------------------------------------------------- démarrage */
  function start() {
    mod('splits', splits);
    if (ST) {
      window.addEventListener('load', function () { ST.refresh(); });
      setTimeout(function () { ST.refresh(); }, 600);
    }
  }
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(start); else start();
})();

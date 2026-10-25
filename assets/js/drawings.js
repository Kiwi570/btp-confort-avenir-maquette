/* BTP Confort Avenir — dessins techniques générés en code (élévations, coupes, isométries, carte).
   Chaque générateur renvoie un <svg class="plan"> ; app.js anime ensuite les traits. */
(function () {
  'use strict';
  let uid = 0;
  const id = (p) => `${p}-${++uid}`;
  const f = (n) => Math.round(n * 10) / 10;

  const svg = (vb, inner, extra = '') => `<svg viewBox="${vb}" ${/class=/.test(extra) ? '' : 'class="plan"'} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" ${extra}>${inner}</svg>`;
  const L = (x1, y1, x2, y2, c = '') => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="${c}"/>`;
  const R = (x, y, w, h, c = '', rx = 0) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" ${rx ? `rx="${rx}"` : ''} class="${c}"/>`;
  const P = (d, c = '', extra = '') => `<path d="${d}" class="${c}" ${extra}/>`;
  const C = (cx, cy, r, c = '') => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" class="${c}"/>`;
  const T = (x, y, s, a = 'middle', c = '') => `<text x="${f(x)}" y="${f(y)}" text-anchor="${a}" class="${c}">${s}</text>`;
  const poly = (pts, c = '', closed = false) => `<${closed ? 'polygon' : 'polyline'} points="${pts.map((p) => f(p[0]) + ',' + f(p[1])).join(' ')}" class="${c}"/>`;

  /* Cote d'architecte : ligne, traits obliques aux extrémités, texte au-dessus */
  function dim(x1, y, x2, label, c = 'thin') {
    return `<g class="cote">${L(x1, y, x2, y, c)}${L(x1 - 4, y + 4, x1 + 4, y - 4, c)}${L(x2 - 4, y + 4, x2 + 4, y - 4, c)}${L(x1, y - 8, x1, y + 8, c)}${L(x2, y - 8, x2, y + 8, c)}${T((x1 + x2) / 2, y - 6, label)}</g>`;
  }
  function dimV(x, y1, y2, label, c = 'thin') {
    const my = (y1 + y2) / 2;
    return `<g class="cote">${L(x, y1, x, y2, c)}${L(x - 4, y1 + 4, x + 4, y1 - 4, c)}${L(x - 4, y2 + 4, x + 4, y2 - 4, c)}${L(x - 8, y1, x + 8, y1, c)}${L(x - 8, y2, x + 8, y2, c)}<text x="${f(x - 7)}" y="${f(my)}" text-anchor="middle" transform="rotate(-90 ${f(x - 7)} ${f(my)})">${label}</text></g>`;
  }
  function groundHatch(x1, x2, y, step = 12) {
    let s = '';
    for (let x = x1; x < x2; x += step) s += L(x, y + 10, x + 10, y, 'thin');
    return s;
  }
  function genoise(x1, x2, y, r = 6) {
    let d = `M${x1} ${y}`;
    for (let x = x1; x + 2 * r <= x2; x += 2 * r) d += ` a${r} ${r} 0 0 0 ${2 * r} 0`;
    return P(d, 'thin');
  }
  function hatchPattern(pid, color = 'var(--orange)', size = 6, w = 1.2) {
    return `<pattern id="${pid}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${size}" style="stroke:${color};stroke-width:${w}"/></pattern>`;
  }
  function zigzag(x1, y1, x2, y2, amp, step) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    const pts = [];
    let i = 0;
    for (let t = 0; t <= len; t += step, i++) {
      const o = (i % 2 ? amp : -amp);
      pts.push([x1 + ux * t + nx * o, y1 + uy * t + ny * o]);
    }
    return pts;
  }

  /* Projection isométrique */
  const isoF = (ox, oy, s = 1) => (x, y, z) => [ox + (x - y) * 0.866 * s, oy + (x + y) * 0.5 * s - z * s];
  const isoPoly = (iso, pts, c = '', closed = true) => poly(pts.map((p) => iso(...p)), c, closed);
  const isoLine = (iso, a, b, c = '') => { const p = iso(...a), q = iso(...b); return L(p[0], p[1], q[0], q[1], c); };
  const isoPath = (iso, pts, c = '') => P('M' + pts.map((p) => iso(...p).map(f).join(' ')).join(' L'), c);

  const G = {};

  /* Façade principale (intro) */
  G.facade = () => {
    let s = '';
    s += L(10, 320, 550, 320, 'thick') + groundHatch(10, 550, 320);
    s += P('M70 130 L280 70 L490 130 Z', 'thick');
    s += genoise(92, 468, 132, 7);
    s += P('M380 99 L380 74 L402 74 L402 105');
    s += R(90, 130, 380, 190);
    [130, 258, 386].forEach((x) => { s += R(x, 162, 44, 58) + L(x + 22, 162, x + 22, 220, 'thin') + L(x, 182, x + 44, 182, 'thin') + R(x - 16, 162, 14, 58, 'thin') + R(x + 46, 162, 14, 58, 'thin'); });
    s += P('M258 320 L258 262 A22 22 0 0 1 302 262 L302 320');
    [130, 386].forEach((x) => { s += R(x, 250, 44, 50) + L(x + 22, 250, x + 22, 300, 'thin'); });
    s += L(90, 236, 470, 236, 'thin dash');
    s += dim(90, 346, 470, '11,40');
    s += dimV(56, 130, 320, '5,70');
    s += dimV(518, 70, 320, '7,50');
    s += T(280, 52, 'Façade principale · éch. 1:100');
    return svg('0 0 560 360', s);
  };

  /* Planche 1 — Peinture : élévation + rouleau */
  G['pl-peinture'] = () => {
    const pid = id('hatch');
    let s = `<defs>${hatchPattern(pid)}</defs>`;
    s += L(20, 270, 380, 270, 'thick') + groundHatch(20, 380, 270, 14);
    s += P('M44 100 L200 62 L356 100 Z');
    s += genoise(62, 338, 104, 5);
    s += R(60, 100, 280, 170);
    s += `<rect class="anim-coat nodraw" x="62" y="111" width="96" height="157" fill="url(#${pid})" style="stroke:none"/>`;
    [95, 180, 265].forEach((x) => { s += R(x, 132, 40, 50) + L(x + 20, 132, x + 20, 182, 'thin'); });
    s += P('M180 270 L180 222 A20 20 0 0 1 220 222 L220 270');
    s += `<g class="anim-roller nodraw-g">${R(60, 98, 100, 14, 'fill-paper', 7)}${P('M110 98 L110 82 L176 82 L176 52', 'thick ink-s')}${R(170, 30, 12, 24, 'ink-s', 3)}</g>`;
    s += dimV(38, 100, 270, '4,20');
    s += T(200, 292, 'Élévation · enduit et peinture de façade');
    return svg('0 0 400 300', s);
  };

  /* Planche 2 — Maçonnerie : semelle, ferraillage, rangs de blocs */
  G['pl-maconnerie'] = () => {
    let s = '';
    s += L(20, 240, 380, 240, 'thick') + groundHatch(20, 70, 240, 12) + groundHatch(330, 380, 240, 12);
    s += R(70, 240, 260, 34, 'thick');
    for (let x = 76; x < 324; x += 10) s += L(x, 272, x + 8, 244, 'thin');
    [110, 200, 290].forEach((x) => { s += L(x, 268, x, 52, 'thin dash accent-s'); });
    s += L(80, 266, 320, 266, 'thin accent-s');
    let blocks = '';
    let i = 0;
    for (let row = 0; row < 7; row++) {
      const y = 240 - (row + 1) * 25;
      const off = row % 2 ? 25 : 0;
      for (let x = 80 - off; x < 320; x += 50) {
        const x1 = Math.max(80, x), x2 = Math.min(320, x + 50);
        if (x2 - x1 < 4) continue;
        blocks += `<rect x="${x1 + 1}" y="${y + 1}" width="${x2 - x1 - 2}" height="23" class="block fill-paper nodraw" style="--i:${i++}"/>`;
      }
    }
    s += `<g class="blocks">${blocks}</g>`;
    s += R(80, 52, 240, 13, 'thick');
    s += P('M336 74 L362 60 L368 72 Z M352 67 L372 44', 'ink-s');
    s += dim(80, 34, 320, '2,40');
    s += dimV(352, 65, 240, '1,75');
    s += T(200, 292, 'Coupe · semelle filante et maçonnerie');
    return svg('0 0 400 300', s);
  };

  /* Planche 3 — Électricité : schéma du tableau */
  G['pl-electricite'] = () => {
    let s = '';
    s += R(70, 30, 260, 236, 'thick', 4);
    s += L(78, 38, 78, 258, 'thin');
    s += L(200, 0, 200, 44) + `<line x1="200" y1="0" x2="200" y2="44" class="flow accent-s nodraw"/>`;
    s += R(184, 44, 32, 34) + P('M192 70 L208 52 M200 44 L200 50', 'thin');
    s += L(200, 78, 200, 95) + L(90, 95, 310, 95, 'thick') + `<line x1="90" y1="95" x2="310" y2="95" class="flow accent-s nodraw"/>`;
    s += L(90, 95, 90, 236, 'thin') + L(310, 95, 310, 236, 'thin');
    const rows = [110, 162, 214];
    const names = ['Éclairage', 'Prises', 'Spécialisés'];
    rows.forEach((y, r) => {
      s += L(90, y - 6, 310, y - 6, 'thin');
      for (let k = 0; k < 8; k++) {
        const x = 98 + k * 26;
        s += R(x, y, 20, 38, 'fill-paper') + L(x + 10, y - 6, x + 10, y, 'thin');
        s += `<circle cx="${x + 10}" cy="${y + 9}" r="3.2" class="led nodraw" data-led/>`;
        s += L(x + 5, y + 24, x + 15, y + 24, 'thin');
      }
      s += T(336, y + 22, names[r], 'start');
    });
    s += T(206, 14, 'Arrivée', 'start');
    s += T(200, 290, 'Schéma unifilaire · tableau de répartition');
    return svg('0 0 400 300', s);
  };

  /* Planche 4 — Plomberie : isométrie EF / ECS */
  G['pl-plomberie'] = () => {
    const iso = isoF(205, 178, 0.92);
    let s = '';
    s += isoPoly(iso, [[-130, -130, 0], [130, -130, 0], [130, 130, 0], [-130, 130, 0]], 'thin');
    s += isoPoly(iso, [[-130, -130, 0], [130, -130, 0], [130, -130, 170], [-130, -130, 170]], 'thin', true);
    s += isoPoly(iso, [[-130, -130, 0], [-130, 130, 0], [-130, 130, 170], [-130, -130, 170]], 'thin', true);
    // chauffe-eau
    s += isoPoly(iso, [[-118, -128, 10], [-86, -128, 10], [-86, -96, 10], [-118, -96, 10]], 'thin fill-paper');
    s += isoPoly(iso, [[-86, -128, 10], [-86, -96, 10], [-86, -96, 110], [-86, -128, 110]], 'fill-paper');
    s += isoPoly(iso, [[-118, -96, 10], [-86, -96, 10], [-86, -96, 110], [-118, -96, 110]], 'fill-paper');
    s += isoPoly(iso, [[-118, -128, 110], [-86, -128, 110], [-86, -96, 110], [-118, -96, 110]], 'fill-paper');
    // évier
    s += isoPoly(iso, [[20, -128, 70], [70, -128, 70], [70, -104, 70], [20, -104, 70]], 'fill-paper');
    s += isoPoly(iso, [[20, -104, 70], [70, -104, 70], [70, -104, 58], [20, -104, 58]], 'fill-paper');
    // douche
    s += isoPath(iso, [[105, -128, 150], [105, -110, 150], [105, -104, 144]]);
    for (let k = -1; k <= 1; k++) s += isoLine(iso, [105 + k * 4, -104, 140], [105 + k * 10, -96, 110], 'thin dash');
    // WC sur mur gauche
    s += isoPoly(iso, [[-128, 40, 0], [-100, 40, 0], [-100, 74, 0], [-128, 74, 0]], 'thin');
    s += isoPoly(iso, [[-100, 40, 0], [-100, 74, 0], [-100, 74, 34], [-100, 40, 34]], 'fill-paper');
    s += isoPoly(iso, [[-128, 74, 0], [-100, 74, 0], [-100, 74, 34], [-128, 74, 34]], 'fill-paper');
    // réseau EF (eau froide)
    const ef = [[140, -116, 8], [-90, -116, 8], [-90, -116, 22]];
    const efB1 = [[45, -116, 8], [45, -116, 60]];
    const efB2 = [[95, -116, 8], [95, -116, 118]];
    const efB3 = [[-100, -116, 8], [-122, -116, 8], [-122, 56, 8], [-122, 56, 30]];
    // réseau ECS (eau chaude)
    const ecs = [[-102, -112, 110], [-102, -112, 128], [100, -112, 128], [100, -112, 118]];
    const ecsB = [[50, -112, 128], [50, -112, 60]];
    [ef, efB1, efB2, efB3].forEach((p) => { s += isoPath(iso, p, 'thick'); s += P('M' + p.map((q) => iso(...q).map(f).join(' ')).join(' L'), 'flow nodraw', 'style="stroke:var(--prusse);stroke-width:2.2"'); });
    [ecs, ecsB].forEach((p) => { s += isoPath(iso, p, 'thick accent-s'); s += P('M' + p.map((q) => iso(...q).map(f).join(' ')).join(' L'), 'flow flow--slow nodraw', 'style="stroke:var(--ink);stroke-width:1.2"'); });
    const lEF = iso(150, -116, 6), lECS = iso(-40, -112, 138);
    s += T(lEF[0] + 6, lEF[1] + 4, 'EF', 'start') + T(lECS[0], lECS[1] - 6, 'ECS', 'middle');
    s += T(200, 292, 'Isométrie · réseau EF / ECS');
    return svg('0 0 400 300', s);
  };

  /* Planche 5 — Isolation : coupe des combles */
  G['pl-isolation'] = () => {
    let s = '';
    s += L(20, 270, 380, 270, 'thick') + groundHatch(20, 380, 270, 14);
    s += L(70, 270, 70, 150, 'thick') + L(80, 270, 80, 158, 'thin') + L(330, 270, 330, 150, 'thick') + L(320, 270, 320, 158, 'thin');
    s += L(70, 150, 330, 150, 'thick') + L(80, 158, 320, 158, 'thin');
    s += P('M40 160 L200 50 L360 160', 'thick') + P('M60 160 L200 64 L340 160', 'thin');
    s += poly(zigzag(84, 145, 316, 145, 5, 7), 'accent-s');
    s += poly(zigzag(76, 150, 196, 68, 4, 7), 'accent-s');
    s += poly(zigzag(324, 150, 204, 68, 4, 7), 'accent-s');
    [120, 200, 280].forEach((x, k) => {
      s += `<path d="M${x} 244 L${x} 176 M${x - 6} 184 L${x} 176 L${x + 6} 184" class="heat accent-s thick nodraw" style="animation-delay:${k * 0.5}s"/>`;
    });
    s += T(200, 238, 'Pièce chauffée');
    s += T(352, 126, 'Isolant', 'start');
    s += L(318, 140, 348, 124, 'thin');
    s += T(200, 292, 'Coupe · combles et rampants');
    return svg('0 0 400 300', s);
  };

  /* Méthode — bâtiment qui monte, en 5 calques */
  G.building = () => {
    const iso = isoF(300, 300, 1);
    const pid = id('hiso');
    const L1 = [], L2 = [], L3 = [], L4 = [], L5 = [];
    // 1. Implantation
    for (let x = -200; x <= 200; x += 40) L1.push(isoLine(iso, [x, -150, 0], [x, 150, 0], 'thin dash'));
    for (let y = -150; y <= 150; y += 40) L1.push(isoLine(iso, [-200, y, 0], [200, y, 0], 'thin dash'));
    L1.push(isoPoly(iso, [[-120, -80, 0], [120, -80, 0], [120, 80, 0], [-120, 80, 0]], 'accent-s thick'));
    [[-120, -80], [120, -80], [120, 80], [-120, 80]].forEach(([x, y]) => L1.push(isoLine(iso, [x, y, 0], [x, y, 16], 'ink-s')));
    // 2. Fondations
    L2.push(isoPoly(iso, [[-126, 86, 0], [126, 86, 0], [126, 86, -24], [-126, 86, -24]], 'fill-soft'));
    L2.push(isoPoly(iso, [[126, -86, 0], [126, 86, 0], [126, 86, -24], [126, -86, -24]], 'fill-soft'));
    L2.push(isoPoly(iso, [[-126, -86, 0], [126, -86, 0], [126, 86, 0], [-126, 86, 0]], 'fill-paper2'));
    L2.push(isoPoly(iso, [[-108, -68, 0], [108, -68, 0], [108, 68, 0], [-108, 68, 0]], 'thin fill-paper'));
    // 3. Structure (murs, dalle)
    L3.push(isoLine(iso, [-120, -80, 0], [-120, -80, 120], 'thin dash'));
    L3.push(isoLine(iso, [-120, -80, 120], [120, -80, 120], 'thin'));
    L3.push(isoLine(iso, [-120, -80, 120], [-120, 80, 120], 'thin'));
    L3.push(isoPoly(iso, [[-120, 80, 0], [120, 80, 0], [120, 80, 120], [-120, 80, 120]], 'fill-paper thick'));
    L3.push(isoPoly(iso, [[120, -80, 0], [120, 80, 0], [120, 80, 120], [120, -80, 120]], 'fill-paper2 thick'));
    L3.push(isoLine(iso, [-120, 80, 60], [120, 80, 60], 'thin dash'));
    L3.push(isoLine(iso, [120, -80, 60], [120, 80, 60], 'thin dash'));
    // 4. Réseaux et isolation
    L4.push(`<defs>${hatchPattern(pid, 'var(--orange)', 7, 1.4)}</defs>`);
    L4.push(isoPoly(iso, [[-120, 80, 70], [120, 80, 70], [120, 80, 120], [-120, 80, 120]], 'nodraw', true).replace('class="nodraw"', `class="nodraw" style="fill:url(#${pid});stroke:none;opacity:.8"`));
    L4.push(isoPoly(iso, [[120, -80, 70], [120, 80, 70], [120, 80, 120], [120, -80, 120]], 'nodraw', true).replace('class="nodraw"', `class="nodraw" style="fill:url(#${pid});stroke:none;opacity:.8"`));
    L4.push(isoPath(iso, [[-96, 80, 6], [-96, 80, 104], [70, 80, 104]], 'accent-s thick'));
    L4.push(isoPath(iso, [[120, 50, 6], [120, 50, 92], [120, -56, 92]], 'thick'));
    L4.push(isoPath(iso, [[40, 80, 104], [40, 80, 64]], 'accent-s'));
    // 5. Finitions (toiture, menuiseries)
    L5.push(isoPoly(iso, [[120, -80, 120], [120, 80, 120], [120, 0, 182]], 'fill-paper2 thick'));
    L5.push(isoPoly(iso, [[-134, 94, 112], [134, 94, 112], [134, 0, 186], [-134, 0, 186]], 'fill-paper thick'));
    for (let t = 0.2; t < 1; t += 0.2) {
      L5.push(isoLine(iso, [-134, 94 - 94 * t, 112 + 74 * t], [134, 94 - 94 * t, 112 + 74 * t], 'thin accent-s'));
    }
    const win = (x1, x2, z1, z2) => isoPoly(iso, [[x1, 80, z1], [x2, 80, z1], [x2, 80, z2], [x1, 80, z2]], 'fill-paper2');
    L5.push(win(-92, -60, 72, 104), win(-10, 22, 72, 104), win(60, 92, 72, 104), win(-92, -60, 14, 44), win(60, 92, 14, 44));
    L5.push(isoPoly(iso, [[-12, 80, 0], [20, 80, 0], [20, 80, 50], [-12, 80, 50]], 'fill-orange'));
    L5.push(isoPoly(iso, [[120, -50, 72], [120, -18, 72], [120, -18, 104], [120, -50, 104]], 'fill-paper2'));
    L5.push(isoPoly(iso, [[120, 18, 72], [120, 50, 72], [120, 50, 104], [120, 18, 104]], 'fill-paper2'));
    const lab = (pt, ly, txt) => { const p = iso(...pt); return `<g class="lbl">${C(p[0], p[1], 2.2, 'fill-orange')}${P(`M${f(p[0])} ${f(p[1])} L486 ${ly - 3} L492 ${ly - 3}`, 'thin')}${T(496, ly, txt, 'start')}</g>`; };
    let s = '';
    s += `<g class="layer" data-l="1">${L1.join('')}${lab([150, 130, 0], 452, 'Implantation')}</g>`;
    s += `<g class="layer" data-l="2">${L2.join('')}${lab([126, 86, -12], 410, 'Fondations')}</g>`;
    s += `<g class="layer" data-l="3">${L3.join('')}${lab([120, 40, 40], 352, 'Gros œuvre')}</g>`;
    s += `<g class="layer" data-l="4">${L4.join('')}${lab([120, 50, 92], 292, 'Réseaux · isolation')}</g>`;
    s += `<g class="layer" data-l="5">${L5.join('')}${lab([120, 0, 176], 226, 'Finitions')}</g>`;
    return svg('0 0 640 500', s, 'class="plan methode__svg"');
  };

  /* Devis — la maison se complète à chaque étape */
  G.house = () => {
    let s = '';
    s += `<g data-h="1">${L(10, 140, 210, 140, 'thick')}${groundHatch(10, 210, 140, 10)}${R(40, 132, 140, 8, 'fill-soft')}</g>`;
    s += `<g data-h="2">${R(46, 76, 128, 56, 'fill-paper')}${L(46, 104, 174, 104, 'thin dash')}</g>`;
    s += `<g data-h="3">${P('M34 78 L110 40 L186 78 Z', 'fill-paper2 thick')}${genoise(48, 172, 80, 4)}</g>`;
    s += `<g data-h="4">${R(60, 86, 20, 14, 'fill-paper2')}${R(140, 86, 20, 14, 'fill-paper2')}${R(100, 108, 20, 24, 'fill-orange')}${R(60, 112, 20, 14, 'fill-paper2')}${R(140, 112, 20, 14, 'fill-paper2')}${P('M150 60 L150 44 L162 44 L162 66')}</g>`;
    s += `<g data-h="5">${C(188, 26, 10, 'accent-s')}${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const r = a * Math.PI / 180; return L(188 + Math.cos(r) * 14, 26 + Math.sin(r) * 14, 188 + Math.cos(r) * 19, 26 + Math.sin(r) * 19, 'accent-s thin'); }).join('')}</g>`;
    return svg('0 0 220 160', s);
  };

  /* Cote « 30 ans d'expérience » */
  G['cote-xp'] = () => {
    let s = '';
    s += L(0, 60, 600, 60, 'thin') + L(-5, 65, 5, 55, 'thin') + L(595, 65, 605, 55, 'thin') + L(0, 46, 0, 74, 'thin') + L(600, 46, 600, 74, 'thin');
    s += `<line x1="0" y1="60" x2="600" y2="60" class="accent-s thick" data-cote-line/>`;
    s += `<text x="0" y="40" text-anchor="start" class="big" data-count-svg="30">30+</text>`;
    s += T(600, 40, 'ans d’expérience', 'end');
    s += T(0, 92, 'Conception', 'start') + T(600, 92, 'Réalisation', 'end');
    return svg('-10 0 620 100', s);
  };

  /* Cote sous le titre d'accueil */
  G['cote-hero'] = () => {
    let s = '';
    s += L(0, 11, 1000, 11, 'thin') + L(-4, 15, 4, 7, 'thin') + L(996, 15, 1004, 7, 'thin') + L(0, 2, 0, 20, 'thin') + L(1000, 2, 1000, 20, 'thin');
    return svg('0 0 1000 22', s, 'preserveAspectRatio="none"');
  };

  /* Réglet de maçon (poignée avant/après) */
  G.reglet = (h = 1000) => {
    let s = '';
    s += `<rect x="6" y="0" width="18" height="${h}" class="nodraw" style="fill:var(--orange);stroke:var(--ink);stroke-width:1"/>`;
    for (let y = 0, i = 0; y < h; y += 4, i++) {
      const w = i % 10 === 0 ? 10 : i % 5 === 0 ? 7 : 4;
      s += `<line x1="6" y1="${y}" x2="${6 + w}" y2="${y}" class="nodraw" style="stroke:var(--ink);stroke-width:${i % 10 === 0 ? 1 : .6}"/>`;
      if (i % 10 === 0 && i > 0) s += `<text x="21" y="${y + 3}" text-anchor="middle" class="nodraw" style="fill:var(--ink);font-size:7px;font-family:var(--f-mono)">${i / 10}</text>`;
    }
    for (let y = 200; y < h; y += 200) s += `<line x1="6" y1="${y}" x2="24" y2="${y}" class="nodraw" style="stroke:var(--ink);stroke-width:1.4"/><circle cx="15" cy="${y}" r="2" class="nodraw" style="fill:var(--ink)"/>`;
    return `<svg viewBox="0 0 30 ${h}" width="30" height="${h}" preserveAspectRatio="xMidYMin slice" aria-hidden="true">${s}</svg>`;
  };

  /* Tampon « Bon pour exécution » */
  G.stamp = () => {
    const pid = id('arc'), fid = id('ink');
    const s = `<defs><path id="${pid}" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"/>
      <filter id="${fid}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${uid}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.25"/><feComposite in="SourceGraphic" operator="in"/></filter></defs>
      <g filter="url(#${fid})" style="fill:none;stroke:currentColor">
        <circle cx="60" cy="60" r="56" style="stroke-width:2.4"/><circle cx="60" cy="60" r="36" style="stroke-width:1.2"/>
        <text style="fill:currentColor;stroke:none;font-family:var(--f-mono);font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase"><textPath href="#${pid}">Bon pour exécution · BTP Confort Avenir ·</textPath></text>
        <path d="M44 60 l11 11 l22 -24" style="stroke-width:4;stroke-linecap:round;stroke-linejoin:round"/>
      </g>`;
    return `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">${s}</svg>`;
  };

  /* Carte de principe */
  const FR = [[51.05, 2.37], [50.95, 1.85], [50.4, 1.6], [50.1, 1.5], [49.9, 1.0], [49.7, 0.2], [49.47, 0.1], [49.3, -0.2], [49.35, -1.1], [49.65, -1.3], [49.64, -1.9], [49.2, -1.6], [48.85, -1.6], [48.63, -1.5], [48.68, -2.3], [48.8, -3.0], [48.72, -3.9], [48.6, -4.6], [48.36, -4.78], [48.1, -4.5], [48.0, -4.7], [47.8, -4.3], [47.75, -3.4], [47.5, -2.9], [47.28, -2.2], [47.0, -2.1], [46.7, -1.9], [46.25, -1.2], [45.8, -1.1], [45.5, -1.05], [45.0, -1.2], [44.66, -1.25], [44.0, -1.35], [43.5, -1.55], [43.37, -1.78], [43.1, -1.4], [42.95, -0.6], [42.75, 0.4], [42.68, 1.3], [42.45, 1.95], [42.45, 2.7], [42.43, 3.17], [42.75, 3.04], [43.15, 3.15], [43.4, 3.6], [43.55, 4.1], [43.4, 4.6], [43.35, 5.05], [43.25, 5.37], [43.15, 5.7], [43.07, 5.95], [43.1, 6.3], [43.2, 6.65], [43.42, 6.85], [43.55, 7.05], [43.7, 7.3], [43.78, 7.53], [44.1, 7.7], [44.4, 6.95], [44.8, 7.0], [45.1, 6.8], [45.35, 7.1], [45.82, 6.85], [46.1, 6.9], [46.42, 6.6], [46.3, 6.1], [46.6, 6.25], [47.0, 6.75], [47.3, 7.0], [47.45, 7.4], [47.6, 7.55], [48.0, 7.6], [48.5, 7.8], [48.97, 8.23], [49.1, 7.5], [49.2, 6.8], [49.45, 6.4], [49.5, 5.8], [49.75, 5.4], [49.95, 4.85], [50.15, 4.8], [50.1, 4.2], [50.35, 3.65], [50.5, 3.3], [50.75, 2.9], [51.05, 2.37]];
  const CORSE = [[43.0, 9.43], [42.6, 9.5], [42.0, 9.4], [41.6, 9.25], [41.4, 9.2], [41.6, 8.8], [41.9, 8.6], [42.25, 8.55], [42.6, 8.75], [42.95, 9.2], [43.0, 9.43]];
  const PACA = [[43.45, 4.6], [43.9, 4.7], [44.3, 4.65], [44.45, 4.9], [44.5, 5.5], [44.85, 5.7], [45.1, 6.3], [44.9, 6.95], [44.4, 6.9], [44.15, 7.65], [43.78, 7.53], [43.7, 7.3], [43.55, 7.05], [43.42, 6.85], [43.2, 6.65], [43.1, 6.3], [43.07, 5.95], [43.15, 5.7], [43.25, 5.37], [43.35, 5.05], [43.4, 4.6], [43.45, 4.6]];
  const CITIES = [['Marseille', 43.296, 5.37, 'home'], ['Aix-en-Provence', 43.53, 5.45], ['Toulon', 43.12, 5.93], ['Nice', 43.70, 7.27], ['Avignon', 43.95, 4.81], ['Lyon', 45.76, 4.84], ['Paris', 48.86, 2.35], ['Bordeaux', 44.84, -0.58], ['Toulouse', 43.60, 1.44], ['Lille', 50.63, 3.06], ['Nantes', 47.22, -1.55], ['Strasbourg', 48.57, 7.75], ['Montpellier', 43.61, 3.88]];
  const K = 100, COS = Math.cos(46.5 * Math.PI / 180);
  const pr = (lat, lon) => [(lon + 5.5) * COS * K, (51.5 - lat) * K];
  const pathOf = (pts) => 'M' + pts.map(([la, lo]) => pr(la, lo).map(f).join(' ')).join(' L') + ' Z';
  const MAPVIEWS = {
    marseille: { c: pr(43.36, 5.55), w: 130, ring: 0.32, level: 'Marseille et alentours' },
    paca: { c: pr(43.95, 5.95), w: 330, ring: 1.3, level: 'Région PACA' },
    france: { c: pr(46.6, 2.5), w: 1120, ring: 0, level: 'Toute la France' },
  };
  G.map = () => {
    const home = pr(43.296, 5.37);
    let s = '';
    s += `<path class="country" d="${pathOf(FR)} ${pathOf(CORSE)}"/>`;
    s += `<path class="ring-fill" data-paca d="${pathOf(PACA)}" style="opacity:0"/>`;
    s += `<g data-rays style="opacity:0">${CITIES.filter((c) => !c[3]).map((c) => { const p = pr(c[1], c[2]); return `<line x1="${f(home[0])}" y1="${f(home[1])}" x2="${f(p[0])}" y2="${f(p[1])}" class="ring" style="stroke-dasharray:4 6;opacity:.6"/>`; }).join('')}</g>`;
    s += `<circle class="ring" data-ring cx="${f(home[0])}" cy="${f(home[1])}" r="30"/>`;
    s += CITIES.map((c) => { const p = pr(c[1], c[2]); return `<g class="${c[3] ? 'home' : 'city'}" data-city="${c[0]}"><circle cx="${f(p[0])}" cy="${f(p[1])}" r="3"/><text x="${f(p[0] + 6)}" y="${f(p[1] + 3)}">${c[0]}</text></g>`; }).join('');
    s += `<g class="compass" data-compass transform="translate(${f(home[0])} ${f(home[1])})"><g data-compass-rot><polyline data-legs points="0,0 15,-12 30,0"/><circle data-hinge cx="15" cy="-12" r="2"/><circle data-tip cx="30" cy="0" r="1.2" style="fill:var(--orange);stroke:var(--ink)"/></g></g>`;
    const v = MAPVIEWS.paca;
    return `<svg viewBox="${f(v.c[0] - v.w / 2)} ${f(v.c[1] - v.w / 2)} ${v.w} ${v.w}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" data-map>${s}</svg>`;
  };
  G.map.views = MAPVIEWS;
  G.map.home = () => pr(43.296, 5.37);
  G.map.degToUnits = (d) => d * K;

  /* Isolation — maison éclatée (6 zones) */
  G.eclatee = () => {
    const iso = isoF(300, 330, 1);
    const box = (x1, x2, y1, y2, z1, z2) => [
      isoPoly(iso, [[x1, y2, z1], [x2, y2, z1], [x2, y2, z2], [x1, y2, z2]], 'face'),
      isoPoly(iso, [[x2, y1, z1], [x2, y2, z1], [x2, y2, z2], [x2, y1, z2]], 'face'),
      isoPoly(iso, [[x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2]], 'face'),
    ].join('');
    const zones = {};
    zones['sous-sols'] = box(-120, 120, -80, 80, -150, -100);
    zones.planchers = box(-120, 120, -80, 80, -60, -48);
    zones.murs = isoPoly(iso, [[-120, 80, -30], [120, 80, -30], [120, 80, 80], [-120, 80, 80]], 'face') + isoPoly(iso, [[120, -80, -30], [120, 80, -30], [120, 80, 80], [120, -80, 80]], 'face') + isoLine(iso, [-120, -80, 80], [120, -80, 80]) + isoLine(iso, [-120, -80, 80], [-120, 80, 80]) + isoLine(iso, [-120, -80, -30], [-120, -80, 80], 'thin dash');
    const win = (x1, x2, z1, z2) => isoPoly(iso, [[x1, 82, z1], [x2, 82, z1], [x2, 82, z2], [x1, 82, z2]], 'face');
    zones.ouvertures = win(-96, -62, 20, 56) + win(52, 86, 20, 56) + win(-16, 16, -30, 30) + isoPoly(iso, [[122, -46, 20], [122, -12, 20], [122, -12, 56], [122, -46, 56]], 'face');
    zones.combles = box(-120, 120, -80, 80, 110, 120);
    zones.toiture = isoPoly(iso, [[120, -80, 150], [120, 80, 150], [120, 0, 215]], 'face') + isoPoly(iso, [[-134, 94, 142], [134, 94, 142], [134, 0, 219], [-134, 0, 219]], 'face');
    let s = '';
    [[-120, -80], [120, -80], [120, 80], [-120, 80]].forEach(([x, y]) => { s += isoLine(iso, [x, y, -150], [x, y, 150], 'thin dash'); });
    const order = ['sous-sols', 'planchers', 'murs', 'ouvertures', 'combles', 'toiture'];
    order.forEach((k) => { s += `<g class="zone-g" data-zone="${k}">${zones[k]}</g>`; });
    return `<svg viewBox="40 40 520 520" class="plan zones__svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${s}</svg>`;
  };

  /* Isolation — coupe thermique (le canvas des particules se superpose) */
  G.coupe = () => {
    const pl = id('laine');
    let s = `<defs><pattern id="${pl}" width="60" height="90" patternUnits="userSpaceOnUse"><image href="assets/img/grok/texture-laine-784.webp" width="60" height="90" preserveAspectRatio="xMidYMid slice"/></pattern></defs>`;
    s += L(20, 400, 780, 400, 'thick') + groundHatch(20, 780, 400, 16);
    s += P('M150 400 L150 220 M650 400 L650 220', 'thick') + P('M166 400 L166 230 M634 400 L634 230', 'thin');
    s += L(150, 220, 650, 220, 'thick') + L(166, 230, 634, 230, 'thin');
    s += P('M110 232 L400 80 L690 232', 'thick') + P('M140 232 L400 98 L660 232', 'thin');
    s += L(150, 400, 650, 400, 'thick');
    s += `<g data-iso-roof style="opacity:0"><polygon points="146,230 400,102 654,230 640,232 400,112 160,232" style="fill:url(#${pl});stroke:var(--orange);stroke-width:1"/></g>`;
    s += `<g data-iso-attic style="opacity:0"><rect x="166" y="198" width="468" height="22" style="fill:url(#${pl});stroke:var(--orange);stroke-width:1"/></g>`;
    s += `<g data-iso-walls style="opacity:0"><rect x="126" y="220" width="22" height="180" style="fill:url(#${pl});stroke:var(--orange);stroke-width:1"/><rect x="652" y="220" width="22" height="180" style="fill:url(#${pl});stroke:var(--orange);stroke-width:1"/></g>`;
    s += R(300, 300, 200, 100, 'thin dash');
    s += T(400, 356, 'Pièce de vie');
    s += T(400, 432, 'Schéma illustratif · coupe transversale');
    return svg('0 0 800 450', s, 'preserveAspectRatio="xMidYMid meet" data-coupe');
  };

  /* Visuel provisoire : toits vus d'en haut (zone-toits-marseille à venir) */
  G['ph-toits'] = () => {
    let s = '';
    s += P('M0 120 C60 100 120 70 180 86 S300 60 360 74 S460 96 520 80 L600 76', 'thin');
    s += L(0, 132, 600, 132, 'thin dash');
    const roofs = [[20, 200, 90], [110, 190, 110], [230, 210, 80], [320, 186, 120], [450, 204, 100], [540, 196, 70]];
    roofs.forEach(([x, y, w], i) => {
      s += P(`M${x} ${y} L${x + w / 2} ${y - 34} L${x + w} ${y} Z`, i % 2 ? 'fill-paper2' : 'fill-paper');
      for (let k = 1; k < 4; k++) s += L(x + (w / 2) * k / 4, y - 34 * k / 4, x + w - (w / 2) * k / 4, y - 34 * k / 4, 'thin accent-s');
      s += R(x + 6, y, w - 12, 60, 'fill-paper');
      s += R(x + w / 2 - 8, y + 18, 16, 20, 'thin');
    });
    s += T(300, 316, 'Toits de Marseille · visuel provisoire');
    return svg('0 0 600 330', s, 'preserveAspectRatio="xMidYMid slice" class="plan slot__draw"');
  };

  /* Emplacement de réalisation à venir */
  G['ph-chantier'] = () => {
    let s = '';
    s += L(20, 250, 380, 250, 'thick') + groundHatch(20, 380, 250, 14);
    s += R(90, 120, 220, 130, 'fill-paper');
    s += P('M74 120 L200 70 L326 120 Z', 'fill-paper2');
    for (let x = 60; x <= 340; x += 40) s += L(x, 250, x, 96, 'thin');
    [130, 180, 230].forEach((y) => { s += L(56, y, 344, y, 'thin'); });
    s += L(60, 250, 100, 130, 'thin') + L(100, 250, 60, 130, 'thin');
    s += T(200, 282, 'Réalisation à ajouter');
    return svg('0 0 400 300', s, 'preserveAspectRatio="xMidYMid slice" class="plan slot__draw"');
  };

  window.Draw = G;
  window.Draw.render = function (root) {
    (root || document).querySelectorAll('[data-gen]').forEach((el) => {
      if (el.dataset.genDone) return;
      const g = G[el.dataset.gen];
      if (!g) return;
      el.insertAdjacentHTML(el.dataset.genPos || 'afterbegin', g());
      el.dataset.genDone = '1';
    });
  };
  window.Draw.render();
})();

/* BTP Confort Avenir — effet « Du plan au réel » (WebGL, OGL).
   La photo est d'abord dessinée comme un plan (contours bleu de Prusse sur calque),
   puis une coulée de béton frais la révèle. Au survol, une loupe inverse l'état. */
import { Renderer } from '../vendor/ogl/core/Renderer.js';
import { Program } from '../vendor/ogl/core/Program.js';
import { Mesh } from '../vendor/ogl/core/Mesh.js';
import { Texture } from '../vendor/ogl/core/Texture.js';
import { Triangle } from '../vendor/ogl/extras/Triangle.js';

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform sampler2D tMat;
uniform vec2 uRes;
uniform vec2 uImg;
uniform float uProgress;
uniform float uTime;
uniform vec2 uMouse;
uniform float uLens;
uniform float uLensR;
uniform float uDpr;
uniform float uSeed;
uniform float uDark;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uAccent;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

vec2 coverScale() {
  float rs = uRes.x / uRes.y, ri = uImg.x / uImg.y;
  return rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
}

void main() {
  vec2 s = coverScale();
  vec2 uv = (vUv - 0.5) * s + 0.5;

  // front de coulée : du haut vers le bas, bord irrégulier
  float n = fbm(vec2(vUv.x * 3.2 + uSeed, uTime * 0.12 + uSeed));
  float front = uProgress * 1.5 - 0.25;
  float d = (1.0 - vUv.y) + (n - 0.5) * 0.35 - front;
  float reveal = 1.0 - smoothstep(-0.012, 0.012, d);
  float band = 1.0 - smoothstep(0.0, 0.07, abs(d));

  // loupe : inverse plan et photo sous le curseur
  vec2 dp = (vUv - uMouse) * uRes;
  float dist = length(dp);
  float lens = (1.0 - smoothstep(uLensR * 0.82, uLensR, dist)) * uLens;
  reveal = mix(reveal, 1.0 - reveal, lens);
  float ring = (1.0 - smoothstep(0.0, 1.6 * uDpr, abs(dist - uLensR))) * uLens;

  vec2 puv = uv + vec2(0.0, band * 0.018 * (n - 0.5));
  vec3 photo = texture2D(tMap, puv).rgb;
  vec3 col = photo;

  // plan : contours (Sobel) + lavis léger + quadrillage, calculé seulement là où il se voit
  if (reveal < 0.999 || ring > 0.001) {
    vec2 px = s * 1.25 * uDpr / uRes;
    float tl = lum(texture2D(tMap, uv + px * vec2(-1.0, 1.0)).rgb);
    float t  = lum(texture2D(tMap, uv + px * vec2(0.0, 1.0)).rgb);
    float tr = lum(texture2D(tMap, uv + px * vec2(1.0, 1.0)).rgb);
    float l  = lum(texture2D(tMap, uv + px * vec2(-1.0, 0.0)).rgb);
    float r  = lum(texture2D(tMap, uv + px * vec2(1.0, 0.0)).rgb);
    float bl = lum(texture2D(tMap, uv + px * vec2(-1.0, -1.0)).rgb);
    float b  = lum(texture2D(tMap, uv + px * vec2(0.0, -1.0)).rgb);
    float br = lum(texture2D(tMap, uv + px * vec2(1.0, -1.0)).rgb);
    float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
    float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
    float edge = smoothstep(0.14, 0.5, length(vec2(gx, gy)));
    float tone = (1.0 - lum(photo)) * 0.16;
    vec2 g = mod(gl_FragCoord.xy, 40.0 * uDpr);
    float grid = (step(g.x, uDpr) + step(g.y, uDpr)) * 0.06;
    vec2 g2 = mod(gl_FragCoord.xy, 8.0 * uDpr);
    grid += (step(g2.x, uDpr * 0.5) + step(g2.y, uDpr * 0.5)) * 0.015;
    vec3 paper = mix(uPaper, vec3(0.067, 0.114, 0.165), uDark);
    vec3 ink = mix(uInk, vec3(0.56, 0.66, 0.87), uDark);
    vec3 plan = mix(paper, ink, clamp(tone + grid + edge * 0.78, 0.0, 1.0));
    col = mix(plan, photo, reveal);
  }

  // matière fraîche au front de coulée (texture de béton)
  if (band > 0.001 && uProgress > 0.002 && uProgress < 0.998) {
    vec3 mat = texture2D(tMat, fract(vUv * vec2(uRes.x / uRes.y, 1.0) * 0.9 + vec2(0.0, uTime * 0.02))).rgb;
    vec3 wet = mix(mat * 0.92, uAccent, smoothstep(0.018, 0.0, abs(d)) * 0.85);
    col = mix(col, wet, band * 0.6 * (1.0 - lens));
  }
  col = mix(col, uAccent, ring);
  gl_FragColor = vec4(col, 1.0);
}
`;

const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

let matImage = null;
function loadMat() {
  if (matImage) return matImage;
  matImage = new Promise((res) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = new URL('../img/grok/texture-beton-784.webp', import.meta.url).href;
  });
  return matImage;
}

function whenLoaded(img) {
  return new Promise((res) => {
    if (img.complete && img.naturalWidth) return res(img);
    img.addEventListener('load', () => res(img), { once: true });
    img.addEventListener('error', () => res(null), { once: true });
    if (img.loading === 'lazy') img.loading = 'eager';
  });
}

export function supported() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

export class PlanReveal {
  constructor(el, img, opts = {}) {
    this.el = el;
    this.opts = Object.assign({ progress: 0, lens: false, lensR: 120, dark: 0, seed: Math.random() * 10 }, opts);
    const big = el.getBoundingClientRect().width > 1100;
    this.renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, big ? 1.25 : 1.5), alpha: false, antialias: false, premultipliedAlpha: false });
    this.gl = this.renderer.gl;
    this.canvas = this.gl.canvas;
    this.canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(this.canvas);
    const gl = this.gl;
    this.tex = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
    this.mat = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
    this.program = new Program(gl, {
      vertex, fragment,
      uniforms: {
        tMap: { value: this.tex }, tMat: { value: this.mat },
        uRes: { value: [1, 1] }, uImg: { value: [1, 1] },
        uProgress: { value: this.opts.progress }, uTime: { value: 0 },
        uMouse: { value: [0.5, 0.5] }, uLens: { value: 0 }, uLensR: { value: 100 },
        uDpr: { value: this.renderer.dpr }, uSeed: { value: this.opts.seed }, uDark: { value: this.opts.dark },
        uPaper: { value: hex('#F3F1EA') }, uInk: { value: hex('#1C3D7A') }, uAccent: { value: hex('#F79F31') },
      },
    });
    this.mesh = new Mesh(gl, { geometry: new Triangle(gl), program: this.program });
    this.mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    this.lensOn = 0; this.lensTarget = 0;
    this.raf = 0; this.ready = false; this.visible = true; this.time = 0; this.last = performance.now(); this.born = this.last;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(el);
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; if (this.visible) this.render(); }, { rootMargin: '100px' });
    this.io.observe(el);
    this.setImage(img).then(() => { el.classList.add('gl-on'); });
    loadMat().then((im) => { if (im) { this.mat.image = im; this.render(); } });
    if (this.opts.lens) this.bindLens();
  }

  async setImage(img) {
    const im = await whenLoaded(img);
    if (!im) return;
    this.tex.image = im;
    this.program.uniforms.uImg.value = [im.naturalWidth, im.naturalHeight];
    this.ready = true;
    this.resize();
  }

  resize() {
    const r = this.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.renderer.setSize(r.width, r.height);
    this.program.uniforms.uRes.value = [r.width * this.renderer.dpr, r.height * this.renderer.dpr];
    this.program.uniforms.uLensR.value = this.opts.lensR * this.renderer.dpr;
    this.render();
  }

  setProgress(p) {
    p = Math.max(0, Math.min(1, p));
    if (Math.abs(p - this.program.uniforms.uProgress.value) < 0.0005) return;
    this.program.uniforms.uProgress.value = p;
    this.tick();
  }

  get progress() { return this.program.uniforms.uProgress.value; }

  /* Transition d'une photo à une autre : retour au plan, puis coulée */
  transitionTo(img, dur = 1.6) {
    const g = window.gsap;
    return new Promise((res) => {
      const o = { p: this.progress };
      g.to(o, {
        p: 0, duration: dur * 0.42, ease: 'power2.in',
        onUpdate: () => this.setProgress(o.p),
        onComplete: async () => {
          await this.setImage(img);
          this.program.uniforms.uSeed.value = Math.random() * 10;
          g.to(o, { p: 1, duration: dur * 0.58, ease: 'power2.out', onUpdate: () => this.setProgress(o.p), onComplete: res });
        },
      });
    });
  }

  bindLens() {
    const el = this.opts.lensTarget || this.el;
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = this.el.getBoundingClientRect();
      this.mouse.tx = (e.clientX - r.left) / r.width;
      this.mouse.ty = 1 - (e.clientY - r.top) / r.height;
      this.lensTarget = 1;
      this.tick();
    });
    el.addEventListener('pointerleave', () => { this.lensTarget = 0; this.tick(); });
  }

  tick() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => this.loop());
  }

  loop() {
    this.raf = 0;
    const now = performance.now();
    const raw = (now - this.last) / 1000;
    const dt = Math.min(0.05, raw);
    this.last = now;
    this.time += dt;
    const m = this.mouse;
    m.x += (m.tx - m.x) * 0.18; m.y += (m.ty - m.y) * 0.18;
    this.lensOn += (this.lensTarget - this.lensOn) * 0.14;
    const u = this.program.uniforms;
    u.uMouse.value = [m.x, m.y];
    u.uLens.value = this.lensOn;
    u.uTime.value = this.time;
    this.render();
    this.frames = (this.frames || 0) + 1;
    if (this.frames > 2 && now - this.born > 1000 && this.opts.onSlow && !this.slowFired && raw < 3) {
      (this.deltas = this.deltas || []).push(raw);
      if (this.deltas.length > 12) this.deltas.shift();
      if (this.deltas.length >= 8) {
        const sorted = this.deltas.slice().sort((a, b) => a - b);
        if (sorted[Math.floor(sorted.length / 2)] > 0.07) { this.slowFired = true; this.opts.onSlow(this); return; }
      }
    }
    const p = u.uProgress.value;
    const moving = Math.abs(m.tx - m.x) > 0.001 || Math.abs(m.ty - m.y) > 0.001 || Math.abs(this.lensTarget - this.lensOn) > 0.002;
    const flowing = p > 0.001 && p < 0.999;
    if ((moving || flowing) && this.visible) this.tick();
  }

  destroy() {
    cancelAnimationFrame(this.raf); this.raf = 0;
    this.ro.disconnect(); this.io.disconnect();
    this.ready = false;
    const ext = this.gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    this.canvas.remove();
    this.el.classList.remove('gl-on');
  }

  render() {
    if (!this.ready || !this.visible) return;
    this.renderer.render({ scene: this.mesh });
  }
}

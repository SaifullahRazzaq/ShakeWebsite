import { COMMON, NOISE } from "./glsl";

/**
 * One program, many liquids.
 *
 * Every non-ocean liquid on the site is a 2D field: a height/density function evaluated
 * per pixel, lit with the same creamy model as the ocean so the whole site stays one
 * material. Sharing one compiled program across modes keeps the GL context count low —
 * each scene still gets its own canvas, but the shader source is identical and cached.
 */
export const MODE = {
  BLEED: 0,    // a flavour cloud spreading through liquid
  MARBLE: 1,   // two liquids colliding and folding into each other
  POUR: 2,     // a thick stream filling a vessel
  VORTEX: 3,   // the blender
  RIBBON: 4,   // a falling ribbon folding on itself
  UNDER: 5,    // the world beneath the surface
  BLOB: 6,     // a small soft ripple behind UI
  WALL: 7,     // one huge wave curling — the finale
} as const;

const EXTRA = /* glsl */ `
uniform float uMode;
uniform float uFill;      // 0..1 — pour level / bleed radius / wave build
uniform float uMix;       // 0..1 — how far two liquids have folded together
uniform vec3  uDeepB;     // the second flavour, for MARBLE and BLEED
uniform vec3  uSurfaceB;
uniform vec3  uFoamB;
uniform vec2  uOrigin;    // where a bleed or an impact starts, in uv
uniform float uThick;     // viscosity 0..1, per flavour
`;

const MAIN = /* glsl */ `
/**
 * The creamy lighting model, in 2D. 'h' is the field height, its gradient gives the
 * normal. Same wide specular and subsurface as the ocean — that is what keeps a pour,
 * a ribbon and the sea looking like the same substance.
 */
vec3 shade2d(float h, vec2 grad, vec3 deep, vec3 surf, vec3 foam, float gloss){
  vec3 n = normalize(vec3(-grad * 2.4, 1.0));
  vec3 lig = normalize(vec3(-0.42, 0.62, 0.66));
  vec3 vw  = vec3(0.0, 0.0, 1.0);
  vec3 hlf = normalize(lig + vw);

  float ndl = sat(dot(n, lig) * 0.62 + 0.42);
  float nh  = sat(dot(n, hlf));
  float spec = pow(nh, 20.0) * 0.55 * gloss;
  float sheen = pow(nh, 3.2) * 0.22;

  float lift = sat(h * 0.9 + 0.35);
  vec3 body = mix(deep, surf, pow(lift, 1.1));
  body *= mix(0.45, 1.08, ndl);
  // subsurface — light coming back out of a thick edge
  body += mix(surf, foam, 0.5) * pow(sat(1.0 - abs(h)), 2.0) * 0.30;

  vec3 col = body + spec * mix(foam, vec3(1.0), 0.25) + sheen * foam * 0.5;
  float foamy = sat(smoothstep(0.55, 0.95, h) * smoothstep(0.05, 0.3, length(grad)));
  return mix(col, foam, foamy * 0.42);
}

/** Slow, thick domain-warped turbulence. The site's default liquid motion. */
float swirl(vec2 p, float t, int oct){
  vec2 w = p + vec2(fbm(p * 1.3 + t * 0.10, oct), fbm(p * 1.3 - t * 0.12, oct)) * 0.9;
  return fbm(w * 1.7 + t * 0.08, oct);
}

void main(){
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  int oct = uQuality > 0.9 ? 4 : (uQuality > 0.4 ? 3 : 2);   // the perf governor drives this
  float t = uTime * mix(0.55, 0.22, uThick);   // thicker flavours move slower
  float e = 1.2 / uRes.y;

  vec3 col = vec3(0.0);
  float alpha = 0.0;
  float m = uMode;

  // ── BLEED ── a second flavour spreading through the first, like ink but creamier ──
  if (m < 0.5){
    vec2 d = p - (uOrigin - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    float r = length(d);
    float n = swirl(p * 2.0 + d * 1.4, t, oct);
    // the front is ragged and fingered, the way a dense liquid intrudes into another
    float front = uFill * 2.4 - r + (n - 0.5) * 0.85 * (1.0 - uFill * 0.45);
    float k = smoothstep(-0.06, 0.14, front);

    vec3 deep = mix(uDeep, uDeepB, k);
    vec3 surf = mix(uSurface, uSurfaceB, k);
    vec3 foam = mix(uFoam, uFoamB, k);

    float h = (n - 0.5) * 1.5;
    // Forward differences off n, not four fresh central samples. Two wins at once: the
    // gradient is now of the same field n came from (the old central pair sampled
    // swirl(p), while n is swirl(p*2 + d*1.4) — a gradient of the wrong surface), and it
    // costs two domain-warped noise evaluations per pixel instead of four.
    vec2 q = p * 2.0 + d * 1.4;
    vec2 g = vec2(swirl(q + vec2(e, 0.0), t, oct) - n,
                  swirl(q + vec2(0.0, e), t, oct) - n) / e;
    col = shade2d(h, g * 0.02, deep, surf, foam, 0.8);
    // the advancing edge is brighter — liquid piles up at the front
    col += mix(uFoamB, vec3(1.0), 0.3) * exp(-pow(front * 7.0, 2.0)) * 0.35;
    alpha = 1.0;
  }

  // ── MARBLE ── two liquids driven together until they fold ─────────────────────
  else if (m < 1.5){
    float gap = (1.0 - uMix) * 0.5;
    float n = swirl(p * 1.7, t, oct);
    // each side advances on the other; where they meet the boundary shears into ribbons
    float shear = (n - 0.5) * uMix * 1.7;
    float side = p.x + shear + sin(p.y * 5.5 + t * 0.7 + n * 4.0) * 0.10 * uMix;
    float k = smoothstep(-gap - 0.03, -gap + 0.03, side);
    // at full mix, fold thin ribbons of each through the other
    float ribbon = sin(side * 16.0 + n * 12.0) * 0.5 + 0.5;
    k = mix(k, mix(k, ribbon, 0.55), sat(uMix * 1.4 - 0.4));

    vec3 deep = mix(uDeep, uDeepB, k);
    vec3 surf = mix(uSurface, uSurfaceB, k);
    vec3 foam = mix(uFoam, uFoamB, k);
    float h = (n - 0.5) * 1.6;
    vec2 g = vec2(dFdxApprox(p, t, oct, e), dFdyApprox(p, t, oct, e));
    col = shade2d(h, g * 0.02, deep, surf, foam, 0.85);
    alpha = 1.0;
  }

  // ── POUR ── a wide viscous stream and the level it is building ────────────────
  else if (m < 2.5){
    float level = uFill;                             // uv.y of the surface; 0 = empty
    float n = swirl(p * 2.2, t, oct);

    // the stream: wide (VISC.pourWidth), with a slow wobble, never sheeting or splitting
    float sx = p.x - sin(uv.y * 2.2 + t * 0.5) * 0.012 - 0.0;
    float width = 0.052 * (1.0 + uv.y * 0.22);       // narrows as it accelerates downward
    float stream = smoothstep(width, width * 0.62, abs(sx)) * step(uv.y, 1.0);
    stream *= smoothstep(0.0, 0.06, uFill) * smoothstep(1.02, 0.96, uFill);
    stream *= step(level, uv.y + 0.02);              // stops where the pool has reached

    // the pool, with the meniscus the stream is pushing up
    float dent = exp(-pow((p.x) * 7.0, 2.0)) * 0.018 * smoothstep(0.02, 0.2, uFill);
    float surfY = level + dent + (n - 0.5) * 0.012;
    float pool = smoothstep(surfY + 0.004, surfY - 0.004, uv.y);

    float body = max(stream, pool);
    if (body < 0.003) { gl_FragColor = vec4(0.0); return; }

    float h = pool > 0.5 ? (n - 0.5) * 0.9 : 0.55;   // the stream reads as a raised tube
    vec2 g = pool > 0.5 ? vec2(0.0, -0.3) : vec2(sx * 22.0, 0.0);
    col = shade2d(h, g * 0.06, uDeep, uSurface, uFoam, 1.0);
    // cream gathering where the stream lands
    col = mix(col, uFoam, exp(-pow((uv.y - surfY) * 40.0, 2.0)) * exp(-pow(p.x * 6.0, 2.0)) * 0.45);
    alpha = body;
  }

  // ── VORTEX ── the blender ─────────────────────────────────────────────────────
  else if (m < 3.5){
    float r = length(p);
    float a = atan(p.y, p.x);
    // angular velocity rises toward the centre, so the liquid shears into a spiral
    float spin = uFill * (3.2 / (r + 0.22));
    vec2 q = vec2(cos(a + spin + t * uFill * 2.2), sin(a + spin + t * uFill * 2.2)) * r;
    float n = swirl(q * 2.4, t, oct);
    float k = sat(n * 1.6 - 0.3 + uMix * 0.6);
    vec3 deep = mix(uDeep, uDeepB, k);
    vec3 surf = mix(uSurface, uSurfaceB, k);
    vec3 foam = mix(uFoam, uFoamB, k);
    // as the mix completes the streaks blend away into one colour
    float blended = sat(uMix * 1.5 - 0.5);
    deep = mix(deep, mix(uDeep, uDeepB, 0.5), blended);
    surf = mix(surf, mix(uSurface, uSurfaceB, 0.5), blended);
    float h = (n - 0.5) * 1.8 * (1.0 - blended * 0.6);
    col = shade2d(h, vec2(sin(a) , -cos(a)) * uFill * 0.06, deep, surf, foam, 0.9);
    // the funnel the vortex pulls down at the centre
    col *= mix(1.0, sat(0.25 + r * 2.6), uFill);
    alpha = 1.0;
  }

  // ── RIBBON ── a falling ribbon of shake folding on itself ─────────────────────
  else if (m < 4.5){
    // the ribbon buckles side to side as it lands — the classic viscous coil
    float fall = uv.y * 3.4 - t * 0.5;
    float coil = sin(fall * 2.0) * 0.16 * smoothstep(0.15, 0.85, uv.y);
    float w = 0.055 + smoothstep(0.55, 1.0, uv.y) * 0.10;      // spreads where it piles up
    float d = abs(p.x - coil) - w;
    float n = swirl(p * 3.0, t, oct);
    float band = smoothstep(0.012, -0.012, d + (n - 0.5) * 0.02);
    float heap = smoothstep(0.86, 0.80, uv.y) * 0.0;
    float pile = smoothstep(0.88, 0.84, 1.0 - uv.y) * 0.0;
    float body = max(band, smoothstep(0.90, 0.96, uv.y) * smoothstep(0.34, 0.16, abs(p.x)));
    if (body < 0.003) { gl_FragColor = vec4(0.0); return; }
    float h = (1.0 - sat(abs(d) * 18.0)) * 1.2 + (n - 0.5) * 0.4;
    col = shade2d(h, vec2((p.x - coil) * 16.0, -0.4) * 0.05, uDeep, uSurface, uFoam, 1.0);
    alpha = body;
  }

  // ── UNDER ── inside the shake. Golden and dense, never blue ───────────────────
  else if (m < 5.5){
    float n = swirl(p * 1.5 + vec2(0.0, t * 0.18), t, oct);
    float n2 = swirl(p * 4.0 - vec2(t * 0.1, 0.0), t * 1.4, oct);

    // A second flavour intruding, from the point where the fruit touched down. The front
    // is fingered rather than circular — dense liquid entering dense liquid.
    vec2 bd = p - (uOrigin - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    float front = uFill * 2.6 - length(bd) + (n - 0.5) * 0.9 * (1.0 - uFill * 0.4);
    float k = uFill <= 0.0 ? 0.0 : smoothstep(-0.08, 0.20, front);
    vec3 pDeep = mix(uDeep, uDeepB, k);
    vec3 pSurf = mix(uSurface, uSurfaceB, k);
    vec3 pFoam = mix(uFoam, uFoamB, k);

    // density increases downward — deeper is thicker
    float depth = sat(1.0 - uv.y + (n - 0.5) * 0.3);
    vec3 c = mix(pSurf, pDeep, pow(depth, 0.8));
    // light shafts pushing down through the liquid from the surface above
    float shaft = pow(sat(sin(p.x * 3.4 + n * 2.4) * 0.5 + 0.5), 3.0) * sat(1.0 - depth * 1.3);
    c += mix(pFoam, vec3(1.0), 0.2) * shaft * 0.22;
    // suspended cream and fibre
    c = mix(c, pFoam, sat(n2 * 1.5 - 0.85) * 0.28);
    // the advancing edge piles up brighter
    if (uFill > 0.0) c += mix(uFoamB, vec3(1.0), 0.25) * exp(-pow(front * 6.0, 2.0)) * 0.30;
    // bubbles rising
    for (int i = 0; i < 10; i++){
      vec2 r1 = hash22(vec2(float(i) * 2.3, 7.7));
      float by = fract(r1.y + t * (0.04 + r1.x * 0.05));
      vec2 bp = vec2((r1.x - 0.5) * 1.7, by - 0.5);
      float br = (0.004 + r1.y * 0.010);
      float b = smoothstep(br, br * 0.5, length(p - bp));
      c = mix(c, mix(pFoam, vec3(1.0), 0.45), b * 0.5);
    }
    col = c;
    alpha = 1.0;
  }

  // ── BLOB ── a soft ripple behind UI. Deliberately quiet ───────────────────────
  else if (m < 6.5){
    vec2 d = p - (uOrigin - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    float n = swirl(p * 3.0, t, oct);
    float r = length(d * vec2(1.0, 1.5));
    float k = smoothstep(0.42 * uFill + 0.02, 0.0, r + (n - 0.5) * 0.12);
    col = mix(uSurface, uFoam, n * 0.5);
    alpha = k * 0.9;
  }

  // ── WALL ── one huge wave building and curling. The finale ────────────────────
  else {
    float build = uFill;
    float n  = swirl(p * 1.15 + vec2(t * 0.05, 0.0), t, oct);
    float n2 = swirl(p * 3.2 - vec2(t * 0.09, 0.0), t * 1.2, oct);

    // The crest is an ARC, not a level. It peaks right of centre and falls away to both
    // edges, which is what gives the wave a shoulder to curl over. Capped well below the
    // top of the frame — a crest pushed off-screen is just a flood of colour.
    float shoulder = 1.0 - pow(abs(uv.x - 0.62) * 1.85, 1.7);
    float crestY = 0.08 + build * 0.66 * sat(shoulder);
    crestY += (n - 0.5) * 0.10 * (0.5 + build);

    float face = crestY - uv.y;

    // the lip: once the wave is tall enough it throws forward, overhanging its own face
    float lipT = smoothstep(0.55, 1.0, build);
    float lipY = crestY + 0.05 + (n2 - 0.5) * 0.04;
    float lip = smoothstep(0.030, 0.0, abs(uv.y - lipY) - 0.012)
              * smoothstep(0.24, 0.52, uv.x) * smoothstep(1.02, 0.72, uv.x) * lipT;

    float body = max(smoothstep(-0.012, 0.014, face), lip);
    if (body < 0.003) { gl_FragColor = vec4(0.0); return; }

    // the face is lit from behind the crest, so it brightens as it thins toward the lip
    float h = sat(face * 1.6 + 0.25) * 1.4 + (n - 0.5) * 0.45;
    h = mix(h, 1.35, lip);
    vec2 g = vec2((n - 0.5) * 1.1 + (uv.x - 0.62) * 0.9, -1.25 - face * 0.8);
    col = shade2d(h, g * 0.05, uDeep, uSurface, uFoam, 1.0);

    // foam gathering along the crest line and spilling down the face
    float crestFoam = exp(-pow(face * 30.0, 2.0)) * (0.35 + lipT * 0.35);
    crestFoam += sat(n2 * 1.6 - 1.0) * smoothstep(0.16, 0.0, abs(face)) * 0.5;
    col = mix(col, mix(uFoam, vec3(1.0), 0.2), sat(crestFoam));

    // the trough in front of the wave sits in its shadow
    col *= mix(0.62, 1.0, sat(face * 1.4 + 0.55));
    alpha = body;
  }

  gl_FragColor = vec4(col * alpha, alpha);
}
`;

/** MARBLE needs the field gradient; these stand in for dFdx/dFdy, which GLSL ES 1.00 lacks. */
const HELPERS = /* glsl */ `
float dFdxApprox(vec2 p, float t, int oct, float e){
  vec2 w1 = (p + vec2(e, 0.0)) + vec2(fbm((p + vec2(e,0.0)) * 1.3 + t * 0.10, oct), 0.0) * 0.9;
  vec2 w2 = (p - vec2(e, 0.0)) + vec2(fbm((p - vec2(e,0.0)) * 1.3 + t * 0.10, oct), 0.0) * 0.9;
  return (fbm(w1 * 1.7, oct) - fbm(w2 * 1.7, oct)) / (2.0 * e);
}
float dFdyApprox(vec2 p, float t, int oct, float e){
  vec2 w1 = (p + vec2(0.0, e)) + vec2(0.0, fbm((p + vec2(0.0,e)) * 1.3 - t * 0.12, oct)) * 0.9;
  vec2 w2 = (p - vec2(0.0, e)) + vec2(0.0, fbm((p - vec2(0.0,e)) * 1.3 - t * 0.12, oct)) * 0.9;
  return (fbm(w1 * 1.7, oct) - fbm(w2 * 1.7, oct)) / (2.0 * e);
}
`;

export const fieldFrag = [COMMON, EXTRA, NOISE, HELPERS, MAIN].join("\n");

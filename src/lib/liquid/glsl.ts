/**
 * Shared GLSL chunks. Every liquid on the site is built from these, which is why the
 * ocean, the pour, the builder cup and the finale all read as the same material.
 *
 * Targets GLSL ES 1.00 deliberately: a WebGL2 context happily compiles it, and the same
 * source then runs unchanged on a WebGL1 fallback. No #version line anywhere.
 */

export const COMMON = /* glsl */ `
precision highp float;
varying vec2 vUv;

uniform vec2  uRes;
uniform float uTime;
uniform float uProgress;     // scene scroll progress 0..1
uniform vec2  uPointer;      // -1..1, already lagged by the viscosity spring
uniform float uPointerAmt;   // pointer influence, fades out on idle
uniform float uQuality;      // 1.0 desktop, 0.0 mobile/reduced

uniform vec3  uDeep;
uniform vec3  uSurface;
uniform vec3  uFoam;
uniform vec3  uSky;

const float PI = 3.14159265;

float tanh1(float x){ float e = exp(2.0 * clamp(x, -8.0, 8.0)); return (e - 1.0) / (e + 1.0); }
float sat(float x){ return clamp(x, 0.0, 1.0); }
`;

export const NOISE = /* glsl */ `
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p){
  vec3 a = fract(vec3(p.xyx) * vec3(123.34, 234.34, 345.65));
  a += dot(a, a + 34.45);
  return fract(vec2(a.x * a.y, a.y * a.z));
}

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), u.x),
             mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), u.x), u.y);
}

float fbm(vec2 p, int oct){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++){
    if (i >= oct) break;
    v += a * vnoise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    a *= 0.5;
  }
  return v;
}
`;

/**
 * The viscous surface.
 *
 * Water gets sharp crests and flat troughs. Thick shake does the opposite: broad rounded
 * crests that *hold* their shape (surface tension), shallow wide troughs, and almost no
 * high-frequency chop because viscosity eats it. Three moves produce that:
 *
 *   1. speed scaled by VISC.waveSpeed  — the swell crawls
 *   2. tanh saturation                 — nothing is allowed to spike
 *   3. high octaves damped hard        — no chop, only body
 *
 * uWaveA/uWaveB inject the two colliding swells; uRipple* injects the pointer.
 */
export const SURFACE = /* glsl */ `
uniform float uAmp;          // global surface amplitude
uniform float uSpeed;        // viscous wave speed (already scaled)
uniform vec4  uWaveA;        // xy = origin, z = strength, w = width   (left swell)
uniform vec4  uWaveB;        // xy = origin, z = strength, w = width   (right swell)
uniform float uCollide;      // 0..1 crown rise at the meeting point
uniform float uCalm;         // 1 = fully settled, kills the swells
uniform vec2  uFocus;        // world xz the film happens around — the bottle, NOT the camera

// A travelling swell: a long rounded ridge, not a bump. Thick liquid pushes a wall.
float swell(vec2 p, vec4 w){
  if (w.z <= 0.001) return 0.0;
  // distance across the ridge: the swell is a wall travelling along x toward the centre
  float d = p.x - w.x;
  float ridge = exp(-d * d / max(w.w, 0.001));
  // the ridge is wider across its length, and sags at the ends
  float along = exp(-pow((p.y - w.y) * 0.16, 2.0));   // w.y is the world z of the ridge
  return ridge * along * w.z;
}

float shakeHeight(vec2 p, float t, int oct){
  float tt = t * uSpeed;

  // ── ambient surface ────────────────────────────────────────────────────────
  // body: three long swells, deliberately incommensurate so it never visibly loops
  float h  = sin(dot(p, vec2(0.34, 0.12)) + tt * 0.80) * 0.72;
  h += sin(dot(p, vec2(-0.26, 0.39)) - tt * 0.63) * 0.46;
  h += sin(dot(p, vec2(0.11, -0.52)) + tt * 1.02) * 0.24;

  // Domain warp gives the surface its slow creamy folding. The warp itself runs at two
  // octaves regardless of quality: it only displaces where the outer fbm is sampled, and
  // that outer fbm smooths any detail the warp carries straight back out again. Three
  // full-octave fbm calls per height sample was a third of the entire shader's cost for a
  // difference no screenshot could show.
  int woct = oct < 2 ? oct : 2;   // GLSL ES 1.00 has no integer min()
  vec2 w = p + vec2(fbm(p * 0.33 + tt * 0.10, woct), fbm(p * 0.33 - tt * 0.08, woct)) * 1.1;
  h += (fbm(w * 0.48 + tt * 0.12, oct) - 0.5) * 0.78;

  // Chop, damped hard — viscosity eats small waves almost entirely. One octave, not
  // oct: at an amplitude of 0.038 against a body of ~2.3 the extra octaves were a
  // quarter of the cost of every height sample in the raymarch and invisible in the frame.
  h += (vnoise(p * 2.4 - tt * 0.26) - 0.5) * 0.038;

  h *= uAmp;

  // Viscous saturation applies to the AMBIENT surface only: rounded crests, nothing
  // spikes. Event geometry is added afterwards — folding it in here would let a big
  // crown saturate the whole visible field into one flat plateau.
  h = tanh1(h * 0.95) * 1.05;

  // ── events ────────────────────────────────────────────────────────────────
  h += (swell(p, uWaveA) + swell(p, uWaveB)) * uCalm;

  // crown at the meeting point — a thick column held up by surface tension, plus the
  // ring it throws outward. Narrow on purpose: a wide one reads as a rising tide.
  if (uCollide > 0.001){
    vec2 q = (p - uFocus) * vec2(1.0, 0.80);
    float r = length(q);
    // the sheet climbing the bottle's sides — a ring, with the bottle standing clear in it
    float crown = exp(-pow(r - 1.25, 2.0) * 1.25) * uCollide * 1.15;
    // the secondary ring thrown outward by the impact
    crown += exp(-pow(r - 3.10, 2.0) * 0.85) * uCollide * 0.42;
    // and a shallow dish right at the base, where the two swells cancelled
    crown -= exp(-r * r * 2.2) * uCollide * 0.30;
    h += crown;
  }

  // pointer: a slow depression that drags, the way a finger moves through a smoothie
  if (uPointerAmt > 0.001){
    vec2 pp = uFocus + uPointer * vec2(9.0, 4.0) + vec2(0.0, 1.5);
    float d = length(p - pp);
    h -= exp(-d * d * 0.09) * 0.30 * uPointerAmt;
    h += exp(-pow(d - 1.7, 2.0) * 0.7) * 0.14 * uPointerAmt;     // the rim it pushes up
  }

  return h;
}

vec3 shakeNormal(vec2 p, float t, float e, int oct){
  float hx = shakeHeight(p + vec2(e, 0.0), t, oct) - shakeHeight(p - vec2(e, 0.0), t, oct);
  float hz = shakeHeight(p + vec2(0.0, e), t, oct) - shakeHeight(p - vec2(0.0, e), t, oct);
  return normalize(vec3(-hx, 2.0 * e, -hz));
}
`;

/**
 * Shading. The single most important difference from a water shader:
 *   - the specular lobe is WIDE (pow 18, not pow 220) because cream scatters
 *   - there is a subsurface term: light that entered the crest and came back out
 *   - the body is OPAQUE — you never see through shake into a dark depth
 *   - foam sits in the crest curvature, tinted, never white
 */
export const SHADE = /* glsl */ `
uniform float uSpecPower;
uniform float uSSS;
uniform vec3  uLight;    // direction TO the sun. Kept low and beyond the horizon so its
                         // reflection streaks back down the surface toward the camera —
                         // a high sun on a near-horizontal plane produces no highlight at all.

vec3 skyColor(vec3 rd){
  float y = sat(rd.y * 1.6 + 0.28);
  vec3 top = uSky * 0.86;
  vec3 hor = mix(uSky, uFoam, 0.55) * 1.12;
  vec3 c = mix(hor, top, pow(y, 0.7));
  // the low sun itself — this disc is what every crest is reflecting
  float sd = sat(dot(normalize(rd), uLight));
  float sun = pow(sd, 40.0);      // a soft glow, not a disc — a mirror here would read as water
  float bloom = pow(sd, 3.2);
  c += mix(uFoam, vec3(1.0), 0.25) * (sun * 0.22 + bloom * 0.18);
  return c;
}

vec3 shadeShake(vec3 n, vec3 rd, vec3 lig, float height, float dist){
  float ndl  = sat(dot(n, lig) * 0.6 + 0.4);     // wrapped: cream lights from all round
  float ndv  = sat(dot(n, -rd));
  vec3  hlf  = normalize(lig - rd);
  float nh   = sat(dot(n, hlf));

  // broad, creamy specular — a cream highlight, not a mirror glint
  float spec  = pow(nh, uSpecPower) * 0.42;
  float sheen = pow(nh, 3.0) * 0.30;             // the wide soft wash around it

  // subsurface: light that entered a crest and came back out. This is "creamy".
  float thin = sat(height * 0.55 + 0.48);
  float back = pow(sat(dot(-n, lig) * 0.4 + 0.6), 2.0);
  vec3  sss  = mix(uSurface, uFoam, 0.45) * back * thin * uSSS;

  // body: troughs sink into the deep pigment, crests rise into lit surface colour.
  // The range is wide on purpose — a narrow range is what makes CG liquid look like vinyl.
  float lift = sat(height * 0.62 + 0.36);
  vec3 body = mix(uDeep, uSurface, pow(lift, 1.15));
  body = mix(body, uSurface * 1.14, ndl * 0.42);
  // troughs self-shadow: neighbouring crests block the low sun. Without this the whole
  // ocean sits in one tonal band and reads flat however good the waves are.
  body *= mix(0.38, 1.08, pow(lift, 0.75));

  // grazing reflection of the warm sky — glossy, never glassy
  float fres = pow(1.0 - ndv, 5.0) * 0.20 + 0.01;   // opaque body, only a grazing sheen
  vec3 refl = skyColor(reflect(rd, n));

  vec3 col = body + sss;
  col = mix(col, refl, sat(fres) * 0.55);
  col += spec * mix(uFoam, vec3(1.0), 0.18);   // tinted, never white
  col += sheen * uFoam * 0.6;

  // foam: only where the surface is both high and strongly curved
  float curv = sat(1.0 - abs(n.y));
  float foam = sat(smoothstep(0.30, 0.80, height) * smoothstep(0.06, 0.30, curv));
  col = mix(col, mix(uFoam, vec3(1.0), 0.25), foam * 0.55);

  // haze into the flavour atmosphere, but only far out
  col = mix(col, mix(uSky, uFoam, 0.30), sat((dist - 11.0) / 44.0) * 0.72);
  return col;
}
`;

/** Camera + heightfield raymarch. Waves can rise above the horizon and occlude it. */
export const MARCH = /* glsl */ `
uniform float uCamH;
uniform float uPitch;
uniform float uFov;
uniform float uCamZ;

void camera(vec2 uv, out vec3 ro, out vec3 rd){
  vec2 ndc = uv * 2.0 - 1.0;
  ndc.x *= uRes.x / uRes.y;
  ro = vec3(0.0, uCamH, uCamZ);
  vec3 fwd = normalize(vec3(0.0, -sin(uPitch), -cos(uPitch)));
  vec3 rgt = vec3(1.0, 0.0, 0.0);
  vec3 up  = cross(rgt, fwd);
  rd = normalize(fwd + rgt * ndc.x * uFov + up * ndc.y * uFov);
}

/**
 * Where a ray meets the shake.
 *
 * A heightfield has no true SDF, so this is a linear march with sign-change detection and
 * a bisection refine. The expensive part is that every step evaluates shakeHeight, which
 * is several octaves of domain-warped noise — so the work here is almost entirely about
 * evaluating it fewer times:
 *
 *   · **Sky is answered with arithmetic.** A ray that rises and starts above the tallest
 *     possible crest can never hit. That is roughly half the frame, and it used to cost a
 *     full march to a miss.
 *   · **The empty air is skipped exactly.** A ray descending from above the crest ceiling
 *     cannot hit before it reaches that ceiling, and cannot hit after it passes below the
 *     trough floor. Both bounds are solved, not approximated, so nothing is lost.
 *   · **Detail falls off with distance.** Past ~8 units an octave of the warp is well
 *     under a pixel, and past ~22 the haze has taken the surface anyway.
 */
float marchSurface(vec3 ro, vec3 rd, float tmax, int steps, int oct){
  // A conservative ceiling on the surface, from the terms that actually drive it.
  float hMax = uAmp * 1.10 + max(uWaveA.z, uWaveB.z) * uCalm + uCollide * 1.65 + 0.25;

  if (rd.y >= 0.0 && ro.y > hMax) return -1.0;          // sky, for free

  float t = 0.05;
  float fall = -rd.y;
  if (fall > 1e-4){
    if (ro.y > hMax) t = max(t, (ro.y - hMax) / fall);  // skip the empty air above
    tmax = min(tmax, (ro.y + hMax) / fall);             // stop below the deepest trough
  }
  if (t >= tmax) return -1.0;

  float dt = 0.14 + t * 0.03;
  float lastT = t;
  for (int i = 0; i < 64; i++){
    if (i >= steps) break;
    t += dt;
    dt *= 1.16;                                    // coarser with distance
    if (t > tmax) return -1.0;
    int moct = t < 8.0 ? oct : (t < 22.0 ? 2 : 1);
    vec3 p = ro + rd * t;
    if (p.y - shakeHeight(p.xz, uTime, moct) < 0.0){
      // bisect between lastT (above) and t (below)
      float a = lastT, b = t;
      for (int j = 0; j < 5; j++){
        float m = (a + b) * 0.5;
        vec3 pm = ro + rd * m;
        if (pm.y - shakeHeight(pm.xz, uTime, moct) < 0.0) b = m; else a = m;
      }
      return (a + b) * 0.5;
    }
    lastT = t;
  }
  return -1.0;
}
`;

/** Builds a complete fragment shader from the chunks plus a scene-specific main(). */
export const buildFrag = (main: string, extraUniforms = "") =>
  [COMMON, extraUniforms, NOISE, SURFACE, SHADE, MARCH, main].join("\n");

export const VERT = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

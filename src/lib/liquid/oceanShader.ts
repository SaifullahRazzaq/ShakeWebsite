import { buildFrag } from "./glsl";

/**
 * The Mango Ocean.
 *
 * Rendered TWICE per frame into two stacked canvases sharing one deterministic
 * simulation, split by depth against the bottle:
 *
 *   uLayer = 0  REAR   everything the camera sees  (plane 3, behind the bottle)
 *   uLayer = 1  FRONT  only liquid nearer than the bottle (plane 6, in front of it)
 *
 * Because the split is a real depth test against uBottleDist and not an artistic
 * guess, the bottle is genuinely *inside* the ocean: near foam licks across its base
 * while the same wave continues unbroken behind it.
 */
const EXTRA = /* glsl */ `
uniform float uLayer;        // 0 rear, 1 front
uniform float uBottleDist;   // camera-space distance to the bottle
uniform float uSplash;       // 0..1 burst timeline
uniform float uFreeze;       // 1 = droplets hang in the air
uniform float uDropAmt;      // droplet opacity
uniform float uDive;         // 0..1 camera sinking through the surface
`;

const MAIN = /* glsl */ `
// Project a world point into this camera. Returns screen uv, depth and a pixel scale.
void project(vec3 P, out vec2 uv, out float depth, out float pxScale){
  vec3 ro = vec3(0.0, uCamH, uCamZ);
  vec3 fwd = normalize(vec3(0.0, -sin(uPitch), -cos(uPitch)));
  vec3 rgt = vec3(1.0, 0.0, 0.0);
  vec3 up  = cross(rgt, fwd);
  vec3 v = P - ro;
  float c = dot(v, fwd);
  depth = c;
  float aspect = uRes.x / uRes.y;
  float nx = (dot(v, rgt) / max(c, 0.001)) / uFov;
  float ny = (dot(v, up)  / max(c, 0.001)) / uFov;
  uv = vec2(nx / aspect, ny) * 0.5 + 0.5;
  pxScale = 1.0 / max(c * uFov, 0.001);
}

/**
 * One droplet. Thick shake throws few, fat, slow drops that stretch into ligaments
 * along their travel and never atomise into spray.
 */
vec4 droplet(int i, vec2 uv, float aspect){
  vec2 r1 = hash22(vec2(float(i) * 1.7, 9.1));
  vec2 r2 = hash22(vec2(float(i) * 3.3, 2.4));

  float ang = r1.x * 6.2831;
  float lateral = mix(0.5, 1.5, r1.y);
  float rise    = mix(2.0, 3.8, r2.x);
  vec3 vel = vec3(cos(ang) * lateral, rise, sin(ang) * lateral * 0.45);

  // launch ring: the crown throws from a circle, not a point
  vec3 origin = vec3(uFocus.x + cos(ang) * 1.15, 0.45, uFocus.y + sin(ang) * 0.75);

  // viscous ballistics: heavy drag, so drops decelerate hard and hang
  float tt = max(0.0, uSplash - r2.y * 0.22) * 1.9 * mix(0.78, 1.26, r1.x);
  float drag = 0.55;
  float k = (1.0 - exp(-drag * tt)) / drag;
  vec3 pos = origin + vel * k - vec3(0.0, 1.0, 0.0) * 3.1 * (tt - k) / drag;

  vec2 suv; float depth, px;
  project(pos, suv, depth, px);
  if (depth < 0.2) return vec4(0.0);

  // depth split — this is what puts some of the splash in front of the bottle
  float front = step(depth, uBottleDist);
  if (uLayer > 0.5 && front < 0.5) return vec4(0.0);
  if (uLayer < 0.5 && front > 0.5) return vec4(0.0);

  float rad = mix(0.012, 0.030, r1.y) * px * 3.5;     // world radius × VISC.dropletScale
  vec2 d = (uv - suv) * vec2(aspect, 1.0);

  // stretch along travel: the ligament a thick drop drags behind it
  vec2 dir = normalize(vec2(vel.x, vel.y - 3.1 * tt) + 1e-5);
  float along = dot(d, dir), across = dot(d, vec2(-dir.y, dir.x));
  float stretch = mix(1.0, 2.8, sat(length(vel) * tt * 0.10) * (1.0 - uFreeze * 0.65));
  float sd = length(vec2(along / stretch, across)) / max(rad, 1e-4);

  float body = smoothstep(1.0, 0.86, sd);   // a thick drop has a defined edge
  if (body <= 0.001) return vec4(0.0);

  // shade the drop as a bead of the same material
  vec3 n = normalize(vec3(d * 6.0 / max(rad, 1e-4), sqrt(sat(1.0 - sd * sd)) + 0.35));
  vec3 lig = normalize(uLight);
  vec3 col = mix(uDeep, uSurface, 0.72) + uFoam * pow(sat(dot(n, lig)), 3.0) * 0.55;
  col += pow(sat(dot(n, normalize(lig + vec3(0.0, 0.35, 1.0)))), 20.0) * 1.1;   // the tiny hot glint

  // drops closest to camera go soft — real depth of field, not a blur filter
  float dof = sat((uBottleDist - depth) / 2.4);
  body *= mix(1.0, 0.72, dof * dof);

  return vec4(col, body * uDropAmt);
}

void main(){
  float aspect = uRes.x / uRes.y;
  vec3 ro, rd;
  camera(vUv, ro, rd);
  vec3 lig = normalize(uLight);

  // Three tiers, not two: the perf governor moves uQuality between them so a laptop
  // that cannot hold 60fps loses detail rather than losing frames.
  int oct   = uQuality > 0.9 ? 4 : (uQuality > 0.4 ? 3 : 2);
  int steps = uQuality > 0.9 ? 30 : (uQuality > 0.4 ? 24 : 18);

  vec4 outCol = vec4(0.0);

  // The front layer keeps ONLY liquid nearer than the bottle and its seam is fully
  // transparent past uBottleDist + 0.35 — so marching the other seventy units was work
  // whose every result was multiplied by zero. Clamping here is free in the image and
  // roughly halves the cost of the hero, which pays for two of these canvases.
  float far = uLayer > 0.5 ? uBottleDist + 0.4 : 78.0;

  float t = marchSurface(ro, rd, far, steps, oct);
  if (t > 0.0){
    vec3 p = ro + rd * t;
    float e = max(0.018, t * 0.013);                 // LOD: coarser normals with distance
    // The normal is four more height evaluations, the most expensive single thing left in
    // the shader. Past ~8 units an octave of the domain warp is well under a pixel, so it
    // drops with distance exactly as the march does — and the two must agree, or the
    // shading would light a surface the march never found.
    int soct = t < 8.0 ? oct : (t < 22.0 ? 2 : 1);
    vec3 n = shakeNormal(p.xz, uTime, e, soct);
    float h = shakeHeight(p.xz, uTime, soct);
    vec3 c = shadeShake(n, rd, lig, h, t);

    float a = 1.0;
    if (uLayer > 0.5){
      // front plane keeps only liquid nearer than the bottle, with a soft seam so the
      // cut never shows as a hard edge across a wave
      a = smoothstep(uBottleDist + 0.35, uBottleDist - 0.35, t);
    }
    outCol = vec4(c * a, a);
  }

  // the splash
  if (uDropAmt > 0.001){
    int drops = uQuality > 0.4 ? 16 : 10;
    for (int i = 0; i < 16; i++){
      if (i >= drops) break;
      vec4 d = droplet(i, vUv, aspect);
      outCol.rgb = mix(outCol.rgb, d.rgb, d.a);
      outCol.a = max(outCol.a, d.a);
    }
  }

  // crossing the surface: the lens of liquid the camera passes through
  if (uDive > 0.001){
    float band = sat(uDive * 1.6);
    vec3 under = mix(uDeep, uSurface, 0.55 + 0.25 * fbm(vUv * 4.0 + uTime * 0.12, 3));
    outCol.rgb = mix(outCol.rgb, under, band);
    outCol.a = max(outCol.a, band);
  }

  gl_FragColor = outCol;
}
`;

export const oceanFrag = buildFrag(MAIN, EXTRA);

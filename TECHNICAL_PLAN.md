# Technical plan — how each effect is actually rendered

## The rule that decides everything

> Shake is not water. If the liquid behaves like blue water recoloured yellow, it has failed.

Encoded as literal shader constants in `src/lib/liquid/viscosity.ts` and obeyed by every
scene. Against water, shake gets:

| property | water | shake | where enforced |
|---|---|---|---|
| wave speed | 1.0 | **0.22** | `WAVE_SPEED` |
| crest shape | sharp | **rounded** (crests flattened by `pow(h,0.6)`) | `crestShape()` |
| settle time | ~0.4 s | **2.6 s** | `SETTLE` |
| droplet size | small | **3.5× larger, fewer** | splash SDF radius |
| ligaments | snap instantly | **stretch before breaking** | `stretchBreak()` |
| pour stream | narrow | **2.4× wider, no sheeting** | pour shader |
| specular | tight, mirror | **broad + creamy, wide lobe** | `spec(pow 18)` not `pow 220` |
| body | transparent | **opaque, subsurface-lit** | fake SSS term |
| pointer response | instant | **lagged 340 ms, over-damped** | pointer spring |

## Technology per effect — chosen for visual benefit, not for sounding impressive

| Effect | Tech | Why |
|---|---|---|
| Ocean surface, waves, ripples, refraction, splash, dive, under-liquid, flavour bleed, collision, pour, liquid type | **Raw WebGL2, fullscreen-quad fragment shaders** | These are full-viewport 2D-ish fields. A raymarched heightfield in one fragment shader gives real specular, real refraction and real viscosity. Three.js would add ~600 KB of scene graph for a single quad — no visual benefit. |
| Bottle, fruit, ice, cookie | **SVG art components, layered + lit** | No photographic assets exist (see ASSET_REQUIREMENTS.md). Vector art with gradient-based commercial lighting is honest and swaps out for photography via `shake.config.ts` with no code change. |
| Scroll choreography | **GSAP + ScrollTrigger, Lenis** | One animation system owns scroll. No competing Framer Motion timelines. |
| Small UI distortion (button, text refraction) | **SVG `feTurbulence`/`feDisplacementMap`** | Cheap, no GL context needed for a button. |
| Composition, parallax, bottle transforms | **CSS transforms** | GPU-friendly, no repaint. |

## Why not Three.js / R3F

Every liquid effect here is a screen-space field evaluated per pixel. Three.js earns its
place the moment real **GLB bottles** arrive (see ASSET_REQUIREMENTS.md) — at that point
`ProductBottle` swaps its SVG renderer for an R3F one behind the same props. Until then it
would be dead weight on a page that must hold 60 fps.

## Performance architecture

- **One WebGL context per scene**, created lazily, destroyed on unmount.
- Every canvas is behind an `IntersectionObserver`; **off-screen = no rAF work at all**.
- Scroll progress reaches shaders through **`uniform` writes on a ref**, never React state.
  Zero React renders during scroll.
- DPR capped at 1.75 desktop / 1.35 mobile; shader-internal octave counts drop on mobile.
- Heavy scenes are `next/dynamic` with `ssr: false`, below-the-fold.
- `prefers-reduced-motion`: waves damp to a slow breathe, camera dive becomes a crossfade,
  parallax off, splash renders as a held composition. **The visual identity survives.**

## Graceful degradation

No WebGL2 → WebGL1 path → CSS gradient + static SVG composition. The page is always
readable and always on-brand; it just stops being cinematic.

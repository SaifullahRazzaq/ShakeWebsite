# WAVEHOUSE — an interactive liquid world

A cinematic, scroll-driven site for a premium shake brand. The whole homepage is one
continuous film made of liquid: **scene → transformation → scene**, never a section stack.

```
npm install
npm run dev        # http://localhost:3000
npm run build
npm run audit      # screenshots the whole film + checks overflow/console (needs dev running)
```

## Read these first

| File | What it is |
|---|---|
| `STORYBOARD.md` | All 25 scenes, the loud/quiet rhythm, and the hero's beat sheet |
| `TECHNICAL_PLAN.md` | Which technology renders which effect, and why |
| `ASSET_REQUIREMENTS.md` | **Everything that is currently placeholder art, and what to shoot** |
| `src/shake.config.ts` | The whole site's data. Flavours, menu, locations, prices, palettes |

## The one rule

> **Shake is not water.** If the liquid behaves like blue water recoloured yellow, it has failed.

That rule is not a note — it is a file. `src/lib/liquid/viscosity.ts` holds the numbers
(wave speed 0.22× water, settle 2.6 s, specular exponent 18 not 220, pointer lag 340 ms,
droplets 3.5× larger and fewer) and every shader on the site reads from it. Change a value
there and the entire world changes weight at once.

## How the liquid is built

Raw **WebGL2 fragment shaders on a fullscreen quad**, no Three.js. Every liquid here is a
screen-space field, so a scene graph would add ~600 KB for no visual gain. Three.js earns
its place the day real GLB bottles arrive — see ASSET_REQUIREMENTS.md.

- `src/lib/liquid/glsl.ts` — shared chunks: noise, the viscous height field, the creamy
  shading model, the heightfield raymarch.
- `src/lib/liquid/oceanShader.ts` — the Mango Ocean and its splash.
- `src/lib/liquid/fieldShader.ts` — one program, eight modes (bleed, marble, pour, vortex,
  ribbon, under, blob, wall). Every non-ocean liquid on the site.
- `src/lib/liquid/camera.ts` — the hero camera, **solved not guessed**.

### Why the bottle is genuinely *in* the ocean

The ocean renders **twice per frame into two stacked canvases**, split by a real depth test
against the bottle's camera distance:

```
plane 3   REAR   canvas   everything the camera sees
plane 5   BOTTLE DOM/SVG
plane 6   FRONT  canvas   only liquid nearer than the bottle
```

Both canvases run the same deterministic simulation, so one wave runs unbroken from behind
the bottle to in front of it, and near foam licks across its base. `camera.ts` derives the
split distance (4.05 at the default camera) from where the bottle's base is drawn, so
moving the camera moves the split with it and the composition never drifts.

## Performance

- **Contexts are created and destroyed on visibility.** There are 17 canvases and browsers
  cap a document at ~16 live WebGL contexts — past that they are silently lost and scenes
  render blank. `LiquidCanvas` wakes at 40% from the viewport and releases at 150%, and
  replays every cached uniform on re-init, so scenes never know it happened.
- **Zero React renders during scroll.** GSAP timelines write uniforms through refs.
- DPR capped 1.7 desktop / 1.3 mobile; shader octaves and march steps drop on mobile.
- 183 kB first-load JS, fully static.

## Accessibility

`prefers-reduced-motion` keeps the identity and drops the motion: the liquid still renders
and breathes (4× slower clock), the camera dive becomes a crossfade, the splash becomes a
held composition, parallax stops. No WebGL at all falls back to CSS gradients and the SVG
composition — always readable, just no longer cinematic.

## What is placeholder

The **bottles and fruit are vector art, not photography**, and that is the biggest quality
ceiling on the site. Every one is marked `// PLACEHOLDER ART —` in code and wired to a
config field: drop a real transparent WebP into `flavor.bottle` and it replaces the vector
with no code change.

The liquid is **not** placeholder. The ocean, splash, pour, dive, bleed, marbling and
finale are real shader simulations and are shipping quality.

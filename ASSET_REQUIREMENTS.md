# ASSET_REQUIREMENTS.md

## Status: **no production media exists in this repository.**

`public/assets/` was empty at build time. Everything currently on screen is rendered
procedurally — WebGL shaders for all liquid, SVG art for all solids. Nothing here is a
"CSS blob pretending to be liquid": the ocean, splash, pour, dive and flavour transitions
are real shader simulations. But the **bottle and fruit are vector art, not photography**,
and that is the single biggest quality ceiling on this site.

Every item below is wired to a config field already. Drop the file in, set the path in
`src/shake.config.ts`, and it replaces the placeholder with **no code change**.

Placeholders are marked in code with `// PLACEHOLDER ART —` comments.

---

## Priority 1 — the bottle (biggest visual win)

Transparent PNG/WebP, shot on black, 2000×3000, alpha-clean edges.

| File | Notes |
|---|---|
| `bottles/mango.webp` | hero bottle. Needs condensation **in the photograph**. |
| `bottles/strawberry.webp` | |
| `bottles/chocolate.webp` | |
| `bottles/pistachio.webp` | |
| `bottles/oreo.webp` | |

Shoot notes: single large softbox 45° camera-left, black card camera-right for the edge
highlight, bottle **dry-then-misted** (glycerine/water 1:1). Label must stay readable at
40% width. Also supply each bottle with its **liquid line masked separately** if possible —
it lets the dive scene fill the bottle independently.

Config: `flavors[].bottle`

## Priority 2 — the splash sequences

Pre-rendered transparent **WebM (VP9 + alpha)** + AVIF image-sequence fallback, 1920×1080,
60 fps, 2–3 s, shot or simulated in slow motion.

| File | Beat |
|---|---|
| `liquid/mango/collide.webm` | two waves meeting around a bottle — **shoot with the bottle in frame** |
| `liquid/mango/splash.webm` | crown splash, thick |
| `liquid/mango/pour.webm` | wide viscous stream, bottle → glass |
| `liquid/mango/wave.webm` | single large curling wave (used by the finale) |
| repeat per flavour | strawberry / chocolate / pistachio |

Sim notes: if CG, use **Houdini FLIP, viscosity 8–15**, surface tension high, ~2.4× water
density. Render 240 fps, retime to 60. The shader versions are good; real fluid sim is better.

## Priority 3 — fruit cutouts

Transparent, 1400 px, studio-lit, **multiple angles per fruit** (the gravity scene needs 3+).

`fruit/mango/{cube,slice,half,whole}.webp` · same for strawberry, banana, pistachio, berries
Also: `fruit/oreo/{whole,broken,crumb}.webp`

## Priority 4 — surfaces and textures

| File | Use |
|---|---|
| `condensation/droplets.webp` | alpha texture over the cold bottle |
| `condensation/normal.webp` | droplet normal map for refraction |
| `liquid/mango/surface.webp` | albedo detail on the ocean |
| `liquid/displacement.webp` | shared displacement map |
| `liquid/normal.webp` | shared normal map |
| `ice/{01..06}.webp` | transparent ice cubes |

## Optional — 3D

`bottles/*.glb` (Draco, <400 KB each, PBR + clearcoat). If these arrive, `ProductBottle`
switches to an R3F renderer behind the same props and the bottle gains **true refraction of
the liquid behind it**. This is the one upgrade that would justify adding Three.js.

---

## What is genuinely procedural (not a placeholder, do not replace)

- The mango-shake ocean surface, its waves, foam and specular
- Pointer ripples, wave collision, the dive refraction
- The under-liquid environment
- Flavour bleed / colour-cloud transitions
- Flavour collision marbling
- Liquid inside the builder cup
- Film grain

These are shipping quality. Photography would not improve them — it would take away the
scroll interactivity that makes them work.

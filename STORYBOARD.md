# WAVEHOUSE — Scene-by-scene storyboard

Brand: **WAVEHOUSE** · "Taste the wave."
One continuous liquid film. Every cut is made *of liquid* — never a fade.

## The rhythm (contrast is the point)

| # | Scene | Energy | Liquid motif |
|---|-------|--------|--------------|
| 01 | Mango Ocean — calm open | ▁ quiet | breathing surface |
| 02 | The First Wave — L+R approach | ▃ build | two swells converging |
| 03 | Collision + splash | █ impact | crown burst around bottle |
| 04 | Splash Freeze | ▁ held | suspended droplets, mango cubes |
| 05 | Liquid Orbit | ▃ move | creamy ribbon spirals the bottle |
| 06 | Bottle Drop | ▆ surprise | surface bends, then gives |
| 07 | The Dive | █ transition | refraction through the surface |
| 08 | Under-Liquid World | ▁ dream | golden creamy depth, floating fruit |
| 09 | Mango → Strawberry | ▆ transform | pink bleeds through the world |
| 10 | Flavor Worlds / selector | ▃ | full environment swap |
| 11 | Flavor Collision | █ | yellow × pink marbling |
| 12 | The Perfect Pour | ▃ tactile | scroll-driven fill |
| 13 | Liquid Typography | ▃ | shake flows inside THICK |
| 14 | Fruit Gravity | ▆ | fruit falls through depth planes |
| 15 | Bottle Lineup | ▃ product | light sweep across silhouettes |
| 16 | Surfing the Liquid | ▃ horizontal | bottles riding one long wave |
| 17 | Build Your Shake | ▃ play | the cup fills as you choose |
| 18 | Shake Mixer | ▆ | vortex, then resolve |
| 19 | Viscosity Test | ▁ macro | the ribbon folds on itself |
| 20 | Cold | ▁ dark | condensation, ice |
| 21 | Menu | ▁ function | editorial, liquid hover |
| 22 | Social | ▃ | huge type over slow splash |
| 23 | Locations | ▁ | markers over a calm surface |
| 24 | The Big Wave | █ climax | wave curls, covers camera |
| 25 | Final CTA | ▁ | liquid drains, clean close |

Loud never follows loud. 04 exists so 03 lands; 08 exists so 09 lands; 20 exists so 24 lands.

## Hero beats (scenes 01–07, one pinned timeline, ~560vh)

```
0.00  bottle centred, ocean calm, type behind        SCROLL TO MAKE WAVES
0.12  swell begins left; smaller swell right          — anticipation, visible
0.30  swells reach the bottle shoulders
0.36  COLLISION — crown splash, wraps the bottle
0.44  time crushes; droplets separate and hang        CAUGHT IN THE CRAVING
0.56  freeze releases; ribbon begins to orbit         01 — REAL FRUIT
0.68  bottle rotates 12°, camera arcs slightly
0.76  liquid calms; bottle rises, pause
0.82  bottle drops — surface bends, then splash       GO DEEPER
0.90  camera descends toward surface
0.95  surface crossing — refraction, bubbles
1.00  under the shake
```

## Depth planes (why the bottle is *in* the liquid, not pasted on it)

```
1  atmosphere gradient + light
2  huge typography  (MANGO)
3  REAR liquid canvas — back of ocean, rear wave, back half of splash
4  fruit behind bottle
5  BOTTLE  (lit, condensation)
6  FRONT liquid canvas — front of splash, foam licking the glass
7  foreground droplets (blurred)
8  UI / labels
```
Planes 3 and 6 are two canvases driven by **one shared simulation clock and one shared
wave state**, so the wave is continuous through the bottle. Plane 6 renders only the
liquid whose simulated depth is nearer than the bottle — that is the whole trick.

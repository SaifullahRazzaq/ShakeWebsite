/**
 * The physical identity of this brand, as numbers.
 *
 * Shake is not water. Every value here is a deliberate departure from water, and every
 * liquid shader on the site is fed from this file so the whole world stays one material.
 * Changing WATER-relative ratios here changes the feel of the entire site at once.
 */
export const VISC = {
  /** Wave travel speed as a fraction of water. Water reads ~1.0; shake crawls. */
  waveSpeed: 0.22,
  /** Seconds for a disturbed surface to return to rest. Water ≈ 0.4s. */
  settle: 2.6,
  /** Pointer ripple lag in ms — thick liquid answers late. */
  pointerLag: 340,
  /** Droplet radius multiplier vs water spray. Fewer, fatter drops. */
  dropletScale: 3.5,
  /** Specular exponent. Water is a mirror (~220); cream scatters (~18). */
  specPower: 18.0,
  /** Subsurface strength — the creamy glow through a lit crest. Water has none. */
  sss: 0.55,
  /** Pour stream width multiplier vs water. */
  pourWidth: 2.4,
  /** How far a ligament stretches before it breaks, in blob radii. */
  stretchBreak: 2.8,
} as const;

/** Per-flavour override: chocolate is heavier than mango and must move slower. */
export const thicknessToSpeed = (thickness: number) => VISC.waveSpeed * (1.35 - thickness * 0.55);

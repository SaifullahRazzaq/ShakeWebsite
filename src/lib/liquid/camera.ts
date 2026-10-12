/**
 * The hero camera, solved rather than guessed.
 *
 * The bottle is a DOM layer, the ocean is raymarched. For the bottle to sit *inside* the
 * liquid rather than on top of it, the depth we split the two canvases at must be the true
 * camera distance of the point the bottle's base is drawn over. That number is derived
 * here, so moving the camera moves the split with it and the composition never drifts.
 *
 * Camera basis (must mirror `MARCH` in glsl.ts exactly):
 *   fwd = (0, -sin P, -cos P)     up = (0, cos P, -sin P)     rgt = (1, 0, 0)
 */
export const CAM = {
  /** Eye height above the liquid, in world units. Low enough to be a product shot at
   *  liquid level, high enough that a wave crest does not occlude the entire frame —
   *  anything taller than this hides the horizon, which is what makes a big splash read
   *  as a flood instead of a splash. */
  height: 1.6,
  /** Slightly UP, which is what pushes the horizon down to ~42% and leaves the top
   *  58% of the frame for atmosphere and typography. */
  pitch: -0.0989,
  fov: 0.62,
} as const;

/** Screen height fraction (0 = bottom, 1 = top) where the flat horizon lands. */
export const horizonY = (pitch = CAM.pitch, fov = CAM.fov) =>
  (Math.tan(pitch) / fov) * 0.5 + 0.5;

/**
 * Camera distance of the still-water point drawn at screen height `uvY` (0 bottom, 1 top).
 * Returns Infinity at or above the horizon.
 */
export const distanceForScreenY = (uvY: number, height = CAM.height, pitch = CAM.pitch, fov = CAM.fov) => {
  const s = Math.sin(pitch), c = Math.cos(pitch);
  const k = (uvY * 2 - 1) * fov;
  // dot(v,up) / depth = k, with v = (0, -height, z) on the still plane, solved for z:
  //   -h·c - z·s = k·(h·s - z·c)   =>   z = (k·h·s + h·c) / (k·c - s)
  const denom = k * c - s;
  if (Math.abs(denom) < 1e-6) return Infinity;
  const z = (k * height * s + height * c) / denom;
  if (z >= 0) return Infinity;          // the ray points above the surface
  return height * s - z * c;            // camera-space depth
};

/** Where the bottle's base is drawn, as a fraction of viewport height from the bottom. */
export const BOTTLE_BASE_Y = 0.20;

/** The depth the two ocean canvases are split at. */
export const bottleDistance = () => distanceForScreenY(BOTTLE_BASE_Y);

/**
 * World (x, z) the bottle stands on. Every event in the film — the crown, the swells,
 * the droplet launch ring, the pointer ripple — is centred here. Centring them on the
 * world origin instead puts them at the camera, which floods the near field flat.
 */
export const focusPoint = (uvY = BOTTLE_BASE_Y): [number, number] => {
  const s = Math.sin(CAM.pitch), c = Math.cos(CAM.pitch);
  const k = (uvY * 2 - 1) * CAM.fov;
  const z = (k * CAM.height * s + CAM.height * c) / (k * c - s);
  return [0, z];
};

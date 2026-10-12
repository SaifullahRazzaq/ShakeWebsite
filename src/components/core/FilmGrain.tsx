"use client";
import { useEffect, useRef } from "react";

/**
 * A whisper of grain. Without it the shader gradients band on cheap panels.
 *
 * Generated ONCE into a small tile and repeated, rather than an SVG `feTurbulence` over
 * the whole viewport. A full-screen filter sitting under `mix-blend-mode: overlay` forces
 * the compositor to re-blend the entire page against a filtered layer on every frame that
 * anything beneath it moves — and on this site something beneath it is always moving. The
 * tile is a static bitmap, so the blend is a plain composite the GPU does for nothing.
 */
export default function FilmGrain() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const S = 128;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      // Monochrome, centred on mid-grey so `overlay` neither lifts nor crushes the frame.
      const v = 110 + Math.random() * 36;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    if (el.current) el.current.style.backgroundImage = `url(${c.toDataURL("image/png")})`;
  }, []);

  return (
    <div
      ref={el}
      aria-hidden
      style={{
        position: "fixed", inset: 0,
        pointerEvents: "none", zIndex: 9998, opacity: 0.16,
        mixBlendMode: "overlay",
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
      }}
    />
  );
}

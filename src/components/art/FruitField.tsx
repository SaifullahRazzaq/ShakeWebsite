"use client";
import { useEffect, useRef } from "react";
import { MangoCube, MangoSlice } from "./Fruit";
import { gsap } from "@/lib/gsap";

type Item = { x: number; y: number; size: number; rot: number; kind: "cube" | "slice"; depth: number };

/** Composed, not scattered. Twelve pieces placed by eye beat two hundred random ones. */
const BACK: Item[] = [
  { x: 12, y: 30, size: 74, rot: -18, kind: "cube", depth: 0.35 },
  { x: 83, y: 24, size: 62, rot: 24, kind: "cube", depth: 0.30 },
  { x: 26, y: 46, size: 96, rot: 12, kind: "cube", depth: 0.55 },
  { x: 71, y: 42, size: 128, rot: -8, kind: "slice", depth: 0.50 },
  { x: 91, y: 52, size: 58, rot: 40, kind: "cube", depth: 0.40 },
  { x: 6, y: 55, size: 66, rot: 8, kind: "cube", depth: 0.45 },
];
const FRONT: Item[] = [
  { x: 11, y: 76, size: 104, rot: 28, kind: "cube", depth: 0.9 },
  { x: 92, y: 82, size: 118, rot: -16, kind: "cube", depth: 1.05 },
];

/**
 * Planes 4 and 7 — fruit behind the bottle and fruit near the camera.
 * The front plane is blurred and moves more: that parallax difference, not the blur,
 * is what actually reads as depth.
 */
export default function FruitField({ plane, style }: { plane: "back" | "front"; style?: React.CSSProperties }) {
  const root = useRef<HTMLDivElement>(null);
  const items = plane === "back" ? BACK : FRONT;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      root.current!.querySelectorAll<HTMLElement>("[data-f]").forEach((el, i) => {
        const d = Number(el.dataset.depth);
        // each piece breathes on its own slightly-off cycle so the field never pulses as one
        gsap.to(el, {
          yPercent: -6 - d * 5,
          xPercent: (i % 2 ? 1 : -1) * (2 + d * 2),
          rotate: `+=${(i % 2 ? 1 : -1) * (4 + d * 5)}`,
          duration: 7 + i * 1.3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} aria-hidden className="fill" style={{ pointerEvents: "none", ...style }}>
      {items.map((it, i) => (
        <div
          key={i}
          data-f
          data-depth={it.depth}
          style={{
            position: "absolute",
            left: `${it.x}%`,
            top: `${it.y}%`,
            transform: "translate(-50%,-50%)",
            filter: plane === "front"
              ? `blur(${1.2 + it.depth * 1.6}px) drop-shadow(0 14px 22px rgba(120,50,0,0.30))`
              : "drop-shadow(0 10px 18px rgba(120,50,0,0.22))",
            opacity: plane === "front" ? 0.92 : 0.85,
            willChange: "transform",
          }}
        >
          {it.kind === "cube"
            ? <MangoCube size={it.size} rot={it.rot} />
            : <MangoSlice size={it.size} rot={it.rot} />}
        </div>
      ))}
    </div>
  );
}

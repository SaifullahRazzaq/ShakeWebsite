"use client";
import { useEffect, useRef } from "react";
import LiquidCanvas, { type LiquidHandle } from "@/components/liquid/LiquidCanvas";
import { fieldFrag, MODE } from "@/lib/liquid/fieldShader";
import { MangoCube, Strawberry, Banana, Pistachio, MangoSlice } from "@/components/art/Fruit";
import { gsap } from "@/lib/gsap";
import { flavorById } from "@/shake.config";

const F = flavorById("mango");

/**
 * Scene 14. Fruit falls, at different depths, and each piece makes its own dent.
 *
 * Eight pieces, placed. Not a particle system — a particle system here would read as
 * confetti, and the point is that each impact is a separate small event.
 */
type Drop = { at: number; x: number; depth: number; size: number; rot: number; Art: React.ComponentType<{ size?: number; rot?: number }> };

const DROPS: Drop[] = [
  { at: 0.06, x: 22, depth: 0.35, size: 78, rot: -22, Art: MangoCube },
  { at: 0.14, x: 68, depth: 0.9, size: 132, rot: 16, Art: Strawberry },
  { at: 0.22, x: 44, depth: 0.15, size: 62, rot: 30, Art: Pistachio },
  { at: 0.30, x: 84, depth: 0.55, size: 104, rot: -14, Art: MangoCube },
  { at: 0.38, x: 13, depth: 1.15, size: 168, rot: 24, Art: Banana },
  { at: 0.47, x: 58, depth: 0.30, size: 88, rot: -30, Art: MangoSlice },
  { at: 0.55, x: 33, depth: 0.75, size: 118, rot: 10, Art: Strawberry },
  { at: 0.63, x: 76, depth: 0.20, size: 70, rot: 40, Art: MangoCube },
];

export default function FruitGravity() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<LiquidHandle>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const h = canvas.current;
      h?.set("uMode", MODE.POUR);
      h?.set("uThick", F.thickness);
      h?.set("uFill", 0.30);          // a shallow pool the fruit lands in

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1.1 },
      });

      DROPS.forEach((d, i) => {
        const el = root.current!.querySelector(`[data-drop='${i}']`) as HTMLElement;
        const splash = root.current!.querySelector(`[data-splash='${i}']`) as HTMLElement;
        if (!el) return;
        gsap.set(el, { yPercent: -180, opacity: 0 });
        // nearer pieces fall further and faster across the frame
        tl.to(el, { opacity: 1, duration: 0.02 }, d.at)
          .to(el, { yPercent: 40 + d.depth * 30, rotate: d.rot * 2.2, duration: 0.17, ease: "power2.in" }, d.at)
          .to(el, { yPercent: 90 + d.depth * 40, opacity: 0, duration: 0.06, ease: "power1.in" }, d.at + 0.17);
        // the dent it leaves
        if (splash) {
          gsap.set(splash, { scaleX: 0.2, scaleY: 0.2, opacity: 0 });
          tl.to(splash, { scaleX: 1, scaleY: 1, opacity: 0.75, duration: 0.03, ease: "power3.out" }, d.at + 0.165)
            .to(splash, { scaleX: 1.7, scaleY: 0.6, opacity: 0, duration: 0.10, ease: "power2.out" }, d.at + 0.195);
        }
      });

      tl.fromTo("[data-fg='h']", { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.08 }, 0.10);
      tl.to("[data-fg='h']", { opacity: 0, duration: 0.06 }, 0.86);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="scene" style={{ height: "420vh" }}>
      <div style={{
        position: "sticky", top: 0, height: "100vh", overflow: "hidden",
        background: `linear-gradient(180deg, color-mix(in srgb, var(--sky) 40%, var(--paper)) 0%, color-mix(in srgb, var(--flavor) 30%, var(--paper)) 100%)`,
      }}>
        {/* the pool at the bottom */}
        <div className="fill" style={{ zIndex: 1 }}>
          <LiquidCanvas ref={canvas} frag={fieldFrag} palette={F.palette} className="fill" />
        </div>

        {DROPS.map((d, i) => (
          <div key={i} data-drop={i} style={{
            position: "absolute", left: `${d.x}%`, top: "34%", zIndex: d.depth > 0.6 ? 4 : 2,
            transform: "translate(-50%,-50%)", willChange: "transform",
            filter: d.depth > 0.8 ? `blur(${(d.depth - 0.8) * 9}px)` : "none",
            opacity: 0,
          }}>
            <d.Art size={d.size} rot={d.rot} />
          </div>
        ))}

        {/* impact dents, sitting on the pool line */}
        {DROPS.map((d, i) => (
          <div key={`s${i}`} data-splash={i} aria-hidden style={{
            position: "absolute", left: `${d.x}%`, bottom: "27%", zIndex: 3,
            width: d.size * 1.2, height: d.size * 0.42, transform: "translateX(-50%)",
            borderRadius: "50%", opacity: 0,
            background: `radial-gradient(closest-side, transparent 30%, var(--foam) 62%, transparent 100%)`,
          }} />
        ))}

        <div className="fill shell" style={{ zIndex: 5, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <div data-fg="h" style={{ textAlign: "center", opacity: 0 }}>
            <h2 className="display" style={{ color: "color-mix(in srgb, var(--deep) 92%, #000)" }}>
              <span style={{ display: "block" }}>REAL</span>
              <span style={{ display: "block" }}>GOES IN.</span>
            </h2>
            <p className="lede" style={{ margin: "1.2rem auto 0" }}>That&apos;s why good comes out.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

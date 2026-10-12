"use client";
import { useEffect, useRef } from "react";
import LiquidCanvas, { type LiquidHandle } from "@/components/liquid/LiquidCanvas";
import { fieldFrag, MODE } from "@/lib/liquid/fieldShader";
import { gsap } from "@/lib/gsap";
import { flavorById } from "@/shake.config";

const A = flavorById("mango");
const B = flavorById("strawberry");

/**
 * Scene 11. Two liquids driven together until the boundary gives.
 *
 * The shear that folds them is the same domain warp the ocean uses, so this reads as the
 * same material meeting itself — not two flat colours wiping across each other.
 */
export default function FlavorCollision() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<LiquidHandle>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const h = canvas.current;
      h?.set("uMode", MODE.MARBLE);
      h?.set("uThick", 0.6);
      h?.set("uMix", 0);
      h?.set("uDeepB", ...B.palette.deep);
      h?.set("uSurfaceB", ...B.palette.surface);
      h?.set("uFoamB", ...B.palette.foam);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1.2 },
      });

      const s = { mix: 0 };
      tl.to(s, {
        mix: 1, duration: 0.62, ease: "power2.inOut",
        onUpdate: () => canvas.current?.set("uMix", s.mix),
      }, 0.16);

      tl.fromTo("[data-c='q']", { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.10 }, 0.06)
        .to("[data-c='q']", { opacity: 0, duration: 0.06 }, 0.56);
      tl.fromTo("[data-c='r']", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.09 }, 0.70);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="scene" style={{ height: "260vh" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "grid", placeItems: "center" }}>
        <LiquidCanvas ref={canvas} frag={fieldFrag} palette={A.palette} className="fill" style={{ zIndex: 0 }} />

        <div className="fill" style={{ zIndex: 2, display: "grid", placeItems: "center", textAlign: "center", pointerEvents: "none" }}>
          <h2 data-c="q" className="display" style={{ color: "var(--foam)", opacity: 0, gridArea: "1/1" }}>
            <span style={{ display: "block" }}>WHY</span>
            <span style={{ display: "block" }}>CHOOSE</span>
            <span style={{ display: "block" }}>ONE?</span>
          </h2>
          <div data-c="r" style={{ opacity: 0, gridArea: "1/1" }}>
            <p className="eyebrow" style={{ color: "color-mix(in srgb, var(--foam) 80%, transparent)" }}>Limited mix</p>
            <h2 className="display-md" style={{ color: "var(--foam)", marginTop: "1rem" }}>
              MANGO <span style={{ opacity: 0.55 }}>×</span> STRAWBERRY
            </h2>
            <p className="lede" style={{ color: "color-mix(in srgb, var(--foam) 78%, transparent)", margin: "1.2rem auto 0" }}>
              Poured together, never blended. You get both, in bands, all the way down.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

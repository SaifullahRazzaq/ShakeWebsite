"use client";
import { useEffect, useRef } from "react";
import LiquidCanvas, { type LiquidHandle } from "@/components/liquid/LiquidCanvas";
import { fieldFrag, MODE } from "@/lib/liquid/fieldShader";
import { gsap } from "@/lib/gsap";
import { flavorById } from "@/shake.config";

const F = flavorById("mango");

/**
 * Scene 19. The quiet, tactile one.
 *
 * A ribbon of shake falls and coils on itself — the liquid-rope effect only a genuinely
 * viscous fluid does. Water cannot make this shape, which is exactly why this section
 * exists: it is the proof, not a claim.
 */
export default function Viscosity() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<LiquidHandle>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const h = canvas.current;
      h?.set("uMode", MODE.RIBBON);
      h?.set("uThick", 0.9);
      h?.set("uFill", 1);
      gsap.fromTo("[data-v]", { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: "top 68%" } });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="scene" style={{
      background: "color-mix(in srgb, var(--foam) 45%, var(--paper))",
      paddingBlock: "clamp(5rem,12vh,9rem)", overflow: "hidden",
    }}>
      <div className="shell visc-grid" style={{
        display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,0.7fr)",
        gap: "clamp(2rem,5vw,5rem)", alignItems: "center",
      }}>
        <div>
          <p data-v className="eyebrow">08 — Viscosity</p>
          <h2 data-v className="display-md" style={{ marginTop: "1rem" }}>
            <span style={{ display: "block" }}>THICKNESS</span>
            <span style={{ display: "block" }}>YOU CAN SEE.</span>
          </h2>
          <p data-v className="lede" style={{ marginTop: "1.4rem" }}>
            Pour it from a height and it coils instead of splashing. That rope only forms
            when there is enough fruit and cream in it to hold its own weight.
          </p>
          <p data-v className="micro" style={{ marginTop: "1.8rem" }}>Slow pour. Big flavour.</p>
        </div>

        <div style={{
          position: "relative", height: "min(72vh, 36rem)", borderRadius: 4, overflow: "hidden",
          background: "linear-gradient(180deg, color-mix(in srgb,var(--foam) 70%,#fff) 0%, color-mix(in srgb,var(--sky) 55%,#fff) 100%)",
        }}>
          <LiquidCanvas ref={canvas} frag={fieldFrag} palette={F.palette} className="fill" />
        </div>
      </div>
      <style>{`@media (max-width: 880px){ .visc-grid { grid-template-columns: minmax(0,1fr) !important; } }`}</style>
    </section>
  );
}

"use client";
import { useEffect, useRef } from "react";
import LiquidCanvas, { type LiquidHandle } from "@/components/liquid/LiquidCanvas";
import { fieldFrag, MODE } from "@/lib/liquid/fieldShader";
import ProductBottle from "@/components/art/ProductBottle";
import { gsap } from "@/lib/gsap";
import { flavorById } from "@/shake.config";

const F = flavorById("mango");

/**
 * Scene 12. Scroll is the pour.
 *
 * The level in the glass is bound to scroll progress exactly — 25/50/75/100 land where
 * the ticks say they do. The stream is wide and never sheets, because VISC.pourWidth
 * says a shake stream is 2.4× a water one.
 */
export default function PerfectPour() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<LiquidHandle>(null);
  const bottle = useRef<HTMLDivElement>(null);
  const ticks = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const h = canvas.current;
      h?.set("uMode", MODE.POUR);
      h?.set("uThick", F.thickness);
      h?.set("uFill", 0);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.9 },
      });

      // bottle tips in, holds through the pour, rights itself at the end
      tl.fromTo(bottle.current, { rotate: -4, y: 30 }, { rotate: -58, y: 0, duration: 0.16, ease: "power2.inOut" }, 0.04);
      tl.to(bottle.current, { rotate: -34, duration: 0.10, ease: "power2.inOut" }, 0.84);

      const s = { fill: 0 };
      tl.to(s, {
        fill: 1, duration: 0.66, ease: "none",
        onUpdate: () => {
          canvas.current?.set("uFill", s.fill);
          const el = ticks.current;
          if (!el) return;
          el.querySelectorAll<HTMLElement>("[data-t]").forEach((t) => {
            const at = Number(t.dataset.t);
            t.style.opacity = s.fill >= at ? "1" : "0.26";
          });
        },
      }, 0.18);

      tl.fromTo("[data-p='h']", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.08 }, 0.80);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="scene" style={{ height: "300vh", background: "var(--paper)" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "grid", placeItems: "center" }}>
        <div className="shell" style={{
          display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)",
          alignItems: "center", width: "100%", gap: "2rem",
        }}>
          <div>
            <p className="eyebrow">03 — The pour</p>
            <h2 className="display-md" data-p="h" style={{ marginTop: "1rem", opacity: 0 }}>
              <span style={{ display: "block" }}>THICK</span>
              <span style={{ display: "block" }}>BY DESIGN.</span>
            </h2>
            <p className="lede" style={{ marginTop: "1.2rem" }}>No watery shortcuts.</p>
          </div>

          {/* the glass */}
          <div style={{ position: "relative", width: "min(38vw, 21rem)", height: "min(64vh, 34rem)" }}>
            <div ref={bottle} style={{
              position: "absolute", left: "-28%", top: "-30%", height: "52%",
              transformOrigin: "80% 80%", zIndex: 3,
            }}>
              <ProductBottle flavor={F} level={0.5} condensation={false} style={{ height: "100%", width: "auto" }} />
            </div>

            {/* glass walls, and the liquid clipped inside them */}
            <div style={{
              position: "absolute", inset: "18% 14% 0 14%", overflow: "hidden",
              borderRadius: "6px 6px 46% 46% / 6px 6px 14% 14%",
              border: "1px solid color-mix(in srgb, var(--deep) 22%, transparent)",
              borderTop: "none",
              background: "linear-gradient(100deg, color-mix(in srgb,#fff 55%,transparent), transparent 30%, color-mix(in srgb,#fff 30%,transparent))",
              boxShadow: "inset -10px 0 24px -12px rgba(0,0,0,0.18), inset 10px 0 20px -14px rgba(255,255,255,0.9)",
            }}>
              <LiquidCanvas ref={canvas} frag={fieldFrag} palette={F.palette} className="fill" />
            </div>

            <div ref={ticks} style={{ position: "absolute", right: "-3.2rem", inset: "18% auto 0 auto", height: "82%" }}>
              {[1, 0.75, 0.5, 0.25].map((v) => (
                <div key={v} data-t={v} className="micro tnum" style={{
                  position: "absolute", top: `${(1 - v) * 100}%`, transform: "translateY(-50%)",
                  opacity: 0.26, transition: "opacity 0.3s", whiteSpace: "nowrap",
                }}>
                  — {v * 100}%
                </div>
              ))}
            </div>
          </div>

          <div style={{ justifySelf: "end", textAlign: "right" }}>
            <p className="micro">Slow pour.</p>
            <p className="micro">Big flavour.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

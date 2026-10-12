"use client";
import { useEffect, useRef, useState } from "react";
import ProductBottle from "@/components/art/ProductBottle";
import { gsap } from "@/lib/gsap";
import { heroFlavors, money } from "@/shake.config";

/**
 * Scene 15. Not a product grid.
 *
 * Five silhouettes in the dark. A light sweeps across them as you scroll and each one
 * resolves out of its own shadow; the liquid pooled beneath takes the colour of whichever
 * is forward.
 */
export default function BottleLineup() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const f = heroFlavors[active];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const bottles = gsap.utils.toArray<HTMLElement>("[data-lb]");
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top 80%", end: "top 10%", scrub: 1 },
      });
      // the light travels left to right; each bottle lifts out of silhouette as it passes
      bottles.forEach((b, i) => {
        tl.fromTo(b,
          { filter: "brightness(0.10) saturate(0.2)", y: 40, opacity: 0.5 },
          { filter: "brightness(1) saturate(1)", y: 0, opacity: 1, duration: 0.22 },
          i * 0.14);
      });
      tl.fromTo("[data-lb-sweep]", { xPercent: -120, opacity: 0 },
        { xPercent: 120, opacity: 1, duration: 1, ease: "power1.inOut" }, 0);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="scene" style={{
      background: "#140b04", color: "var(--foam)", paddingBlock: "clamp(5rem,12vh,9rem)", overflow: "hidden",
    }}>
      <div className="shell">
        <p className="eyebrow" style={{ color: "color-mix(in srgb, var(--foam) 55%, transparent)" }}>05 — The lineup</p>

        <div style={{ position: "relative", marginTop: "3rem" }}>
          {/* the pooled liquid beneath, taking the active flavour */}
          <div aria-hidden style={{
            position: "absolute", left: "50%", bottom: "-2.5rem", transform: "translateX(-50%)",
            width: "min(92vw, 70rem)", height: "9rem", borderRadius: "50%",
            background: `radial-gradient(closest-side, ${f.color} 0%, ${f.secondaryColor} 45%, transparent 78%)`,
            filter: "blur(26px)", opacity: 0.55, transition: "background 1.1s ease",
          }} />
          {/* the sweeping light */}
          <div data-lb-sweep aria-hidden style={{
            position: "absolute", inset: "-10% -40%", zIndex: 1, pointerEvents: "none",
            background: "linear-gradient(100deg, transparent 44%, rgba(255,255,255,0.16) 50%, transparent 56%)",
          }} />

          <ul style={{
            listStyle: "none", margin: 0, padding: 0, display: "flex",
            alignItems: "flex-end", justifyContent: "center", gap: "clamp(0.4rem,2vw,2rem)",
            position: "relative", zIndex: 2, flexWrap: "wrap",
          }}>
            {heroFlavors.map((fl, i) => (
              <li key={fl.id}>
                <button
                  data-lb
                  data-cursor="VIEW"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-label={fl.name}
                  style={{
                    background: "none", border: "none", padding: 0, cursor: "pointer",
                    height: i === active ? "min(48vh, 26rem)" : "min(40vh, 21rem)",
                    transform: i === active ? "translateY(-10px)" : "none",
                    transition: "height 0.7s cubic-bezier(.2,.7,.2,1), transform 0.7s, opacity 0.5s",
                    opacity: i === active ? 1 : 0.62,
                    willChange: "transform",
                  }}
                >
                  <ProductBottle flavor={fl} level={0.8} style={{ height: "100%", width: "auto" }} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* detail for whichever is forward */}
        <div style={{
          marginTop: "3.5rem", display: "grid", gap: "1.4rem",
          gridTemplateColumns: "minmax(0,1fr) auto", alignItems: "end",
          borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: "1.6rem",
        }}>
          <div>
            <h3 className="display-sm" style={{ color: "var(--foam)" }}>{f.name}</h3>
            <p style={{
              display: "flex", gap: "1.2rem", flexWrap: "wrap", margin: "0.9rem 0 0",
              color: "rgba(255,255,255,0.6)", fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase",
            }}>
              {f.ingredients.slice(0, 3).map((x) => <span key={x}>{x}</span>)}
              <span>250 ml</span>
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.4rem" }}>
            <span className="display-sm tnum" style={{ color: "var(--foam)" }}>{money(f.price)}</span>
            <a href="#order" data-cursor="ORDER" style={{
              background: f.color, color: "#1a0f05", padding: "0.8rem 1.6rem", borderRadius: 999,
              fontSize: "0.68rem", letterSpacing: "0.2em", fontWeight: 700, textDecoration: "none",
              transition: "background 0.8s",
            }}>ORDER</a>
          </div>
        </div>
      </div>
    </section>
  );
}

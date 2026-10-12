"use client";
import { useEffect, useRef } from "react";
import ProductBottle from "@/components/art/ProductBottle";
import { IceCube } from "@/components/art/Fruit";
import { gsap } from "@/lib/gsap";
import { flavorById } from "@/shake.config";

const F = flavorById("mango");

/**
 * Scene 20. The language changes for one section: dark, close, cold.
 *
 * This is the rest before the finale. Beads run down the glass on their own schedule;
 * the highlight on the bottle tracks the cursor, which is the only interaction here.
 */
export default function ColdScene() {
  const root = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-cs]", { opacity: 0, y: 34 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.1,
          scrollTrigger: { trigger: root.current, start: "top 65%" } });

      // beads run, pause, run again — never in unison
      gsap.utils.toArray<HTMLElement>("[data-bead]").forEach((b, i) => {
        gsap.fromTo(b, { y: 0, opacity: 0 }, {
          y: 90 + i * 26, opacity: 1, duration: 5 + (i % 4) * 2.4, ease: "none",
          repeat: -1, delay: i * 0.9,
          onRepeat: () => { gsap.set(b, { opacity: 0 }); },
        });
      });

      if (window.matchMedia("(hover: hover)").matches) {
        const x = gsap.quickTo(glow.current, "xPercent", { duration: 1.1, ease: "power3" });
        const y = gsap.quickTo(glow.current, "yPercent", { duration: 1.1, ease: "power3" });
        const move = (e: PointerEvent) => {
          const r = root.current!.getBoundingClientRect();
          x(((e.clientX - r.left) / r.width - 0.5) * 60);
          y(((e.clientY - r.top) / r.height - 0.5) * 40);
        };
        root.current!.addEventListener("pointermove", move);
      }
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="scene" style={{
      background: "radial-gradient(120% 90% at 30% 20%, #2a1a0c 0%, #100a05 60%, #080503 100%)",
      color: "var(--foam)", paddingBlock: "clamp(5rem,14vh,10rem)", overflow: "hidden", position: "relative",
    }}>
      <div ref={glow} aria-hidden style={{
        position: "absolute", left: "50%", top: "50%", width: "70vmax", height: "70vmax",
        transform: "translate(-50%,-50%)", pointerEvents: "none",
        background: `radial-gradient(closest-side, color-mix(in srgb, ${F.color} 34%, transparent) 0%, transparent 70%)`,
        filter: "blur(20px)", opacity: 0.5,
      }} />

      <div className="shell cold-grid" style={{
        position: "relative", display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1fr)",
        gap: "clamp(2rem,5vw,5rem)", alignItems: "center",
      }}>
        <div style={{ position: "relative", height: "min(74vh, 38rem)", justifySelf: "center" }}>
          <ProductBottle flavor={F} level={0.84} style={{ height: "100%", width: "auto" }} />
          {/* the beads that have started to run */}
          {[12, 28, 44, 62, 78, 88].map((left, i) => (
            <div key={left} data-bead aria-hidden style={{
              position: "absolute", left: `${left}%`, top: `${18 + (i % 3) * 12}%`,
              width: 3, height: 3 + (i % 3) * 2, borderRadius: 999,
              background: "rgba(255,255,255,0.75)", boxShadow: "0 0 6px rgba(255,255,255,0.5)",
            }} />
          ))}
          {/* ice at the foot */}
          <div aria-hidden style={{ position: "absolute", bottom: "-3%", left: "-14%", opacity: 0.8 }}>
            <IceCube size={78} rot={-12} />
          </div>
          <div aria-hidden style={{ position: "absolute", bottom: "-6%", right: "-10%", opacity: 0.65 }}>
            <IceCube size={58} rot={22} />
          </div>
        </div>

        <div>
          <p data-cs className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>09 — Temperature</p>
          <h2 data-cs className="display" style={{ color: "var(--foam)", marginTop: "1rem", fontSize: "clamp(2.8rem,9vw,7.5rem)" }}>
            <span style={{ display: "block" }}>COLD</span>
            <span style={{ display: "block" }}>HITS</span>
            <span style={{ display: "block" }}>DIFFERENT.</span>
          </h2>
          <p data-cs className="lede" style={{ color: "rgba(255,255,255,0.66)", marginTop: "1.4rem" }}>
            Bottles sit at 2°C until the second they leave. The condensation on the glass is
            the only receipt you need.
          </p>
        </div>
      </div>
      <style>{`@media (max-width: 880px){ .cold-grid { grid-template-columns: minmax(0,1fr) !important; } }`}</style>
    </section>
  );
}

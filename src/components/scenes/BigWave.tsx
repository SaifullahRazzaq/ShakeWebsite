"use client";
import { useEffect, useRef } from "react";
import LiquidCanvas, { type LiquidHandle } from "@/components/liquid/LiquidCanvas";
import { fieldFrag, MODE } from "@/lib/liquid/fieldShader";
import ProductBottle from "@/components/art/ProductBottle";
import { MangoCube, Strawberry, MangoSlice } from "@/components/art/Fruit";
import LiquidButton from "@/components/core/LiquidButton";
import { gsap } from "@/lib/gsap";
import { flavorById, site } from "@/shake.config";

const F = flavorById("mango");

/**
 * Scenes 24–25. The ending.
 *
 * Quiet bottle → a wave builds behind it → it holds at its peak with fruit suspended →
 * it comes forward over the camera → the screen is entirely mango for a beat → the liquid
 * drains downward and leaves the last clean frame.
 */
export default function BigWave() {
  const root = useRef<HTMLDivElement>(null);
  const wave = useRef<LiquidHandle>(null);
  const bottle = useRef<HTMLDivElement>(null);
  const flood = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const h = wave.current;
      h?.set("uMode", MODE.WALL);
      h?.set("uThick", F.thickness);
      h?.set("uFill", 0);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        h?.set("uFill", 0.62);
        gsap.set(outro.current, { opacity: 1, y: 0 });
        gsap.set(flood.current, { opacity: 0 });
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1.2 },
      });

      // the opening quiet
      tl.fromTo("[data-bw='one']", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.05 }, 0.02)
        .to("[data-bw='one']", { opacity: 0, duration: 0.05 }, 0.30);

      // the wave builds — slowly, and it keeps building longer than feels comfortable
      const s = { fill: 0 };
      tl.to(s, {
        fill: 0.92, duration: 0.52, ease: "power2.in",
        onUpdate: () => wave.current?.set("uFill", s.fill),
      }, 0.12);

      tl.to(bottle.current, { scale: 1.06, y: "-3%", duration: 0.5 }, 0.14);

      // the held peak
      tl.fromTo("[data-bw='drink']", { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.05 }, 0.58);
      tl.fromTo("[data-bw-fruit]", { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 0.06, stagger: 0.01 }, 0.58);

      // it comes forward and takes the camera
      tl.to(s, { fill: 1.5, duration: 0.10, ease: "power2.in", onUpdate: () => wave.current?.set("uFill", s.fill) }, 0.70);
      tl.to(flood.current, { opacity: 1, duration: 0.05 }, 0.72);
      tl.to(["[data-bw='drink']", bottle.current, "[data-bw-fruit]"], { opacity: 0, duration: 0.04 }, 0.74);

      // and drains away, leaving the last frame
      tl.to(flood.current, { yPercent: 100, duration: 0.12, ease: "power2.inOut" }, 0.80);
      tl.fromTo(outro.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.08 }, 0.84);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="order" className="scene" style={{ height: "520vh" }}>
      <div ref={stage} style={{
        position: "sticky", top: 0, height: "100vh", overflow: "hidden",
        background: "radial-gradient(120% 90% at 50% 18%, #2b1a09 0%, #150c04 62%, #0a0603 100%)",
      }}>
        {/* the wave */}
        <LiquidCanvas ref={wave} frag={fieldFrag} palette={F.palette} className="fill" style={{ zIndex: 1 }} />

        {/* fruit suspended at the peak */}
        <div aria-hidden className="fill" style={{ zIndex: 3 }}>
          <div data-bw-fruit style={{ position: "absolute", left: "22%", top: "34%", opacity: 0 }}>
            <MangoCube size={94} rot={-18} />
          </div>
          <div data-bw-fruit style={{ position: "absolute", left: "74%", top: "28%", opacity: 0 }}>
            <Strawberry size={86} rot={16} />
          </div>
          <div data-bw-fruit style={{ position: "absolute", left: "63%", top: "56%", opacity: 0 }}>
            <MangoSlice size={128} rot={10} />
          </div>
          <div data-bw-fruit style={{ position: "absolute", left: "13%", top: "62%", opacity: 0 }}>
            <MangoCube size={68} rot={28} />
          </div>
        </div>

        {/* the bottle, alone */}
        <div ref={bottle} style={{
          position: "absolute", left: "50%", bottom: "12%", transform: "translateX(-50%)",
          height: "56vh", zIndex: 4, willChange: "transform",
        }}>
          <ProductBottle flavor={F} level={0.84} style={{ height: "100%", width: "auto" }} />
        </div>

        {/* type */}
        <div className="fill shell" style={{ zIndex: 2, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <h2 data-bw="one" className="display-md" style={{ gridArea: "1/1", color: "var(--foam)", textAlign: "center", opacity: 0 }}>
            <span style={{ display: "block" }}>ONE</span>
            <span style={{ display: "block" }}>LAST</span>
            <span style={{ display: "block" }}>WAVE.</span>
          </h2>
          <h2 data-bw="drink" className="display" style={{
            gridArea: "1/1", color: "var(--foam)", textAlign: "center", opacity: 0, mixBlendMode: "overlay",
          }}>
            <span style={{ display: "block" }}>DRINK</span>
            <span style={{ display: "block" }}>THE WAVE.</span>
          </h2>
        </div>

        {/* the moment the screen is nothing but shake */}
        <div ref={flood} aria-hidden style={{
          position: "absolute", inset: 0, zIndex: 5, opacity: 0, willChange: "transform",
          background: `linear-gradient(180deg, ${F.color} 0%, ${F.secondaryColor} 58%, color-mix(in srgb, ${F.secondaryColor} 70%, #000) 100%)`,
        }} />

        {/* the last frame */}
        <div ref={outro} className="fill shell" style={{
          zIndex: 6, display: "grid", placeItems: "center", textAlign: "center", opacity: 0,
        }}>
          <div>
            <p style={{
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(1.2rem,3vw,2rem)",
              letterSpacing: "0.04em", color: "var(--foam)", margin: 0,
            }}>{site.brandName}</p>
            <h2 className="display-md" style={{ color: "var(--foam)", marginTop: "1.6rem" }}>
              <span style={{ display: "block" }}>YOUR NEXT</span>
              <span style={{ display: "block" }}>OBSESSION</span>
              <span style={{ display: "block" }}>IS COLD.</span>
            </h2>
            <div style={{ display: "flex", gap: "0.7rem", justifyContent: "center", marginTop: "2.4rem", flexWrap: "wrap" }}>
              <LiquidButton>ORDER NOW</LiquidButton>
              <LiquidButton href="#flavors" tone="ghost">VIEW FLAVORS</LiquidButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

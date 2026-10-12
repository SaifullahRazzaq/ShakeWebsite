"use client";
import { useEffect, useRef, useState } from "react";
import LiquidCanvas, { type LiquidHandle } from "@/components/liquid/LiquidCanvas";
import { fieldFrag, MODE } from "@/lib/liquid/fieldShader";
import { gsap } from "@/lib/gsap";
import { locations, flavorById } from "@/shake.config";

const F = flavorById("mango");

/**
 * Scene 23. Markers floating over a calm surface. Interaction stays minimal on purpose —
 * this is the section someone uses when they have already decided.
 */
export default function Locations() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<LiquidHandle>(null);
  const [active, setActive] = useState(0);
  const loc = locations[active];

  useEffect(() => {
    const h = canvas.current;
    h?.set("uMode", MODE.UNDER);
    h?.set("uThick", 0.6);
    h?.set("uFill", 0);
    h?.set("uOrigin", 0.3 + active * 0.14, 0.5);
  }, [active]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-loc-detail]", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6 });
    }, root);
    return () => ctx.revert();
  }, [active]);

  return (
    <section ref={root} id="locations" className="scene" style={{
      position: "relative", overflow: "hidden", paddingBlock: "clamp(5rem,12vh,9rem)",
      background: "var(--paper)",
    }}>
      <div aria-hidden style={{ position: "absolute", inset: "auto 0 0 0", height: "58%", zIndex: 0, opacity: 0.85 }}>
        <LiquidCanvas ref={canvas} frag={fieldFrag} palette={F.palette} className="fill" />
      </div>

      <div className="shell" style={{ position: "relative", zIndex: 2 }}>
        <p className="eyebrow">11 — Where</p>
        <h2 className="display" style={{ marginTop: "1rem", fontSize: "clamp(2.6rem,10vw,8rem)" }}>
          <span style={{ display: "block" }}>FIND</span>
          <span style={{ display: "block" }}>YOUR WAVE.</span>
        </h2>

        <div className="loc-grid" style={{
          marginTop: "3rem", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
          gap: "clamp(1.5rem,4vw,4rem)", alignItems: "start",
        }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {locations.map((l, i) => (
              <li key={l.id}>
                <button onClick={() => setActive(i)} aria-current={i === active} data-cursor="VIEW" style={{
                  width: "100%", textAlign: "left", background: "none", cursor: "pointer",
                  border: "none", borderTop: "1px solid var(--rule)", padding: "1.1rem 0",
                  display: "flex", alignItems: "center", gap: "0.9rem",
                  opacity: i === active ? 1 : 0.5, transition: "opacity 0.4s",
                  color: "var(--fg)",
                }}>
                  {/* the marker, floating just above the surface */}
                  <span style={{
                    width: 10, height: 10, borderRadius: "50% 50% 50% 0",
                    transform: `rotate(-45deg) translateY(${i === active ? "-2px" : "0"})`,
                    background: i === active ? "var(--flavor)" : "transparent",
                    border: "1px solid currentColor", transition: "0.4s", flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase",
                    fontSize: "clamp(1.1rem,2.6vw,1.7rem)", letterSpacing: "-0.02em",
                  }}>{l.name}</span>
                  <span className="micro tnum" style={{ marginLeft: "auto" }}>{l.hours}</span>
                </button>
              </li>
            ))}
          </ul>

          <div data-loc-detail style={{
            background: "color-mix(in srgb, var(--foam) 62%, #fff)",
            border: "1px solid var(--rule)", borderRadius: 4, padding: "clamp(1.3rem,3vw,2.2rem)",
          }}>
            <h3 className="display-sm">{loc.name}</h3>
            <p className="lede" style={{ marginTop: "0.9rem", fontSize: "0.95rem" }}>{loc.address}</p>
            <p className="micro" style={{ marginTop: "1.1rem" }}>{loc.hours}</p>
            <p style={{ marginTop: "1.1rem", color: "var(--fg-soft)", fontSize: "0.9rem" }}>{loc.note}</p>
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.8rem", flexWrap: "wrap" }}>
              <a href={loc.maps} target="_blank" rel="noreferrer" data-cursor="VIEW" style={{
                background: "var(--deep)", color: "var(--foam)", padding: "0.72rem 1.3rem",
                borderRadius: 999, fontSize: "0.64rem", letterSpacing: "0.2em", fontWeight: 700, textDecoration: "none",
              }}>DIRECTIONS</a>
              <a href="#order" data-cursor="ORDER" style={{
                border: "1px solid var(--rule)", padding: "0.72rem 1.3rem", borderRadius: 999,
                fontSize: "0.64rem", letterSpacing: "0.2em", fontWeight: 700,
                textDecoration: "none", color: "var(--fg)",
              }}>ORDER</a>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 820px){ .loc-grid { grid-template-columns: minmax(0,1fr) !important; } }`}</style>
    </section>
  );
}

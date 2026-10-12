"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { menu, money, flavorById } from "@/shake.config";

/**
 * Scene 21. The functional part, and it still belongs to the liquid world.
 *
 * Editorial, not a card grid: rows alternate their composition, a few products are set
 * oversized, and hovering a name floats a blob of that flavour behind it. The blob is a
 * CSS gradient rather than another GL context — it is UI decoration, and spending a
 * WebGL context on a hover state would be indefensible.
 */
export default function MenuScene() {
  const root = useRef<HTMLDivElement>(null);
  const blob = useRef<HTMLDivElement>(null);
  const [cat, setCat] = useState(0);
  const group = menu[cat];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-mi]", { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.05, ease: "power2.out" });
    }, root);
    return () => ctx.revert();
  }, [cat]);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const el = blob.current!;
    const x = gsap.quickTo(el, "x", { duration: 0.7, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.7, ease: "power3" });
    const onMove = (e: PointerEvent) => {
      const host = (e.target as HTMLElement)?.closest?.("[data-flav]") as HTMLElement | null;
      const r = root.current!.getBoundingClientRect();
      x(e.clientX - r.left);
      y(e.clientY - r.top);
      const f = host?.dataset.flav;
      gsap.to(el, {
        opacity: f ? 0.5 : 0,
        scale: f ? 1 : 0.5,
        background: f
          ? `radial-gradient(closest-side, ${flavorById(f).color} 0%, ${flavorById(f).secondaryColor} 55%, transparent 78%)`
          : "transparent",
        duration: 0.55,
      });
    };
    root.current!.addEventListener("pointermove", onMove);
    return () => root.current?.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <section ref={root} id="menu" className="scene" style={{
      background: "var(--paper)", paddingBlock: "clamp(5rem,12vh,9rem)", position: "relative", overflow: "hidden",
    }}>
      <div ref={blob} aria-hidden style={{
        position: "absolute", left: 0, top: 0, width: "30rem", height: "22rem",
        transform: "translate(-50%,-50%)", filter: "blur(46px)", opacity: 0,
        pointerEvents: "none", zIndex: 0, borderRadius: "50%",
      }} />

      <div className="shell" style={{ position: "relative", zIndex: 1 }}>
        <p className="eyebrow">10 — The list</p>
        <h2 className="display-md" style={{ marginTop: "1rem" }}>EVERYTHING WE POUR.</h2>

        <nav style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", margin: "2.4rem 0 3rem" }}>
          {menu.map((m, i) => (
            <button key={m.id} onClick={() => setCat(i)} aria-current={i === cat} style={{
              padding: "0.5rem 0.95rem", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${i === cat ? "var(--deep)" : "var(--rule)"}`,
              background: i === cat ? "var(--deep)" : "transparent",
              color: i === cat ? "var(--foam)" : "var(--fg)",
              fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase",
              fontWeight: 600, fontFamily: "var(--font-sans)", transition: "0.3s",
            }}>
              {m.name}
            </button>
          ))}
        </nav>

        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {group.items.map((it, i) => {
            const big = "hero" in it && it.hero;
            const flip = i % 2 === 1;
            return (
              <li key={it.name} data-mi data-flav={guessFlavor(it.name)} style={{
                display: "grid", gridTemplateColumns: flip ? "auto minmax(0,1fr) auto" : "auto minmax(0,1fr) auto",
                alignItems: "baseline", gap: "clamp(0.8rem,3vw,2.4rem)",
                padding: "clamp(1.1rem,2.6vh,2rem) 0", borderTop: "1px solid var(--rule)",
                direction: flip ? "rtl" : "ltr",
              }}>
                <span className="micro tnum" style={{ direction: "ltr" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{ direction: "ltr", textAlign: flip ? "right" : "left" }}>
                  <h3 style={{
                    margin: 0, fontFamily: "var(--font-display)", fontWeight: 900,
                    letterSpacing: "-0.03em", textTransform: "uppercase", lineHeight: 0.95,
                    fontSize: big ? "clamp(2rem,6.2vw,4.6rem)" : "clamp(1.2rem,3vw,2.1rem)",
                  }}>
                    {it.name}
                  </h3>
                  {it.parts.length > 0 && (
                    <p className="micro" style={{ marginTop: "0.55rem" }}>{it.parts.join(" · ")}</p>
                  )}
                </div>
                <div style={{ direction: "ltr", display: "flex", alignItems: "center", gap: "0.9rem" }}>
                  <span className="tnum" style={{ fontWeight: 600, fontSize: "0.92rem" }}>{money(it.price)}</span>
                  <a href="#order" data-cursor="ORDER" style={{
                    border: "1px solid var(--rule)", borderRadius: 999, padding: "0.42rem 0.9rem",
                    fontSize: "0.62rem", letterSpacing: "0.18em", fontWeight: 700,
                    textDecoration: "none", color: "var(--fg)", whiteSpace: "nowrap",
                  }}>ADD</a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Maps a product name onto a flavour so the hover blob is the right colour. */
function guessFlavor(name: string) {
  const n = name.toLowerCase();
  if (n.includes("mango") || n.includes("tropic")) return "mango";
  if (n.includes("straw") || n.includes("berry")) return "strawberry";
  if (n.includes("cocoa") || n.includes("chocolate") || n.includes("brownie") || n.includes("nutella") || n.includes("dark")) return "chocolate";
  if (n.includes("pistachio") || n.includes("saffron") || n.includes("green")) return "pistachio";
  if (n.includes("banana") || n.includes("peanut")) return "banana";
  return "oreo";
}

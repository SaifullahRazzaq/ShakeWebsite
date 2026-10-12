"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import LiquidCanvas, { type LiquidHandle } from "@/components/liquid/LiquidCanvas";
import { fieldFrag, MODE } from "@/lib/liquid/fieldShader";
import ProductBottle from "@/components/art/ProductBottle";
import { gsap } from "@/lib/gsap";
import { builder, flavorById, money, site } from "@/shake.config";

type Sel = { base: string; flavor: string; extra: string[]; topping: string };

/**
 * Scenes 17–18. Build it, then mix it.
 *
 * Not a configurator with a preview image. Every choice changes the liquid in the cup in
 * real time: the flavour repaints it and raises the level, extras suspend solids in it,
 * the topping physically forms on the surface. MIX IT spins the whole thing into a vortex
 * and resolves to a finished bottle.
 */
export default function ShakeBuilder() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<LiquidHandle>(null);
  const cup = useRef<HTMLDivElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<Sel>({ base: "milk", flavor: "mango", extra: [], topping: "" });
  const [mixing, setMixing] = useState<"idle" | "running" | "done">("idle");

  const flavor = flavorById(sel.flavor);
  const price = useMemo(() => {
    const p = builder.basePrice
      + (builder.base.find((b) => b.id === sel.base)?.price ?? 0)
      + (builder.flavor.find((b) => b.id === sel.flavor)?.price ?? 0)
      + sel.extra.reduce((n, id) => n + (builder.extra.find((e) => e.id === id)?.price ?? 0), 0)
      + (builder.topping.find((t) => t.id === sel.topping)?.price ?? 0);
    return p;
  }, [sel]);

  // fill level responds to what has been chosen — the cup builds as you go
  const fill = 0.34 + (sel.flavor ? 0.20 : 0) + sel.extra.length * 0.06 + (sel.topping ? 0.10 : 0);

  useEffect(() => {
    const h = canvas.current;
    if (!h) return;
    h.set("uMode", mixing === "running" ? MODE.VORTEX : MODE.POUR);
    h.set("uThick", flavor.thickness);
    const other = flavorById(sel.extra.includes("oreo") ? "oreo" : sel.flavor);
    h.set("uDeepB", ...other.palette.deep);
    h.set("uSurfaceB", ...other.palette.surface);
    h.set("uFoamB", ...other.palette.foam);
    const s = { fill: 0 };
    const tw = gsap.to(s, {
      fill: Math.min(0.92, fill),
      duration: 1.1, ease: "power2.out",
      onUpdate: () => h.set("uFill", mixing === "running" ? 1 : s.fill),
    });
    h.set("uMix", sel.extra.length ? 0.7 : 0.25);
    return () => { tw.kill(); };
  }, [sel, fill, flavor, mixing]);

  const mix = () => {
    if (mixing === "running") return;
    setMixing("running");
    const h = canvas.current;
    const tl = gsap.timeline();
    // ingredients accelerate, the camera closes in, the scene becomes pure liquid
    tl.to(cup.current, { scale: 1.18, duration: 1.0, ease: "power2.in" })
      .to("[data-ing]", { scale: 0, opacity: 0, duration: 0.5, stagger: 0.04, ease: "power2.in" }, 0)
      .to({ v: 0 }, {
        v: 1, duration: 1.4, ease: "power2.inOut",
        onUpdate() { h?.set("uMix", 0.2 + this.targets()[0].v * 0.8); },
      }, 0.2)
      .to(cup.current, { scale: 1, opacity: 0, duration: 0.5, ease: "power2.out" }, 1.5)
      .add(() => setMixing("done"), 1.9)
      .fromTo(result.current, { opacity: 0, y: 40, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out" }, 2.0);
  };

  const reset = () => {
    setMixing("idle");
    gsap.set(cup.current, { scale: 1, opacity: 1 });
    gsap.set("[data-ing]", { scale: 1, opacity: 1 });
  };

  return (
    <section ref={root} id="builder" className="scene" style={{
      background: "var(--paper)", paddingBlock: "clamp(5rem,12vh,9rem)", overflow: "hidden",
    }}>
      <div className="shell">
        <div style={{ display: "grid", gap: "1rem", marginBottom: "3rem" }}>
          <p className="eyebrow">07 — Build your shake</p>
          <h2 className="display" style={{ fontSize: "clamp(2.6rem, 10vw, 8rem)" }}>
            <span style={{ display: "block" }}>MAKE</span>
            <span style={{ display: "block" }}>YOUR WAVE.</span>
          </h2>
        </div>

        <div className="bld-grid" style={{
          display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,0.9fr)",
          gap: "clamp(2rem,5vw,5rem)", alignItems: "center",
        }}>
          {/* ── the steps ─────────────────────────────────────────────────── */}
          <div style={{ display: "grid", gap: "1.8rem" }}>
            <Step n="01" label="Base">
              {builder.base.map((b) => (
                <Chip key={b.id} on={sel.base === b.id} onClick={() => setSel((s) => ({ ...s, base: b.id }))}
                      price={b.price}>{b.name}</Chip>
              ))}
            </Step>
            <Step n="02" label="Flavor">
              {builder.flavor.map((b) => (
                <Chip key={b.id} on={sel.flavor === b.id} tint={flavorById(b.id).color}
                      onClick={() => setSel((s) => ({ ...s, flavor: b.id }))} price={b.price}>{b.name}</Chip>
              ))}
            </Step>
            <Step n="03" label="Extra">
              {builder.extra.map((b) => (
                <Chip key={b.id} on={sel.extra.includes(b.id)} price={b.price}
                      onClick={() => setSel((s) => ({
                        ...s,
                        extra: s.extra.includes(b.id) ? s.extra.filter((x) => x !== b.id) : [...s.extra, b.id],
                      }))}>{b.name}</Chip>
              ))}
            </Step>
            <Step n="04" label="Topping">
              {builder.topping.map((b) => (
                <Chip key={b.id} on={sel.topping === b.id} price={b.price}
                      onClick={() => setSel((s) => ({ ...s, topping: s.topping === b.id ? "" : b.id }))}>{b.name}</Chip>
              ))}
            </Step>

            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "1rem", borderTop: "1px solid var(--rule)", paddingTop: "1.4rem", flexWrap: "wrap",
            }}>
              <span className="display-sm tnum">{money(price)}</span>
              {mixing === "done" ? (
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <a href={site.orderUrl} data-cursor="ORDER" style={btn(flavor.color)}>MAKE THIS ONE</a>
                  <button onClick={reset} style={{ ...btn("transparent"), border: "1px solid var(--rule)", color: "var(--fg)" }}>
                    START OVER
                  </button>
                </div>
              ) : (
                <button onClick={mix} data-cursor="MIX" disabled={mixing === "running"} style={btn(flavor.color)}>
                  {mixing === "running" ? "MIXING…" : "MIX IT"}
                </button>
              )}
            </div>
          </div>

          {/* ── the vessel ────────────────────────────────────────────────── */}
          <div style={{ position: "relative", display: "grid", placeItems: "center", minHeight: "min(70vh, 34rem)" }}>
            <div ref={cup} style={{
              position: "relative", width: "min(62vw, 18rem)", height: "min(58vh, 26rem)",
              willChange: "transform", gridArea: "1/1",
            }}>
              {/* glass */}
              <div style={{
                position: "absolute", inset: 0, overflow: "hidden",
                borderRadius: "10px 10px 38% 38% / 10px 10px 10% 10%",
                border: "1px solid color-mix(in srgb, var(--deep) 20%, transparent)",
                background: "linear-gradient(100deg, rgba(255,255,255,0.5), transparent 32%, rgba(255,255,255,0.28))",
                boxShadow: "inset -12px 0 28px -14px rgba(0,0,0,0.2), 0 30px 60px -30px rgba(120,60,0,0.4)",
              }}>
                <LiquidCanvas ref={canvas} frag={fieldFrag} palette={flavor.palette} className="fill" />

                {/* solids suspended in it */}
                {sel.extra.map((id, i) => (
                  <div key={id} data-ing aria-hidden style={{
                    position: "absolute", left: `${22 + i * 13}%`, bottom: `${18 + (i % 3) * 14}%`,
                    width: 14, height: 14, borderRadius: id === "oreo" ? 3 : 999,
                    background: id === "oreo" ? "#2b2724" : id === "brownie" ? "#4a2a16" : "var(--deep)",
                    opacity: 0.85, transform: `rotate(${i * 37}deg)`,
                  }} />
                ))}

                {/* the topping, physically sitting on the surface */}
                {sel.topping && (
                  <div data-ing aria-hidden style={{
                    position: "absolute", left: 0, right: 0,
                    bottom: `${Math.min(0.92, fill) * 100}%`, height: "16%",
                    background: sel.topping === "cream"
                      ? "radial-gradient(120% 100% at 50% 100%, #fff8ec 0%, #ffeccd 60%, transparent 100%)"
                      : sel.topping === "choc" ? "linear-gradient(180deg,#3a2114,#5b3520)"
                      : sel.topping === "caramel" ? "linear-gradient(180deg,#c98330,#a25f18)"
                      : sel.topping === "pistachio" ? "linear-gradient(180deg,#a8bd7a,#7b9152)"
                      : "repeating-linear-gradient(90deg,#2b2724 0 5px,transparent 5px 11px)",
                    borderRadius: "50% 50% 0 0 / 60% 60% 0 0",
                    transition: "bottom 0.9s cubic-bezier(.2,.8,.2,1)",
                  }} />
                )}
              </div>
            </div>

            {/* what comes out */}
            <div ref={result} style={{
              gridArea: "1/1", opacity: 0, pointerEvents: mixing === "done" ? "auto" : "none",
              display: "grid", placeItems: "center", gap: "1rem", textAlign: "center",
            }}>
              <div style={{ height: "min(52vh, 24rem)" }}>
                <ProductBottle flavor={flavor} level={0.86} style={{ height: "100%", width: "auto" }} />
              </div>
              <p className="display-sm">YOURS.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 900px){ .bld-grid { grid-template-columns: minmax(0,1fr) !important; } }`}</style>
    </section>
  );
}

const btn = (bg: string): React.CSSProperties => ({
  background: bg, color: bg === "transparent" ? "inherit" : "#1a0f05",
  padding: "0.9rem 1.8rem", borderRadius: 999, border: "none", cursor: "pointer",
  fontSize: "0.68rem", letterSpacing: "0.2em", fontWeight: 700, textDecoration: "none",
  fontFamily: "var(--font-sans)", transition: "background 0.8s",
});

function Step({ n, label, children }: { n: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="micro" style={{ marginBottom: "0.7rem" }}>{n} — {label}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>{children}</div>
    </div>
  );
}

function Chip({ on, tint, price, onClick, children }: {
  on: boolean; tint?: string; price: number; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} aria-pressed={on} data-cursor="MIX" style={{
      display: "inline-flex", alignItems: "center", gap: "0.45rem",
      padding: "0.55rem 0.95rem", borderRadius: 999, cursor: "pointer",
      border: `1px solid ${on ? (tint ?? "var(--deep)") : "var(--rule)"}`,
      background: on ? (tint ? `color-mix(in srgb, ${tint} 24%, transparent)` : "color-mix(in srgb, var(--deep) 10%, transparent)") : "transparent",
      color: "var(--fg)", fontSize: "0.72rem", fontWeight: 600, fontFamily: "var(--font-sans)",
      transition: "background 0.4s, border-color 0.4s",
    }}>
      {tint && <span style={{ width: 7, height: 7, borderRadius: 999, background: tint }} />}
      {children}
      {price > 0 && <span className="tnum" style={{ opacity: 0.45, fontSize: "0.66rem" }}>+{price}</span>}
    </button>
  );
}

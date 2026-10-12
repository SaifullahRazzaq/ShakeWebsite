"use client";
import { useEffect, useRef, useState } from "react";
import LiquidCanvas, { type LiquidHandle } from "@/components/liquid/LiquidCanvas";
import { fieldFrag, MODE } from "@/lib/liquid/fieldShader";
import ProductBottle from "@/components/art/ProductBottle";
import { gsap } from "@/lib/gsap";
import { heroFlavors, flavorById, money } from "@/shake.config";
import { useFlavor } from "@/components/core/FlavorProvider";

/**
 * Scene 10. Five worlds, one room.
 *
 * Each flavour gets its own liquid behaviour, not a recolour: mango drifts, strawberry
 * folds cream, chocolate moves as a heavy wall, pistachio spirals, cookies and cream
 * churns. Selecting one transforms the environment — liquid, bottle, light, type.
 */
/**
 * Each world gets its own liquid behaviour and its own driving parameters. `fill` and
 * `mix` mean different things per mode — in UNDER it is how far a second flavour has
 * bled in (so it must be 0 here, or mango's world floods with strawberry), in WALL it is
 * how far the wave has built, in VORTEX how hard it is spinning.
 */
const WORLD: Record<string, { mode: number; fill: number; mix: number }> = {
  mango:      { mode: MODE.UNDER,  fill: 0.00, mix: 0.00 },   // drifting, undisturbed
  strawberry: { mode: MODE.BLEED,  fill: 0.42, mix: 0.00 },   // cream folding through berry
  chocolate:  { mode: MODE.WALL,   fill: 0.58, mix: 0.00 },   // one heavy mass, mid-fold
  pistachio:  { mode: MODE.VORTEX, fill: 0.45, mix: 0.30 },   // a slow spiral
  oreo:       { mode: MODE.MARBLE, fill: 0.00, mix: 0.80 },   // dark crumb through cream
};

export default function FlavorWorlds() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<LiquidHandle>(null);
  const copy = useRef<HTMLDivElement>(null);
  const bottleWrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { setFlavor } = useFlavor();
  const flavor = heroFlavors[active];

  // Drive the shader for the selected world. Mode switches instantly, everything else
  // is tweened, so the change reads as the liquid transforming rather than a cut.
  useEffect(() => {
    const h = canvas.current;
    if (!h) return;
    const f = heroFlavors[active];
    const w = WORLD[f.id] ?? WORLD.mango;
    // the second colour a world folds through itself — its own foam, except for
    // cookies and cream, which folds dark crumb through white
    const other = f.id === "oreo" ? flavorById("chocolate") : f;

    h.set("uMode", w.mode);
    h.set("uThick", f.thickness);
    h.set("uOrigin", 0.5, 0.55);
    h.set("uDeepB", ...other.palette.deep);
    h.set("uSurfaceB", ...other.palette.surface);
    h.set("uFoamB", ...other.palette.foam);

    const s = { fill: 0, mix: 0 };
    const tw = gsap.to(s, {
      fill: w.fill, mix: w.mix,
      duration: 1.6, ease: "power2.inOut",
      onUpdate: () => { h.set("uFill", s.fill); h.set("uMix", s.mix); },
    });
    setFlavor(f.id, 1.6);
    return () => { tw.kill(); };
  }, [active, setFlavor]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(copy.current!.children,
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: "power2.out" });
      gsap.fromTo(bottleWrap.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 });
    }, root);
    return () => ctx.revert();
  }, [active]);

  return (
    <section ref={root} id="flavors" className="scene" style={{ minHeight: "100vh", overflow: "hidden" }}>
      <div style={{ position: "relative", minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <LiquidCanvas ref={canvas} frag={fieldFrag} palette={flavor.palette}
                      className="fill" style={{ zIndex: 0 }} />

        <div className="shell" style={{
          position: "relative", zIndex: 2, width: "100%",
          display: "grid", gap: "2rem", alignItems: "center",
          gridTemplateColumns: "minmax(0,1fr) auto", paddingBlock: "clamp(6rem,12vh,9rem)",
        }}>
          <div style={{ display: "grid", gap: "2.4rem", gridTemplateColumns: "minmax(0,1fr) minmax(0,0.8fr)", alignItems: "center" }}
               className="fw-grid">
            <div ref={copy}>
              <p className="eyebrow" style={{ color: "color-mix(in srgb, var(--foam) 82%, transparent)" }}>
                {flavor.index} — {flavor.mood}
              </p>
              <h2 className="display" style={{ color: "var(--foam)", marginTop: "1rem", fontSize: "clamp(2.8rem, 9vw, 8rem)" }}>
                {flavor.name}
              </h2>
              <p className="lede" style={{ color: "color-mix(in srgb, var(--foam) 80%, transparent)", marginTop: "1.4rem" }}>
                {flavor.description}
              </p>
              <ul style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", listStyle: "none", padding: 0, margin: "1.6rem 0 0" }}>
                {flavor.ingredients.map((i) => (
                  <li key={i} className="micro" style={{
                    border: "1px solid color-mix(in srgb, var(--foam) 34%, transparent)",
                    color: "color-mix(in srgb, var(--foam) 88%, transparent)",
                    padding: "0.42rem 0.8rem", borderRadius: 999,
                  }}>{i}</li>
                ))}
              </ul>
              <p className="display-sm tnum" style={{ color: "var(--foam)", marginTop: "1.8rem" }}>
                {money(flavor.price)}
              </p>
            </div>

            <div ref={bottleWrap} style={{ justifySelf: "center", height: "min(62vh, 34rem)" }}>
              <ProductBottle flavor={flavor} level={0.82} style={{ height: "100%", width: "auto" }} />
            </div>
          </div>

          {/* the index — not tabs. Selecting one rebuilds the world. */}
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.55rem" }}>
            {heroFlavors.map((f, i) => (
              <li key={f.id}>
                <button
                  onClick={() => setActive(i)}
                  data-cursor="TASTE"
                  aria-current={i === active}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.7rem", background: "none",
                    border: "none", padding: "0.3rem 0", cursor: "pointer", textAlign: "left",
                    color: "var(--foam)", opacity: i === active ? 1 : 0.45,
                    transition: "opacity 0.4s",
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: 999, flexShrink: 0,
                    background: i === active ? f.color : "transparent",
                    border: `1px solid ${i === active ? f.color : "currentColor"}`,
                    transition: "0.4s",
                  }} />
                  <span className="micro" style={{ color: "inherit" }}>{f.index}</span>
                  <span style={{
                    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.86rem",
                    letterSpacing: "-0.01em", textTransform: "uppercase",
                  }}>{f.name}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .fw-grid { grid-template-columns: minmax(0,1fr) !important; }
        }
      `}</style>
    </section>
  );
}

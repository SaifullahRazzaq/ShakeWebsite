"use client";
import { useEffect, useRef } from "react";
import LiquidCanvas, { type LiquidHandle } from "@/components/liquid/LiquidCanvas";
import { fieldFrag, MODE } from "@/lib/liquid/fieldShader";
import { MangoCube, MangoSlice, Strawberry, IceCube } from "@/components/art/Fruit";
import { gsap } from "@/lib/gsap";
import { flavorById } from "@/shake.config";
import { useFlavor } from "@/components/core/FlavorProvider";

const MANGO = flavorById("mango");
const BERRY = flavorById("strawberry");

/**
 * Scenes 08–09. Under the surface, then the transformation.
 *
 * The camera drifts through suspended fruit, then a strawberry falls into frame, touches
 * the liquid, and pink spreads out of the contact point until the world is a different
 * flavour. No carousel, no crossfade — the environment itself changes.
 */
export default function UnderWorld() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<LiquidHandle>(null);
  const drift = useRef<HTMLDivElement>(null);
  const berry = useRef<HTMLDivElement>(null);
  const { setFlavor } = useFlavor();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const h = canvas.current;
      h?.set("uMode", MODE.UNDER);
      h?.set("uThick", MANGO.thickness);
      h?.set("uFill", 0);
      h?.set("uOrigin", 0.5, 0.62);
      h?.set("uDeepB", ...BERRY.palette.deep);
      h?.set("uSurfaceB", ...BERRY.palette.surface);
      h?.set("uFoamB", ...BERRY.palette.foam);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1.1 },
      });

      // the camera keeps travelling through the suspended field
      if (!reduced) tl.fromTo(drift.current, { yPercent: 12 }, { yPercent: -16, duration: 1 }, 0);

      // copy, floating
      tl.fromTo("[data-u='a']", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.08 }, 0.06)
        .to("[data-u='a']", { opacity: 0, y: -40, duration: 0.06 }, 0.30);

      // the strawberry arrives, slowly — it has to fall a long way
      tl.fromTo(berry.current,
        { yPercent: -190, xPercent: 40, rotate: -30, opacity: 0 },
        { yPercent: -10, xPercent: 0, rotate: 8, opacity: 1, duration: 0.22, ease: "power1.in" }, 0.34);

      // contact. The colour cloud leaves the strawberry and takes the world with it.
      tl.to(berry.current, { yPercent: 16, scale: 0.9, opacity: 0, duration: 0.10 }, 0.56);
      tl.to({ v: 0 }, {
        v: 1, duration: 0.30,
        onUpdate() { canvas.current?.set("uFill", this.targets()[0].v); },
      }, 0.56);

      // the CSS world follows the same curve, so type and UI change with the liquid
      tl.call(() => setFlavor("strawberry", 2.2), undefined, 0.60);
      tl.call(() => setFlavor("mango", 2.2), undefined, 0.58);   // scrubbing back restores it

      tl.fromTo("[data-u='b']", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.07 }, 0.72)
        .to("[data-u='b']", { opacity: 0, duration: 0.06 }, 0.94);
    }, root);
    return () => ctx.revert();
  }, [setFlavor]);

  return (
    <section ref={root} id="story" className="scene" style={{ height: "340vh" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        <LiquidCanvas
          ref={canvas}
          frag={fieldFrag}
          palette={MANGO.palette}
          className="fill"
          style={{ zIndex: 0 }}
        />

        {/* suspended field — fruit, ice and cream drifting past the camera */}
        <div ref={drift} aria-hidden className="fill" style={{ zIndex: 1 }}>
          {FLOAT.map((f, i) => (
            <Floater key={i} {...f} />
          ))}
        </div>

        {/* the strawberry that changes everything */}
        <div ref={berry} style={{
          position: "absolute", left: "50%", top: "44%", zIndex: 2,
          transform: "translate(-50%,-50%)", filter: "drop-shadow(0 20px 40px rgba(90,10,30,0.35))",
        }}>
          <Strawberry size={130} />
        </div>

        <div className="fill shell" style={{ zIndex: 3, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <h2 data-u="a" className="display-md" style={{ textAlign: "center", color: "var(--foam)", opacity: 0 }}>
            {MANGO.headline.map((l) => <span key={l} style={{ display: "block" }}>{l}</span>)}
          </h2>
          <h2 data-u="b" className="display-md" style={{
            textAlign: "center", color: "var(--foam)", opacity: 0, position: "absolute",
          }}>
            <span style={{ display: "block" }}>ONE FRUIT</span>
            <span style={{ display: "block" }}>CHANGES</span>
            <span style={{ display: "block" }}>EVERYTHING.</span>
          </h2>
        </div>
      </div>
    </section>
  );
}

type F = { x: number; y: number; size: number; rot: number; kind: "cube" | "slice" | "ice"; blur: number; dur: number };
const FLOAT: F[] = [
  { x: 14, y: 22, size: 88, rot: -20, kind: "cube", blur: 2.4, dur: 11 },
  { x: 78, y: 16, size: 64, rot: 30, kind: "cube", blur: 3.6, dur: 14 },
  { x: 30, y: 62, size: 150, rot: 14, kind: "slice", blur: 0.6, dur: 9 },
  { x: 88, y: 58, size: 120, rot: -12, kind: "cube", blur: 1.2, dur: 12 },
  { x: 8, y: 78, size: 190, rot: 26, kind: "cube", blur: 5.2, dur: 16 },
  { x: 60, y: 84, size: 78, rot: -34, kind: "ice", blur: 1.8, dur: 10 },
  { x: 46, y: 30, size: 58, rot: 12, kind: "ice", blur: 3.0, dur: 13 },
  { x: 68, y: 44, size: 96, rot: 44, kind: "cube", blur: 0.8, dur: 8 },
];

function Floater({ x, y, size, rot, kind, blur, dur }: F) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.to(el.current, {
        yPercent: -14, xPercent: 6, rotate: `+=${rot > 0 ? 16 : -16}`,
        duration: dur, ease: "sine.inOut", repeat: -1, yoyo: true,
      });
    }, el);
    return () => ctx.revert();
  }, [dur, rot]);
  return (
    <div ref={el} style={{
      position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)",
      filter: `blur(${blur}px)`, opacity: 0.9 - blur * 0.06, willChange: "transform",
    }}>
      {kind === "cube" ? <MangoCube size={size} rot={rot} />
        : kind === "slice" ? <MangoSlice size={size} rot={rot} />
        : <IceCube size={size} rot={rot} />}
    </div>
  );
}

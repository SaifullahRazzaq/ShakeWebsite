"use client";
import { useEffect, useRef } from "react";
import LiquidCanvas, { type LiquidHandle } from "@/components/liquid/LiquidCanvas";
import { fieldFrag, MODE } from "@/lib/liquid/fieldShader";
import { gsap } from "@/lib/gsap";
import { flavorById } from "@/shake.config";

const F = flavorById("mango");

/**
 * Scene 13. Used exactly once, on one word.
 *
 * The word is a mask: shake flows *inside* the letters. A wave then passes over the whole
 * frame and the letters distort through it, which is refraction, not a filter — the
 * displacement is driven by the same turbulence as the liquid behind it.
 */
export default function LiquidTypography() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<LiquidHandle>(null);
  const word = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const h = canvas.current;
      h?.set("uMode", MODE.UNDER);
      h?.set("uThick", 0.55);
      h?.set("uFill", 0);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 1 },
      });
      tl.fromTo(word.current, { backgroundPositionY: "18%" }, { backgroundPositionY: "82%", duration: 1 }, 0);
      tl.fromTo("[data-lt='sub']", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.2 }, 0.28);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="scene" style={{
      minHeight: "92vh", display: "grid", placeItems: "center",
      background: "var(--paper)", overflow: "hidden", position: "relative",
    }}>
      {/* the liquid that fills the letters */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.18 }}>
        <LiquidCanvas ref={canvas} frag={fieldFrag} palette={F.palette} className="fill" />
      </div>

      <div className="shell" style={{ position: "relative", zIndex: 2, textAlign: "center", width: "100%" }}>
        <p className="eyebrow">04 — Consistency</p>
        <div
          ref={word}
          className="display"
          style={{
            fontSize: "clamp(4.5rem, 26vw, 24rem)",
            // the letters ARE the window onto the liquid
            backgroundImage: `linear-gradient(178deg,
              color-mix(in srgb, var(--foam) 92%, #fff) 0%,
              var(--flavor) 26%,
              var(--flavor-2) 58%,
              color-mix(in srgb, var(--deep) 70%, var(--flavor-2)) 100%)`,
            backgroundSize: "100% 320%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: "url(#wh-refract)",
            marginTop: "0.6rem",
          }}
        >
          THICK
        </div>
        <p data-lt="sub" className="lede" style={{ margin: "1.2rem auto 0", opacity: 0 }}>
          If it runs off the spoon, we made it wrong.
        </p>
      </div>

      {/* the refraction the passing wave causes. Subtle by design. */}
      <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
        <filter id="wh-refract">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.020" numOctaves="2" seed="7" result="n">
            <animate attributeName="baseFrequency" dur="18s" values="0.006 0.020;0.010 0.014;0.006 0.020" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </section>
  );
}

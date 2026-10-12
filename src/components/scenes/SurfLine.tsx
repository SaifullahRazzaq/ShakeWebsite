"use client";
import { useEffect, useRef } from "react";
import LiquidCanvas, { type LiquidHandle } from "@/components/liquid/LiquidCanvas";
import { oceanFrag } from "@/lib/liquid/oceanShader";
import { CAM, bottleDistance, focusPoint } from "@/lib/liquid/camera";
import ProductBottle from "@/components/art/ProductBottle";
import { gsap } from "@/lib/gsap";
import { heroFlavors } from "@/shake.config";

/**
 * Scene 16. One long wave, five bottles riding it.
 *
 * Horizontal travel is driven by vertical scroll. The same ocean shader as the hero runs
 * underneath, so the bottles are sitting in the same sea the film opened on — each one
 * tinting the water it occupies.
 */
export default function SurfLine() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const rear = useRef<LiquidHandle>(null);
  const front = useRef<LiquidHandle>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const dist = bottleDistance();
      const focus = focusPoint();
      for (const [i, h] of [rear.current, front.current].entries()) {
        h?.set("uLayer", i);
        h?.set("uBottleDist", dist);
        h?.set("uFocus", focus[0], focus[1]);
        h?.set("uCamH", CAM.height);
        h?.set("uPitch", CAM.pitch);
        h?.set("uFov", CAM.fov);
        h?.set("uAmp", 0.95);
        h?.set("uDropAmt", 0);
        h?.set("uCollide", 0);
      }

      const el = track.current!;
      const scrollLen = () => el.scrollWidth - window.innerWidth;
      gsap.to(el, {
        x: () => -scrollLen(),
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${scrollLen() + window.innerHeight}`,
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
        },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="scene" style={{ overflow: "hidden", height: "100vh" }}>
      <div style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
        <div aria-hidden className="fill" style={{
          zIndex: 0,
          background: "linear-gradient(180deg, color-mix(in srgb,var(--sky) 50%, #fff9ec) 0%, color-mix(in srgb,var(--sky) 92%,#fff) 42%, var(--flavor) 58%, color-mix(in srgb,var(--deep) 45%, var(--flavor)) 100%)",
        }} />
        <LiquidCanvas ref={rear} frag={oceanFrag} palette={heroFlavors[0].palette} className="fill" style={{ zIndex: 1 }} />

        <div ref={track} style={{
          position: "absolute", left: 0, top: 0, height: "100%", zIndex: 2,
          display: "flex", alignItems: "flex-end", gap: "clamp(3rem,10vw,10rem)",
          padding: "0 12vw 18vh", willChange: "transform",
        }}>
          <div style={{ alignSelf: "center", minWidth: "min(80vw, 26rem)" }}>
            <p className="eyebrow">06 — The line</p>
            <h2 className="display-md" style={{ marginTop: "1rem", color: "color-mix(in srgb,var(--deep) 92%,#000)" }}>
              <span style={{ display: "block" }}>FIVE</span>
              <span style={{ display: "block" }}>RIDING</span>
              <span style={{ display: "block" }}>THE SAME SEA.</span>
            </h2>
            <p className="micro" style={{ marginTop: "1.6rem" }}>Drag / scroll →</p>
          </div>

          {heroFlavors.map((f, i) => (
            <div key={f.id} data-cursor="DRAG" style={{
              position: "relative", height: `${34 + (i % 3) * 5}vh`, flexShrink: 0,
              marginBottom: `${(i % 2) * 4}vh`,
            }}>
              {/* the local colour this bottle gives the water around it */}
              <div aria-hidden style={{
                position: "absolute", left: "50%", bottom: "-6vh", transform: "translateX(-50%)",
                width: "26rem", height: "12rem", borderRadius: "50%", filter: "blur(30px)",
                background: `radial-gradient(closest-side, ${f.color} 0%, transparent 72%)`, opacity: 0.38,
              }} />
              <ProductBottle flavor={f} level={0.78} style={{ height: "100%", width: "auto", position: "relative" }} />
              <p className="micro" style={{ textAlign: "center", marginTop: "0.8rem", color: "color-mix(in srgb, var(--deep) 82%, #000)" }}>{f.index} {f.name}</p>
            </div>
          ))}
        </div>

        <LiquidCanvas ref={front} frag={oceanFrag} palette={heroFlavors[0].palette} className="fill" style={{ zIndex: 3 }} />
      </div>
    </section>
  );
}

"use client";
import { useEffect, useRef } from "react";
import LiquidCanvas, { type LiquidHandle } from "@/components/liquid/LiquidCanvas";
import { fieldFrag, MODE } from "@/lib/liquid/fieldShader";
import { gsap } from "@/lib/gsap";
import { reviews, flavorById } from "@/shake.config";

/**
 * Scene 22. No testimonial cards. Each reaction gets the whole screen, set at display
 * size, over a slow splash in that reviewer's flavour.
 */
export default function Social() {
  const root = useRef<HTMLDivElement>(null);
  const canvases = useRef<(LiquidHandle | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      canvases.current.forEach((h, i) => {
        h?.set("uMode", MODE.UNDER);
        h?.set("uThick", 0.5 + i * 0.1);
        h?.set("uFill", 0);
      });
      gsap.utils.toArray<HTMLElement>("[data-rev]").forEach((el) => {
        gsap.fromTo(el.querySelectorAll("[data-rl]"),
          { yPercent: 110 },
          {
            yPercent: 0, duration: 1, stagger: 0.08, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 72%" },
          });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="scene">
      {reviews.map((r, i) => {
        const f = flavorById(r.flavor);
        return (
          <div key={r.by} data-rev style={{
            position: "relative", minHeight: "86vh", display: "grid", placeItems: "center",
            overflow: "hidden", background: `color-mix(in srgb, ${f.color} 22%, var(--paper))`,
          }}>
            <LiquidCanvas
              ref={(h) => { canvases.current[i] = h; }}
              frag={fieldFrag}
              palette={f.palette}
              className="fill"
              style={{ zIndex: 0, opacity: 0.55 }}
            />
            <div className="shell" style={{ position: "relative", zIndex: 2, textAlign: i % 2 ? "right" : "left", width: "100%" }}>
              <blockquote style={{ margin: 0 }}>
                {r.quote.map((line) => (
                  <span key={line} style={{ display: "block", overflow: "hidden" }}>
                    <span data-rl className="display" style={{
                      display: "block", color: "color-mix(in srgb, var(--deep) 92%, #000)",
                      fontSize: "clamp(2.2rem, 9vw, 7.5rem)",
                    }}>{line}</span>
                  </span>
                ))}
              </blockquote>
              <p className="micro" style={{ marginTop: "1.6rem" }}>
                {"★".repeat(r.stars)} &nbsp; {r.by} · {f.name}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

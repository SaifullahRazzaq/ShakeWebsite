"use client";
import { useEffect, useRef } from "react";
import LiquidCanvas, { type LiquidHandle } from "@/components/liquid/LiquidCanvas";
import ProductBottle from "@/components/art/ProductBottle";
import FruitField from "@/components/art/FruitField";
import { oceanFrag } from "@/lib/liquid/oceanShader";
import { CAM, bottleDistance, focusPoint, BOTTLE_BASE_Y, horizonY } from "@/lib/liquid/camera";
import { thicknessToSpeed, VISC } from "@/lib/liquid/viscosity";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { flavors, site } from "@/shake.config";

const MANGO = flavors[0];

/**
 * Scenes 01–07. One pinned film: calm ocean → two swells → collision → freeze →
 * orbit → bottle drop → dive under the surface.
 *
 * Nothing here touches React state. The timeline writes shader uniforms and CSS
 * transforms through refs, so scrubbing 560vh costs zero re-renders.
 */
export default function HeroOcean() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const rear = useRef<LiquidHandle>(null);
  const front = useRef<LiquidHandle>(null);
  const bottle = useRef<HTMLDivElement>(null);
  const bigType = useRef<HTMLDivElement>(null);
  const atmos = useRef<HTMLDivElement>(null);
  const gauge = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const mobile = window.matchMedia("(max-width: 820px)").matches;
      const dist = bottleDistance();
      const focus = focusPoint();          // world xz the bottle stands on

      // Shared simulation state. Both canvases read the same numbers every frame, which
      // is why one wave runs unbroken from behind the bottle to in front of it.
      const S = {
        amp: 0.80, speed: thicknessToSpeed(MANGO.thickness),
        waveAx: -17, waveAz: focus[1] + 1.0, waveAs: 0,
        waveBx: 17, waveBz: focus[1] - 0.8, waveBs: 0,
        collide: 0, splash: 0, freeze: 0, drop: 0, dive: 0,
        camH: CAM.height, pitch: CAM.pitch,
      };

      const push = () => {
        for (const h of [rear.current, front.current]) {
          if (!h) continue;
          h.set("uAmp", S.amp);
          h.set("uSpeed", S.speed);
          h.set("uWaveA", S.waveAx, S.waveAz, S.waveAs, 6.5);
          h.set("uWaveB", S.waveBx, S.waveBz, S.waveBs, 5.0);
          h.set("uCollide", S.collide);
          h.set("uSplash", S.splash);
          h.set("uFreeze", S.freeze);
          h.set("uDropAmt", S.drop);
          h.set("uDive", S.dive);
          h.set("uCamH", S.camH);
          h.set("uPitch", S.pitch);
          h.set("uFov", CAM.fov);
          h.set("uBottleDist", dist);
          h.set("uFocus", focus[0], focus[1]);
        }
      };
      // init both layers
      rear.current?.set("uLayer", 0);
      front.current?.set("uLayer", 1);
      push();

      if (reduced) {
        // identity survives: the ocean still breathes, the splash is a held composition
        S.amp = 0.34; S.collide = 0.55; S.splash = 0.48; S.freeze = 1; S.drop = 0.85;
        push();
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.15,            // the page itself has viscosity
        },
        onUpdate: push,
      });

      // ── 0.00 hold. Let them look at it before anything happens. ──────────────
      tl.to(S, { duration: 0.10 }, 0);

      // ── 0.10 the swells. Visible long before they arrive — this is the anticipation.
      tl.to(S, {
        waveAx: -2.6, waveAs: 1.25, waveBx: 2.6, waveBs: 0.95, amp: 0.95,
        duration: 0.26, ease: "power1.in",
      }, 0.10);

      // ── 0.36 collision. Crown rises, drops launch, the swells spend themselves.
      tl.to(S, { collide: 1.15, drop: 1, splash: 0.40, duration: 0.07, ease: "power3.out" }, 0.36);
      tl.to(S, { waveAs: 0, waveBs: 0, duration: 0.09 }, 0.37);

      // ── 0.44 freeze. Time nearly stops; droplets separate and hang.
      tl.to(S, { freeze: 1, splash: 0.49, collide: 0.62, amp: 0.90, duration: 0.12 }, 0.44);

      // ── 0.56 orbit. The frozen splash resumes as a ribbon around the bottle.
      tl.to(S, { freeze: 0.30, splash: 1.00, collide: 0.22, duration: 0.12 }, 0.56);
      tl.to(bottle.current, { rotate: 12, scale: 1.04, duration: 0.14, ease: "power1.inOut" }, 0.56);
      tl.to(stage.current, { "--cam-x": "-1.2%", duration: 0.14 } as gsap.TweenVars, 0.56);

      // ── 0.68 calm. Everything settles; the bottle lifts. Quiet before the drop.
      tl.to(S, { drop: 0, collide: 0, splash: 1.3, amp: 0.70, duration: 0.08 }, 0.68);
      tl.to(bottle.current, { y: "-5%", rotate: 4, duration: 0.08 }, 0.72);

      // ── 0.80 the drop. It has weight: slow in, then the surface gives.
      tl.set(S, { splash: 0 }, 0.795);
      tl.to(bottle.current, { y: "16%", scale: 0.99, duration: 0.05, ease: "power2.in" }, 0.80);
      tl.to(S, { collide: 0.95, amp: 1.05, drop: 0.9, splash: 0.42, freeze: 0, duration: 0.05, ease: "power3.out" }, 0.845);
      tl.to(bottle.current, { y: "26%", duration: 0.06 }, 0.845);

      // ── 0.90 the dive. Camera sinks to the surface, then crosses it.
      tl.to(S, { camH: 0.06, pitch: 0.05, collide: 0.3, drop: 0.35, duration: 0.07 }, 0.88);
      tl.to(bottle.current, { y: "34%", opacity: 0.25, filter: "blur(6px)", duration: 0.06 }, 0.90);
      tl.to(S, { dive: 1, duration: 0.05 }, 0.95);

      // ── typography: MANGO drifts up and is eaten by the rising liquid ────────
      tl.to(bigType.current, { yPercent: -14, scale: 1.06, duration: 1 }, 0);
      tl.to(bigType.current, { opacity: 0, duration: 0.08 }, 0.86);
      tl.to(atmos.current, { filter: "saturate(1.25) brightness(0.82)", duration: 0.2 }, 0.8);

      // ── the gauge fills as the hero plays ───────────────────────────────────
      tl.to(gauge.current, { height: "100%", duration: 1, ease: "none" }, 0);

      // text beats
      const beat = (sel: string, at: number, len = 0.10) => {
        const el = root.current!.querySelector(sel) as HTMLElement;
        if (!el) return;
        gsap.set(el, { opacity: 0, y: 26 });
        tl.to(el, { opacity: 1, y: 0, duration: 0.035, ease: "power2.out" }, at)
          .to(el, { opacity: 0, y: -22, duration: 0.03, ease: "power2.in" }, at + len);
      };
      beat("[data-beat='open']", 0.0, 0.16);
      beat("[data-beat='freeze']", 0.455, 0.09);
      beat("[data-beat='orbit']", 0.60, 0.07);
      beat("[data-beat='deeper']", 0.845, 0.07);

      if (mobile) {
        // shorter film, same beats — nothing signature is cut
        ScrollTrigger.getById?.("hero");
      }
    }, root);

    return () => ctx.revert();
  }, []);

  const hz = horizonY() * 100;

  return (
    <section ref={root} id="hero" className="scene" style={{ height: "560vh" }}>
      <div
        ref={stage}
        className="no-x"
        style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}
      >
        {/* ── PLANE 1 · atmosphere ─────────────────────────────────────────── */}
        <div
          ref={atmos}
          aria-hidden
          className="fill"
          style={{
            zIndex: 0,
            background: `
              radial-gradient(120% 78% at 72% 12%, color-mix(in srgb, var(--foam) 78%, #fff) 0%, transparent 58%),
              radial-gradient(90% 60% at 20% 30%, color-mix(in srgb, var(--sky) 70%, #fff) 0%, transparent 62%),
              linear-gradient(180deg,
                color-mix(in srgb, var(--sky) 55%, #fff8ea) 0%,
                color-mix(in srgb, var(--sky) 88%, #fff) 38%,
                var(--flavor) ${hz}%,
                color-mix(in srgb, var(--deep) 40%, var(--flavor)) 100%)
            `,
          }}
        />
        {/* the sun, low and warm, sitting just above the horizon */}
        <div aria-hidden className="fill" style={{
          zIndex: 0,
          background: `radial-gradient(closest-side, color-mix(in srgb, #fff 88%, var(--foam)) 0%, transparent 70%)`,
          width: "46vmax", height: "46vmax", left: "62%", top: `${100 - hz - 26}%`,
          inset: "auto", position: "absolute", transform: "translate(-50%,-50%)", opacity: 0.55,
          filter: "blur(6px)",
        }} />

        {/* ── PLANE 2 · the wall of type ───────────────────────────────────── */}
        <div ref={bigType} aria-hidden style={{
          position: "absolute", left: 0, right: 0, top: `${100 - hz - 34}%`,
          zIndex: 1, textAlign: "center", color: "var(--deep)",
          mixBlendMode: "multiply", opacity: 0.46, willChange: "transform",
        }}>
          <div className="display" style={{ fontSize: "clamp(5rem, 22vw, 22rem)", lineHeight: 0.78 }}>
            MANGO
          </div>
        </div>

        {/* ── PLANE 3 · the ocean, behind ──────────────────────────────────── */}
        <LiquidCanvas
          ref={rear}
          frag={oceanFrag}
          palette={MANGO.palette}
          pointer
          pointerTarget={stage}
          uniforms={{ uLayer: [0], uSpecPower: [VISC.specPower], uSSS: [VISC.sss] }}
          className="fill"
          style={{ zIndex: 2 }}
        />

        {/* ── PLANE 4 · fruit behind the bottle ────────────────────────────── */}
        <FruitField plane="back" style={{ zIndex: 3 }} />

        {/* ── PLANE 5 · the bottle ─────────────────────────────────────────── */}
        <div ref={bottle} className="hero-bottle" style={{
          position: "absolute", left: "50%", bottom: `${BOTTLE_BASE_Y * 100}%`,
          transform: "translateX(-50%)", height: "54vh", zIndex: 4,
          willChange: "transform", transformOrigin: "50% 90%",
        }}>
          <ProductBottle flavor={MANGO} level={0.8} style={{ height: "100%", width: "auto", display: "block" }} />
        </div>

        {/* ── PLANE 6 · the ocean, in front ────────────────────────────────── */}
        <LiquidCanvas
          ref={front}
          frag={oceanFrag}
          palette={MANGO.palette}
          pointer
          pointerTarget={stage}
          uniforms={{ uLayer: [1], uSpecPower: [VISC.specPower], uSSS: [VISC.sss] }}
          className="fill"
          style={{ zIndex: 5 }}
        />

        {/* ── PLANE 7 · foreground fruit, soft ─────────────────────────────── */}
        <FruitField plane="front" style={{ zIndex: 6 }} />

        {/* ── PLANE 8 · UI ─────────────────────────────────────────────────── */}
        {/* the type sits over live liquid, so it gets its own ground to stand on */}
        <div aria-hidden style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: "34%", zIndex: 6,
          background: "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--foam) 30%, transparent) 55%, color-mix(in srgb, var(--foam) 62%, transparent) 100%)",
          pointerEvents: "none",
        }} />
        <div className="fill shell" style={{ zIndex: 7, pointerEvents: "none" }}>
          <div style={{
            position: "absolute", left: "50%", top: "16%", transform: "translateX(-50%)",
            textAlign: "center", width: "min(92vw, 44rem)",
          }}>
            <p className="eyebrow" style={{ color: "color-mix(in srgb, var(--deep) 70%, transparent)" }}>
              {site.brandName} · 01 MANGO
            </p>
          </div>

          <div data-beat="open" style={{
            position: "absolute", left: "50%", bottom: "7%", transform: "translateX(-50%)",
            textAlign: "center", width: "min(92vw, 40rem)", pointerEvents: "auto",
          }}>
            <p className="lede" style={{
              margin: "0 auto 1.4rem", color: "color-mix(in srgb, var(--deep) 78%, transparent)",
              fontWeight: 600, maxWidth: "26ch",
            }}>
              Real mango. Ridiculously smooth.
            </p>
            <div className="hero-cta" style={{ display: "flex", gap: "0.8rem", justifyContent: "center", flexWrap: "wrap" }}>
              <LiquidButton>DIVE IN</LiquidButton>
              <LiquidButton ghost>SHOP THE FLAVOR</LiquidButton>
            </div>
            <p className="micro" style={{ marginTop: "1.6rem", color: "color-mix(in srgb, var(--deep) 45%, transparent)" }}>
              Scroll to make waves
            </p>
          </div>

          <BeatText id="freeze" lines={["CAUGHT", "IN THE", "CRAVING."]} tag="01 — REAL FRUIT" />
          <BeatText id="orbit" lines={["MANGO", "IN", "MOTION."]} tag="02 — NOTHING ADDED" align="left" />
          <BeatText id="deeper" lines={["GO", "DEEPER."]} tag="" />
        </div>

        {/* scroll gauge — a bottle filling with liquid, bottom-right */}
        <div aria-hidden style={{
          position: "absolute", right: "clamp(1rem,2.2vw,2.2rem)", bottom: "clamp(1.4rem,4vh,3rem)",
          zIndex: 7, width: 14, height: 48, borderRadius: "3px 3px 5px 5px",
          border: "1px solid color-mix(in srgb, var(--deep) 34%, transparent)",
          overflow: "hidden", display: "flex", alignItems: "flex-end",
        }}>
          <div ref={gauge} style={{ width: "100%", height: "0%", background: "var(--flavor)" }} />
        </div>
      </div>

      <style>{`
        /* Mobile is not a shrunk desktop: the bottle gives the ocean back its share of
           the frame, the beats sit higher so the liquid is never behind the copy, and the
           closing CTA stacks instead of wrapping awkwardly. Every signature beat stays. */
        @media (max-width: 820px) {
          .hero-bottle { height: 40vh !important; }
          .hero-beat { top: 38% !important; }
          .hero-cta { flex-direction: column; align-items: center; }
          .hero-cta > a { width: min(72vw, 18rem); text-align: center; }
        }
        @media (max-width: 820px) and (max-height: 700px) {
          .hero-bottle { height: 34vh !important; }
        }
      `}</style>
    </section>
  );
}

function BeatText({ id, lines, tag, align = "center" }: {
  id: string; lines: string[]; tag: string; align?: "center" | "left";
}) {
  return (
    <div data-beat={id} className="hero-beat" style={{
      position: "absolute",
      left: align === "left" ? "clamp(1.1rem,5vw,5rem)" : "50%",
      top: "50%",
      transform: align === "left" ? "translateY(-50%)" : "translate(-50%,-50%)",
      textAlign: align, opacity: 0, width: "min(92vw, 50rem)",
    }}>
      {tag && <p className="micro" style={{ marginBottom: "1rem", color: "color-mix(in srgb, var(--deep) 60%, transparent)" }}>{tag}</p>}
      <h2 className="display-md" style={{ color: "color-mix(in srgb, var(--deep) 88%, #000)" }}>
        {lines.map((l) => <span key={l} style={{ display: "block" }}>{l}</span>)}
      </h2>
    </div>
  );
}

function LiquidButton({ children, ghost = false }: { children: React.ReactNode; ghost?: boolean }) {
  return (
    <a href="#order" data-cursor="ORDER" style={{
      display: "inline-block", padding: "0.95rem 1.9rem", borderRadius: 999,
      background: ghost ? "transparent" : "color-mix(in srgb, var(--deep) 90%, #000)",
      color: ghost ? "color-mix(in srgb, var(--deep) 85%, #000)" : "var(--foam)",
      border: ghost ? "1px solid color-mix(in srgb, var(--deep) 32%, transparent)" : "none",
      fontSize: "0.72rem", letterSpacing: "0.2em", fontWeight: 700, textDecoration: "none",
    }}>
      {children}
    </a>
  );
}

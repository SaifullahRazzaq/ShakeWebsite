"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * The order CTA. Surface tension, not a blob.
 *
 * As the cursor approaches, the button leans toward it and its corners soften — the way a
 * drop deforms toward something before it touches. On hover a highlight travels through
 * it. The hit area and the label never move far enough to be hard to click, which is the
 * whole difference between this and the unreadable blob the brief warned about.
 */
export default function LiquidButton({
  children, href = "#order", tone = "solid",
}: { children: React.ReactNode; href?: string; tone?: "solid" | "ghost" }) {
  const el = useRef<HTMLAnchorElement>(null);
  const shine = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = el.current!;
    const x = gsap.quickTo(a, "x", { duration: 0.55, ease: "power3" });
    const y = gsap.quickTo(a, "y", { duration: 0.55, ease: "power3" });

    const move = (e: PointerEvent) => {
      const r = a.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const reach = Math.max(r.width, r.height) * 1.5;
      if (dist > reach) { x(0); y(0); gsap.to(a, { borderRadius: 999, duration: 0.5 }); return; }
      // lean toward the cursor, capped so the label stays where the eye expects it
      const k = (1 - dist / reach) * 0.26;
      x(dx * k); y(dy * k);
      gsap.to(a, { borderRadius: `${999 - k * 900}px`, duration: 0.4 });
    };
    const enter = () => {
      gsap.fromTo(shine.current, { xPercent: -130 }, { xPercent: 130, duration: 0.9, ease: "power2.inOut" });
    };
    window.addEventListener("pointermove", move, { passive: true });
    a.addEventListener("pointerenter", enter);
    return () => {
      window.removeEventListener("pointermove", move);
      a.removeEventListener("pointerenter", enter);
    };
  }, []);

  const solid = tone === "solid";
  return (
    <a ref={el} href={href} data-cursor="ORDER" style={{
      position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "1.05rem 2.4rem", borderRadius: 999, overflow: "hidden",
      background: solid ? "var(--flavor)" : "transparent",
      border: solid ? "none" : "1px solid color-mix(in srgb, var(--foam) 40%, transparent)",
      color: solid ? "#1a0f05" : "var(--foam)",
      fontSize: "0.72rem", letterSpacing: "0.2em", fontWeight: 700, textDecoration: "none",
      willChange: "transform",
    }}>
      <span ref={shine} aria-hidden style={{
        position: "absolute", inset: 0, transform: "translateX(-130%)",
        background: "linear-gradient(100deg, transparent 38%, rgba(255,255,255,0.55) 50%, transparent 62%)",
        pointerEvents: "none",
      }} />
      <span style={{ position: "relative" }}>{children}</span>
    </a>
  );
}

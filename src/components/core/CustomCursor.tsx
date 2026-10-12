"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Desktop cursor. A small dot with a little inertia, and a word when the thing under it
 * has something to say. Any element can label it with `data-cursor="TASTE"`.
 *
 * Deliberately small — an oversized cursor UI would fight the liquid for attention.
 */
export default function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.body.classList.add("has-cursor");
    const d = dot.current!, r = ring.current!, l = label.current!;
    gsap.set([d, r], { opacity: 0 });

    // dot tracks tight, ring lags — the inertia reads as weight, not lag
    const dx = gsap.quickTo(d, "x", { duration: 0.10, ease: "power3" });
    const dy = gsap.quickTo(d, "y", { duration: 0.10, ease: "power3" });
    const rx = gsap.quickTo(r, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.45, ease: "power3" });

    let shown = false;
    let current = "";

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!shown) { shown = true; gsap.to([d, r], { opacity: 1, duration: 0.3 }); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);

      const host = (e.target as HTMLElement)?.closest?.("[data-cursor]") as HTMLElement | null;
      const next = host?.dataset.cursor ?? "";
      if (next === current) return;
      current = next;
      l.textContent = next;
      gsap.to(r, {
        width: next ? 68 : 30,
        height: next ? 68 : 30,
        borderWidth: next ? 0 : 1,
        backgroundColor: next ? "var(--flavor)" : "transparent",
        duration: 0.42,
        ease: "power3.out",
      });
      gsap.to(l, { opacity: next ? 1 : 0, duration: 0.28 });
      gsap.to(d, { scale: next ? 0 : 1, duration: 0.3 });
    };

    const leave = () => { shown = false; gsap.to([d, r], { opacity: 0, duration: 0.25 }); };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);

    return () => {
      document.body.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  const base: React.CSSProperties = {
    position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 9999,
    translate: "-50% -50%", borderRadius: "999px", willChange: "transform",
  };

  return (
    <>
      <div ref={ring} aria-hidden style={{
        ...base, width: 30, height: 30,
        border: "1px solid var(--flavor)",
        display: "grid", placeItems: "center", mixBlendMode: "normal",
      }}>
        <span ref={label} style={{
          opacity: 0, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em",
          color: "var(--ink)", fontFamily: "var(--font-sans)",
        }} />
      </div>
      <div ref={dot} aria-hidden style={{ ...base, width: 5, height: 5, background: "var(--flavor)" }} />
    </>
  );
}

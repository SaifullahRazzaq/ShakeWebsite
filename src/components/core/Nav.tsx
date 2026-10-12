"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { site } from "@/shake.config";

/**
 * Minimal by instruction. Transparent over the hero, then a thin tinted bar — tinted with
 * the live flavour, not a generic frosted panel.
 *
 * Mobile: the menu is a liquid that rises from the bottom, fills the screen, and only then
 * lets the links appear. Closing drains it.
 */
export default function Nav() {
  const bar = useRef<HTMLElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const wave = useRef<SVGPathElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: "top -80",
        end: 99999,
        onUpdate: (self) => {
          const past = self.scroll() > 80;
          gsap.to(bar.current, {
            backgroundColor: past ? "color-mix(in srgb, var(--foam) 78%, transparent)" : "transparent",
            borderBottomColor: past ? "color-mix(in srgb, var(--deep) 12%, transparent)" : "transparent",
            backdropFilter: past ? "blur(14px) saturate(1.3)" : "blur(0px)",
            duration: 0.45,
          });
        },
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!sheet.current) return;
    const el = sheet.current;
    const links = el.querySelectorAll("[data-nl]");
    if (open) {
      gsap.set(el, { display: "flex" });
      gsap.fromTo(el, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: "power3.inOut" });
      // the surface sloshes as it arrives, then settles
      gsap.fromTo(wave.current,
        { attr: { d: "M0 40 C 25 8, 75 72, 100 40 L100 100 L0 100 Z" } },
        { attr: { d: "M0 44 C 25 44, 75 44, 100 44 L100 100 L0 100 Z" }, duration: 1.1, ease: "power2.out" });
      gsap.fromTo(links, { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, delay: 0.34, ease: "power2.out" });
      document.documentElement.style.overflow = "hidden";
    } else {
      gsap.to(el, {
        yPercent: 100, duration: 0.55, ease: "power3.in",
        onComplete: () => { gsap.set(el, { display: "none" }); },
      });
      document.documentElement.style.overflow = "";
    }
  }, [open]);

  return (
    <>
      <header ref={bar} style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 400,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.85rem clamp(1.1rem, 4vw, 4.5rem)",
        borderBottom: "1px solid transparent", background: "transparent",
      }}>
        <a href="#hero" style={{
          fontFamily: "var(--font-display)", fontWeight: 900, letterSpacing: "-0.02em",
          fontSize: "1rem", color: "var(--deep)", textDecoration: "none",
        }}>
          {site.brandName}
        </a>

        <nav className="nav-links" style={{ display: "flex", gap: "1.9rem" }}>
          {site.nav.map((n) => (
            <a key={n.href} href={n.href} data-cursor="" style={{
              fontSize: "0.68rem", letterSpacing: "0.18em", fontWeight: 600,
              textTransform: "uppercase", color: "var(--deep)", textDecoration: "none", opacity: 0.75,
            }}>
              {n.name}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <a href="#order" data-cursor="ORDER" style={{
            fontSize: "0.66rem", letterSpacing: "0.18em", fontWeight: 700, textTransform: "uppercase",
            color: "var(--foam)", background: "var(--deep)", padding: "0.6rem 1.1rem",
            borderRadius: 999, textDecoration: "none",
          }}>
            Order now
          </a>
          <button className="nav-burger" aria-label="Menu" aria-expanded={open}
            onClick={() => setOpen((v) => !v)} style={{
              display: "none", background: "none", border: "none", padding: "0.4rem",
              color: "var(--deep)", cursor: "pointer",
            }}>
            <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden>
              <rect y={open ? 6 : 0} width="22" height="1.6" fill="currentColor"
                    style={{ transform: open ? "rotate(45deg)" : "none", transformOrigin: "center", transition: "0.3s" }} />
              <rect y={open ? 6 : 6.2} width="22" height="1.6" fill="currentColor" opacity={open ? 0 : 1} style={{ transition: "0.2s" }} />
              <rect y={open ? 6 : 12.4} width="22" height="1.6" fill="currentColor"
                    style={{ transform: open ? "rotate(-45deg)" : "none", transformOrigin: "center", transition: "0.3s" }} />
            </svg>
          </button>
        </div>
      </header>

      {/* the liquid that rises to become the mobile menu */}
      <div ref={sheet} style={{
        position: "fixed", inset: 0, zIndex: 399, display: "none",
        flexDirection: "column", justifyContent: "center", alignItems: "flex-start",
        padding: "0 2rem", gap: "0.3rem",
      }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
        }}>
          <path ref={wave} d="M0 44 C 25 44, 75 44, 100 44 L100 100 L0 100 Z" fill="var(--flavor)" />
          <rect y="43" width="100" height="58" fill="var(--flavor)" />
        </svg>
        <div style={{ position: "relative", zIndex: 1, paddingTop: "18vh" }}>
          {site.nav.map((n) => (
            <a key={n.href} data-nl href={n.href} onClick={() => setOpen(false)} style={{
              display: "block", fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: "clamp(2.2rem, 11vw, 4rem)", lineHeight: 1.02, letterSpacing: "-0.035em",
              textTransform: "uppercase", color: "var(--deep)", textDecoration: "none",
            }}>
              {n.name}
            </a>
          ))}
          <p data-nl className="micro" style={{ marginTop: "2rem", color: "color-mix(in srgb, var(--deep) 60%, transparent)" }}>
            {site.whatsapp}
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .nav-links { display: none !important; }
          .nav-burger { display: block !important; }
        }
      `}</style>
    </>
  );
}

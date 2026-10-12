"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { flavors, flavorById, type Flavor, type FlavorPalette } from "@/shake.config";

type Ctx = {
  flavor: Flavor;
  /** Transition the whole world. Never snaps — the page repaints as one slow move. */
  setFlavor: (id: string, duration?: number) => void;
  /** Live interpolated palette, for shaders that need it every frame. */
  livePalette: () => FlavorPalette;
};

const FlavorCtx = createContext<Ctx | null>(null);
export const useFlavor = () => {
  const c = useContext(FlavorCtx);
  if (!c) throw new Error("useFlavor outside FlavorProvider");
  return c;
};

const toCss = (c: [number, number, number]) =>
  `rgb(${c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255)).join(",")})`;

export default function FlavorProvider({ children }: { children: React.ReactNode }) {
  const [flavor, setFlavorState] = useState<Flavor>(flavors[0]);

  // The palette actually on screen right now. GSAP tweens these numbers directly so a
  // flavour change is a continuous colour move, not a class swap.
  const live = useRef<FlavorPalette>({ ...flavors[0].palette });

  const writeVars = useCallback(() => {
    const r = document.documentElement.style;
    r.setProperty("--deep", toCss(live.current.deep));
    r.setProperty("--foam", toCss(live.current.foam));
    r.setProperty("--sky", toCss(live.current.sky));
  }, []);

  const setFlavor = useCallback((id: string, duration = 1.5) => {
    const next = flavorById(id);
    setFlavorState((cur) => (cur.id === next.id ? cur : next));

    const p = live.current;
    const t = next.palette;
    gsap.to(p.deep, { 0: t.deep[0], 1: t.deep[1], 2: t.deep[2], duration, ease: "power2.inOut", onUpdate: writeVars });
    gsap.to(p.surface, { 0: t.surface[0], 1: t.surface[1], 2: t.surface[2], duration, ease: "power2.inOut" });
    gsap.to(p.foam, { 0: t.foam[0], 1: t.foam[1], 2: t.foam[2], duration, ease: "power2.inOut" });
    gsap.to(p.sky, { 0: t.sky[0], 1: t.sky[1], 2: t.sky[2], duration, ease: "power2.inOut" });

    // the CSS accents follow the same curve
    gsap.to(document.documentElement, {
      "--flavor": next.color,
      "--flavor-2": next.secondaryColor,
      duration,
      ease: "power2.inOut",
    } as gsap.TweenVars);
  }, [writeVars]);

  const value = useMemo<Ctx>(
    () => ({ flavor, setFlavor, livePalette: () => live.current }),
    [flavor, setFlavor]
  );

  return <FlavorCtx.Provider value={value}>{children}</FlavorCtx.Provider>;
}

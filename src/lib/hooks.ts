"use client";
import { useEffect, useId, useState } from "react";

export const useMedia = (query: string) => {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return match;
};

export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");
export const useIsMobile = () => useMedia("(max-width: 820px)");
export const useIsTouch = () => useMedia("(hover: none)");

/**
 * Stable unique id for SVG defs — two instances of one art component must not collide.
 * `useId` is used rather than a module counter so server and client agree and the tree
 * hydrates cleanly.
 */
export const useSvgId = (prefix: string) => `${prefix}${useId().replace(/:/g, "")}`;

"use client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;
if (typeof window !== "undefined" && !registered) {
  registered = true;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  // Thick-liquid default: everything on this site decelerates like it has mass.
  gsap.defaults({ ease: "power2.out" });
}

export { gsap, ScrollTrigger };

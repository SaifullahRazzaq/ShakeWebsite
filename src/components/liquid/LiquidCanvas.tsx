"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { VERT } from "@/lib/liquid/glsl";
import { VISC } from "@/lib/liquid/viscosity";
import { addFrameJob, renderScale, shaderQuality, onQualityChange } from "@/lib/liquid/perf";
import type { FlavorPalette } from "@/shake.config";

export type LiquidHandle = {
  /** Write a uniform. Cheap enough to call every frame from a GSAP ticker. */
  set: (name: string, ...v: number[]) => void;
  setPalette: (p: FlavorPalette) => void;
  /** True once a GL context actually exists — scenes use it to decide on a CSS fallback. */
  alive: () => boolean;
};

type Props = {
  frag: string;
  palette: FlavorPalette;
  uniforms?: Record<string, number[]>;
  pointer?: boolean;
  pointerTarget?: React.RefObject<HTMLElement | null>;
  className?: string;
  style?: React.CSSProperties;
  onInit?: (h: LiquidHandle) => void;
};

/**
 * Hand the shader to the driver and walk away.
 *
 * The compile itself is asynchronous on every modern driver — what blocks is *asking*
 * about it. `getShaderParameter(COMPILE_STATUS)` stalls the main thread until the compile
 * finishes, and these shaders are big enough that the stall measured 85-130ms. On a page
 * where canvases wake as you scroll, that is a visible hitch every few seconds. So nothing
 * is queried here; the status is read later, once the driver says it is ready for free.
 */
/** Backing-store ceiling per canvas — see resize() for why this is an area, not a DPR. */
const MAX_PIXELS = 2_100_000;

const compile = (gl: WebGLRenderingContext, type: number, src: string) => {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
};

/**
 * A liquid surface, backed by a WebGL context that only exists while it is worth having.
 *
 * There are seventeen of these on the page and browsers hard-cap a document at roughly
 * sixteen live WebGL contexts — past that the oldest are silently lost and scenes render
 * blank. So the context is CREATED when the canvas comes near the viewport and DESTROYED
 * when it is well clear of it. Two margins, not one: it comes alive at 40% away and is
 * released at 150%, so scrubbing back and forth across a boundary cannot thrash it.
 *
 * Three separate things, deliberately not collapsed into one:
 *
 *   context alive   40% / 150% margins   — expensive to build, so build it early
 *   DRAWING         0% margin            — a shader offscreen costs the same as one on
 *                                          screen, and paying for four at once is what
 *                                          made the page stutter
 *   resolution      the perf governor     — fragment cost scales with pixels, nothing else
 *
 * Every uniform ever written is cached and replayed on re-init, which means a scene sets
 * its uniforms once on mount and never has to know the context went away and came back.
 */
const LiquidCanvas = forwardRef<LiquidHandle, Props>(function LiquidCanvas(
  { frag, palette, uniforms, pointer = false, pointerTarget, className, style, onInit },
  ref
) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef<{ set: (n: string, ...v: number[]) => void } | null>(null);
  /** Every uniform value written so far, replayed whenever the context is rebuilt. */
  const cache = useRef<Record<string, number[]>>({});
  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  const write = (name: string, ...v: number[]) => {
    cache.current[name] = v;
    live.current?.set(name, ...v);
  };
  const writePalette = (p: FlavorPalette) => {
    write("uDeep", ...p.deep);
    write("uSurface", ...p.surface);
    write("uFoam", ...p.foam);
    write("uSky", ...p.sky);
  };

  useImperativeHandle(ref, () => ({
    set: write,
    setPalette: writePalette,
    alive: () => !!live.current,
  }), []);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 820px)").matches;
    const dprCap = mobile ? 1.2 : 1.5;

    /** Drawing is gated on this, independently of whether the context exists. */
    let onScreen = false;
    let teardown: (() => void) | null = null;

    const start = () => {
      if (teardown) return;
      const gl = (cv.getContext("webgl2", { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "high-performance" }) ??
        cv.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true })) as WebGLRenderingContext | null;
      if (!gl) return;   // no WebGL: the CSS gradient behind the canvas carries the scene

      const vs = compile(gl, gl.VERTEX_SHADER, VERT);
      const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
      const prog = gl.createProgram()!;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);

      // Everything this context has to undo, collected as it is built — the canvas can be
      // torn down mid-compile, before most of it exists.
      const disposers: Array<() => void> = [
        () => { live.current = null; gl.getExtension("WEBGL_lose_context")?.loseContext(); },
      ];
      teardown = () => { for (let i = disposers.length - 1; i >= 0; i--) disposers[i](); };

      const parallel = gl.getExtension("KHR_parallel_shader_compile");
      const COMPLETE = parallel?.COMPLETION_STATUS_KHR;

      /** Second phase: run only once the driver has the program ready, so nothing stalls. */
      const finish = () => {
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          if (process.env.NODE_ENV !== "production") {
            console.error("[liquid]", gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(prog));
          }
          return false;
        }
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const aPos = gl.getAttribLocation(prog, "aPos");
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);   // premultiplied

        const locs = new Map<string, WebGLUniformLocation | null>();
        const set = (n: string, ...v: number[]) => {
          if (!locs.has(n)) locs.set(n, gl.getUniformLocation(prog, n));
          const l = locs.get(n)!;
          if (!l) return;
          if (v.length === 1) gl.uniform1f(l, v[0]);
          else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
          else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
          else if (v.length === 4) gl.uniform4f(l, v[0], v[1], v[2], v[3]);
        };
        setU = set;

        // defaults, then the palette, then everything the scene has ever written
        const defaults: Record<string, number[]> = {
          uLight: [0.34, 0.20, -0.92],     // low sun beyond the horizon — see skyColor()
          uAmp: [0.85], uSpeed: [VISC.waveSpeed],
          uSpecPower: [VISC.specPower], uSSS: [VISC.sss],
          uQuality: [quality()], uCalm: [1],
          uCamH: [1.6], uPitch: [-0.0989], uFov: [0.62], uCamZ: [0],
          uWaveA: [0, 0, 0, 1], uWaveB: [0, 0, 0, 1],
          uThick: [0.6], uFill: [0], uMix: [0], uOrigin: [0.5, 0.5],
        };
        for (const k in defaults) set(k, ...defaults[k]);
        const pal = paletteRef.current;
        set("uDeep", ...pal.deep); set("uSurface", ...pal.surface);
        set("uFoam", ...pal.foam); set("uSky", ...pal.sky);
        if (uniforms) for (const k in uniforms) set(k, ...uniforms[k]);
        // Anything the scene wrote while the program was still compiling was cached rather
        // than dropped, so a scene never has to know this phase existed.
        for (const k in cache.current) set(k, ...cache.current[k]);

        live.current = { set };
        onInit?.({ set: write, setPalette: writePalette, alive: () => true });

        // ── sizing ──────────────────────────────────────────────────────────────
        // Measured by a ResizeObserver, never inside the frame loop. Reading clientWidth
        // per frame per canvas forces a synchronous layout seventeen times a frame, which
        // is a stutter you can feel even when the GPU is keeping up.
        let cssW = cv.clientWidth || 1, cssH = cv.clientHeight || 1;
        const resize = () => {
          const dpr = Math.min(dprCap, window.devicePixelRatio || 1) * renderScale();
          let w = cssW * dpr, h = cssH * dpr;
          // A hard ceiling on the backing store, applied as an area rather than a DPR.
          // Fragment cost is the whole cost of a raymarched liquid, so a full-screen
          // canvas on a Retina panel was asking for four times the work of the same
          // canvas on a 1x panel to draw a surface that is soft by design. Budgeting by
          // area means one full-screen shader costs the same on every display, and small
          // canvases keep their full sharpness because they never reach the ceiling.
          const over = (w * h) / MAX_PIXELS;
          if (over > 1) { const k = Math.sqrt(1 / over); w *= k; h *= k; }
          w = Math.max(1, Math.round(w));
          h = Math.max(1, Math.round(h));
          if (cv.width !== w || cv.height !== h) {
            cv.width = w; cv.height = h;
            gl.viewport(0, 0, w, h);
            set("uRes", w, h);
          }
        };
        applySize = resize;
        resize();

        const ro = new ResizeObserver((entries) => {
          const box = entries[0]?.contentRect;
          if (!box) return;
          cssW = box.width || cssW; cssH = box.height || cssH;
          resize();
        });
        ro.observe(cv);
        disposers.push(() => ro.disconnect());
        return true;
      };

      const quality = () => (mobile || reduced ? 0 : shaderQuality());
      let setU: ((n: string, ...v: number[]) => void) | null = null;
      let applySize: (() => void) | null = null;
      let ready = false;

      // the governor changed its mind about what this page can afford
      const offQuality = onQualityChange(() => {
        applySize?.();
        setU?.("uQuality", quality());
      });
      disposers.push(offQuality);

      // Pointer with a viscosity spring: the liquid answers late and over-damped, so the
      // ripple keeps moving after the cursor has stopped. That lag is the tell that it is thick.
      const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
      let amt = 0, targetAmt = 0;
      // The pointer target's rect is cached and invalidated on scroll or resize, rather
      // than measured inside pointermove — a getBoundingClientRect there is a forced
      // layout on every single mouse move, times however many canvases are listening.
      let rect: DOMRect | null = null;
      const invalidate = () => { rect = null; };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const el = pointerTarget?.current ?? cv;
        if (!rect) rect = el.getBoundingClientRect();
        target.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        target.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        targetAmt = 1;
      };
      const onLeave = () => { targetAmt = 0; };
      if (pointer && !reduced) {
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerleave", onLeave);
        window.addEventListener("scroll", invalidate, { passive: true });
        window.addEventListener("resize", invalidate);
        disposers.push(() => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerleave", onLeave);
          window.removeEventListener("scroll", invalidate);
          window.removeEventListener("resize", invalidate);
        });
      }

      const t0 = performance.now();
      const draw = (now: number, dtMs: number) => {
        if (!ready) {
          // Poll, never block. Without the extension there is nothing to poll, so the
          // first frame after wake pays the compile — one frame, once per context.
          if (COMPLETE && !gl.getProgramParameter(prog, COMPLETE)) return;
          if (!finish()) { teardown?.(); teardown = null; return; }
          ready = true;
        }
        if (!onScreen || !setU) return;
        const set = setU;
        const dt = dtMs / 1000;
        if (pointer) {
          const k = 1 - Math.exp(-dt * (1000 / VISC.pointerLag));
          cur.x += (target.x - cur.x) * k;
          cur.y += (target.y - cur.y) * k;
          amt += (targetAmt - amt) * Math.min(1, dt * 1.6);
          set("uPointer", cur.x, cur.y);
          set("uPointerAmt", amt);
        }
        set("uTime", reduced ? (now - t0) / 4000 : (now - t0) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      const offJob = addFrameJob(draw);
      disposers.push(offJob);
    };

    const stop = () => { unschedule(); teardown?.(); teardown = null; };

    // Alive well before it is seen, released well after it is gone — the gap between the
    // two margins is what stops a scrub across the boundary from thrashing the context.
    // Creating the context is the one part that cannot be made asynchronous — getContext
    // measured ~225ms across a scroll pass. So it is taken during an idle gap instead of
    // inside the observer callback, which fires mid-scroll by definition. The 40% margin
    // is the budget that makes this affordable: there is time to wait for a quiet moment.
    let idle = 0;
    const schedule = () => {
      if (teardown || idle) return;
      const ric = window.requestIdleCallback;
      idle = ric
        ? ric(() => { idle = 0; start(); }, { timeout: 600 })
        : window.setTimeout(() => { idle = 0; start(); }, 1);
    };
    const unschedule = () => {
      if (!idle) return;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle); else clearTimeout(idle);
      idle = 0;
    };

    const wake = new IntersectionObserver(([e]) => { if (e.isIntersecting) schedule(); }, { rootMargin: "40%" });
    const sleep = new IntersectionObserver(([e]) => { if (!e.isIntersecting) stop(); }, { rootMargin: "150%" });
    // Drawing, though, stops the moment the canvas leaves the frame. Four full-screen
    // raymarchers running at once because their wake margins overlap is not a look, it
    // is a bill.
    const paint = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }, { rootMargin: "8%" });
    wake.observe(cv);
    sleep.observe(cv);
    paint.observe(cv);

    // A hidden tab should not be rendering an ocean.
    const onVis = () => { if (document.hidden) onScreen = false; };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      wake.disconnect(); sleep.disconnect(); paint.disconnect(); stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frag]);

  useEffect(() => { writePalette(palette); /* eslint-disable-next-line */ }, [palette]);

  return (
    <canvas ref={canvas} aria-hidden className={className}
            style={{ display: "block", width: "100%", height: "100%", ...style }} />
  );
});

export default LiquidCanvas;

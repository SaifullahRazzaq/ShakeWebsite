"use client";
import { gsap } from "@/lib/gsap";

/**
 * One frame clock, and a page that measures what it can afford.
 *
 * Two problems this file exists to solve:
 *
 * 1. **One rAF, not seventeen.** Every live LiquidCanvas used to own a private
 *    requestAnimationFrame loop. Browsers run those in creation order, interleaved with
 *    Lenis and ScrollTrigger's own loop, so the scroll position a shader drew against was
 *    routinely a frame older than the DOM drawn next to it. Everything now runs as a job
 *    on the GSAP ticker, after Lenis has written the scroll — scroll and liquid are
 *    always the same frame.
 *
 * 2. **Resolution is the throttle.** A raymarched ocean is pure fragment cost, so it
 *    scales exactly with pixel count. Rather than guess a device class, the page times
 *    itself and moves the render scale until frames fit the budget. A slow laptop lands
 *    softer and smooth; an M-series Mac keeps full resolution.
 */

type Job = (nowMs: number, dtMs: number) => void;

const jobs = new Set<Job>();
let attached = false;

/** Render scale ladder. 1 = the canvas's natural DPR-capped size. */
const STEPS = [1, 0.86, 0.72, 0.6, 0.5, 0.42, 0.35, 0.29];
let level = 0;

const listeners = new Set<() => void>();

/** Current global render scale. Canvases multiply their DPR by this. */
export const renderScale = () => STEPS[level];

/** 1 = full shader detail, 0.5 = medium, 0 = cheap. Follows the same governor. */
export const shaderQuality = () => (level <= 1 ? 1 : level <= 4 ? 0.5 : 0);

export const onQualityChange = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};

/**
 * Converge in well under a second, not in twelve.
 *
 * The first version judged 45-frame batches and stepped one rung at a time. On a page
 * running at 25fps that is 1.8s per batch, so it took the better part of a minute to walk
 * down to a scale that fit — and the whole point is that the visitor never sits through
 * the jank. So: short windows, and a jump proportional to how far over budget the frame
 * actually is. Coming back UP is deliberately slow and one rung at a time, because
 * resolution flapping up and down is more distracting than being slightly soft.
 */
const BUDGET = 16.7;   // the frame we are trying to fit inside
const WINDOW = 14;     // frames per judgement — about a fifth of a second when healthy
let hold = 0;
let acc = 0, frames = 0, good = 0;

const govern = (dt: number) => {
  if (hold > 0) { hold -= dt; return; }
  acc += dt; frames++;
  if (frames < WINDOW) return;
  const avg = acc / frames;
  acc = 0; frames = 0;
  const prev = level;

  if (avg > BUDGET * 1.25) {
    good = 0;
    // Two rungs at a time when we are miles over: one rung per window is too slow to
    // rescue a frame that is taking 40ms.
    level = Math.min(STEPS.length - 1, level + (avg > BUDGET * 2.0 ? 2 : 1));
  } else if (avg < BUDGET * 0.82 && level > 0) {
    // Earning quality back takes a sustained run of healthy windows — roughly two
    // seconds — because resolution flapping up and down is worse than being soft.
    if (++good >= 9) { good = 0; level--; }
  } else {
    good = 0;
  }

  if (level !== prev) { hold = 450; listeners.forEach((f) => f()); }
};

const tick = (time: number, deltaMs: number) => {
  govern(deltaMs);
  const now = time * 1000;
  const dt = Math.min(50, deltaMs);
  for (const j of jobs) j(now, dt);
};

/** Register a per-frame job. Returns the unsubscribe. */
export const addFrameJob = (j: Job) => {
  jobs.add(j);
  if (!attached) { attached = true; gsap.ticker.add(tick); }
  return () => { jobs.delete(j); };
};

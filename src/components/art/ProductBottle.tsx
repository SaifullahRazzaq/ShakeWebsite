"use client";
import { useSvgId } from "@/lib/hooks";
import type { Flavor } from "@/shake.config";
import { site } from "@/shake.config";

const rgb = (c: [number, number, number], m = 1) =>
  `rgb(${c.map((v) => Math.round(Math.min(1, v * m) * 255)).join(",")})`;
const mixc = (a: [number, number, number], b: [number, number, number], t: number) =>
  rgb([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);

/**
 * PLACEHOLDER ART — vector stand-in for product photography.
 * The moment `flavor.bottle` points at a real transparent WebP this component renders the
 * photograph instead, with identical props and identical layout. See ASSET_REQUIREMENTS.md.
 *
 * Lighting follows a commercial set-up, not a flat fill: one large softbox camera-left
 * (the broad vertical wash), a black flag camera-right reading as a hard bright rim, and
 * the liquid glowing through the glass from inside.
 */
export default function ProductBottle({
  flavor,
  /** 0..1 — how full. The pour and dive scenes drive this. */
  level = 0.78,
  condensation = true,
  className,
  style,
}: {
  flavor: Flavor;
  level?: number;
  condensation?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useSvgId("btl");
  const { palette } = flavor;

  if (flavor.bottle) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={flavor.bottle} alt={`${flavor.name} shake bottle`} className={className} style={style} />;
  }

  const BODY_TOP = 150, BODY_BOT = 698;
  const liquidY = BODY_TOP + (1 - level) * (BODY_BOT - BODY_TOP);

  const shell =
    "M118 62 L118 118 C118 146 42 154 40 218 L40 650 C40 686 62 702 96 702 L204 702 C238 702 260 686 260 650 L260 218 C258 154 182 146 182 118 L182 62 Z";

  return (
    <svg viewBox="0 0 300 760" className={className} style={style} data-cursor="VIEW"
         role="img" aria-label={`${flavor.name} shake bottle`}>
      <defs>
        {/* the liquid seen through glass: dense at the base, lit at the meniscus */}
        <linearGradient id={`${id}-liq`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mixc(palette.surface, palette.foam, 0.55)} />
          <stop offset="0.16" stopColor={rgb(palette.surface, 1.06)} />
          <stop offset="0.62" stopColor={rgb(palette.surface, 0.94)} />
          <stop offset="1" stopColor={rgb(palette.surface, 0.66)} />
        </linearGradient>
        {/* softbox camera-left */}
        <linearGradient id={`${id}-key`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.14" stopColor="#fff" stopOpacity="0.26" />
          <stop offset="0.30" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* hard rim camera-right */}
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.78" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.94" stopColor="#fff" stopOpacity="0.44" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.16" />
        </linearGradient>
        {/* light bouncing up off the ocean into the base */}
        <linearGradient id={`${id}-bounce`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={rgb(palette.foam)} stopOpacity="0.20" />
          <stop offset="0.35" stopColor={rgb(palette.surface)} stopOpacity="0.06" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-cap`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a2118" />
          <stop offset="0.18" stopColor="#6b5a48" />
          <stop offset="0.45" stopColor="#3a2e23" />
          <stop offset="0.88" stopColor="#8d7a64" />
          <stop offset="1" stopColor="#2a2118" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.72" r="0.6">
          <stop offset="0" stopColor={rgb(palette.surface)} stopOpacity="0.42" />
          <stop offset="1" stopColor={rgb(palette.surface)} stopOpacity="0" />
        </radialGradient>

        <clipPath id={`${id}-clip`}><path d={shell} /></clipPath>

        {/* condensation: bumpy alpha, used to scatter beads over the cold glass */}
        <filter id={`${id}-bead`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>

      {/* the liquid's own glow spilling past the glass */}
      <ellipse cx="150" cy="570" rx="140" ry="190" fill={`url(#${id}-glow)`} opacity="0.7" />

      <g clipPath={`url(#${id}-clip)`}>
        {/* glass body — tinted, never fully transparent, so it holds shape against the ocean */}
        <path d={shell} fill={rgb(palette.surface, 0.9)} opacity="0.16" />
        {/* the shake inside */}
        <rect x="0" y={liquidY} width="300" height={760 - liquidY} fill={`url(#${id}-liq)`} />
        {/* meniscus: thick liquid climbs the glass and holds a bright lip */}
        <ellipse cx="150" cy={liquidY} rx="112" ry="13" fill={rgb(palette.foam)} opacity="0.55" />
        <ellipse cx="150" cy={liquidY + 5} rx="112" ry="11" fill={rgb(palette.surface, 1.12)} opacity="0.85" />
        {/* settled cream at the very top of the body */}
        <rect x="0" y={liquidY - 26} width="300" height="26" fill={rgb(palette.foam)} opacity="0.14" />

        <rect x="0" y={liquidY} width="30" height={760 - liquidY} fill={rgb(palette.deep)} opacity="0.16" />
        <rect x="270" y={liquidY} width="30" height={760 - liquidY} fill={rgb(palette.deep)} opacity="0.12" />
        <path d={shell} fill={`url(#${id}-bounce)`} />
        <path d={shell} fill={`url(#${id}-key)`} />
        <path d={shell} fill={`url(#${id}-rim)`} />

        {condensation && (
          <g filter={`url(#${id}-bead)`}>
            {BEADS.map(([cx, cy, r], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill="#fff" opacity={0.13 + (i % 4) * 0.045} />
                <circle cx={cx - r * 0.3} cy={cy - r * 0.34} r={r * 0.34} fill="#fff" opacity="0.55" />
              </g>
            ))}
            {/* a few beads that have run, leaving a trail */}
            {RUNS.map(([x, y, h], i) => (
              <rect key={i} x={x} y={y} width="1.6" height={h} rx="0.8" fill="#fff" opacity="0.16" />
            ))}
          </g>
        )}
      </g>

      {/* glass edge */}
      <path d={shell} fill="none" stroke="#fff" strokeOpacity="0.30" strokeWidth="1.4" />
      <path d={shell} fill="none" stroke={rgb(palette.deep)} strokeOpacity="0.28" strokeWidth="0.7" />

      {/* cap */}
      <rect x="110" y="6" width="80" height="58" rx="9" fill={`url(#${id}-cap)`} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={114 + i * 9.6} y="10" width="2.2" height="50" rx="1" fill="#000" opacity="0.22" />
      ))}
      <rect x="110" y="6" width="80" height="10" rx="5" fill="#fff" opacity="0.18" />
      <rect x="114" y="62" width="72" height="7" rx="3" fill="#1d1710" opacity="0.85" />

      {/* label — paper, slightly curved by the shading on either edge */}
      <g>
        <rect x="52" y="338" width="196" height="236" rx="6" fill={rgb(palette.foam, 1.04)} />
        <rect x="52" y="338" width="196" height="236" rx="6" fill={`url(#${id}-key)`} opacity="0.5" />
        <rect x="52" y="338" width="14" height="236" fill={rgb(palette.deep)} opacity="0.16" />
        <rect x="234" y="338" width="14" height="236" fill={rgb(palette.deep)} opacity="0.12" />
        <text x="150" y="376" textAnchor="middle" fill={rgb(palette.deep, 0.9)}
              style={{ font: "700 11px var(--font-sans)", letterSpacing: "0.34em" }}>
          {site.brandName}
        </text>
        <line x1="76" y1="390" x2="224" y2="390" stroke={rgb(palette.deep)} strokeOpacity="0.3" strokeWidth="0.8" />
        <text x="150" y="452" textAnchor="middle" fill={rgb(palette.deep, 0.75)}
              style={{ font: `900 ${flavor.name.length > 9 ? 26 : 40}px var(--font-display)`, letterSpacing: "-0.03em" }}>
          {flavor.name.toUpperCase()}
        </text>
        <text x="150" y="492" textAnchor="middle" fill={rgb(palette.deep, 1.1)}
              style={{ font: "600 9px var(--font-sans)", letterSpacing: "0.3em" }}>
          SHAKE · NO WATER
        </text>
        <circle cx="150" cy="528" r="15" fill="none" stroke={rgb(palette.deep)} strokeOpacity="0.45" strokeWidth="0.9" />
        <text x="150" y="532" textAnchor="middle" fill={rgb(palette.deep, 0.9)}
              style={{ font: "700 9px var(--font-sans)", letterSpacing: "0.02em" }}>
          250
        </text>
        <text x="150" y="556" textAnchor="middle" fill={rgb(palette.deep, 0.8)}
              style={{ font: "600 7px var(--font-sans)", letterSpacing: "0.28em" }}>
          MILLILITRES
        </text>
      </g>
    </svg>
  );
}

/** Bead placement is fixed, not random — a stable composition beats noise. */
const BEADS: [number, number, number][] = [
  [66, 238, 3.4], [88, 300, 2.2], [58, 372, 4.1], [74, 448, 2.6], [62, 520, 3.0],
  [84, 596, 3.6], [70, 654, 2.2], [104, 214, 2.0], [120, 268, 1.6], [96, 342, 1.8],
  [232, 232, 3.8], [244, 306, 2.4], [226, 388, 3.2], [240, 466, 2.0], [230, 548, 3.5],
  [244, 620, 2.6], [214, 660, 3.0], [206, 196, 2.2], [252, 396, 1.7], [218, 300, 1.9],
  [150, 190, 2.4], [172, 226, 1.8], [132, 246, 1.5], [192, 630, 2.1], [118, 672, 2.4],
];
const RUNS: [number, number, number][] = [
  [66, 242, 26], [232, 236, 34], [58, 376, 18], [240, 470, 22], [84, 600, 15],
];

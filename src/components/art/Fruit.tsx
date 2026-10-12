"use client";
import { useSvgId } from "@/lib/hooks";

/**
 * PLACEHOLDER ART — see ASSET_REQUIREMENTS.md, Priority 3.
 * Studio-lit fruit cutouts would replace these. Until then: real form, real shading,
 * one key light from upper-left matching the ocean's light direction.
 */

export function MangoCube({ size = 90, rot = 0, style }: { size?: number; rot?: number; style?: React.CSSProperties }) {
  const id = useSvgId("mc");
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ transform: `rotate(${rot}deg)`, ...style }} aria-hidden>
      <defs>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd469" /><stop offset="1" stopColor="#ffab21" />
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f39412" /><stop offset="1" stopColor="#d76f06" />
        </linearGradient>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb93c" /><stop offset="1" stopColor="#e07f08" />
        </linearGradient>
      </defs>
      {/* an isometric cube of cut fruit: top face lit, two sides falling away */}
      <path d="M50 8 L88 28 L50 48 L12 28 Z" fill={`url(#${id}-t)`} />
      <path d="M12 28 L50 48 L50 90 L12 70 Z" fill={`url(#${id}-l)`} />
      <path d="M88 28 L50 48 L50 90 L88 70 Z" fill={`url(#${id}-r)`} />
      {/* wet highlight — cut fruit is glossy */}
      <path d="M50 12 L80 28 L50 44 L20 28 Z" fill="#fff" opacity="0.26" />
      <path d="M16 32 L26 37 L26 66 L16 61 Z" fill="#fff" opacity="0.13" />
      <path d="M50 48 L88 28 L88 32 L50 52 Z" fill="#fff" opacity="0.18" />
    </svg>
  );
}

export function MangoSlice({ size = 150, rot = 0, style }: { size?: number; rot?: number; style?: React.CSSProperties }) {
  const id = useSvgId("ms");
  return (
    <svg viewBox="0 0 200 140" width={size} height={size * 0.7} style={{ transform: `rotate(${rot}deg)`, ...style }} aria-hidden>
      <defs>
        <radialGradient id={`${id}-f`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#ffe08a" /><stop offset="0.55" stopColor="#ffb62f" />
          <stop offset="1" stopColor="#f08a08" />
        </radialGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9c14" /><stop offset="1" stopColor="#c45f02" />
        </linearGradient>
      </defs>
      <path d="M14 74 C14 28 62 4 112 6 C162 8 192 40 186 74 C180 108 140 134 96 132 C50 130 14 112 14 74 Z" fill={`url(#${id}-s)`} />
      <path d="M22 72 C22 32 66 12 112 14 C158 16 184 44 178 74 C172 104 136 126 96 124 C54 122 22 106 22 72 Z" fill={`url(#${id}-f)`} />
      {/* the hatch a chef scores into a mango cheek */}
      <g stroke="#e08205" strokeOpacity="0.35" strokeWidth="1.6" fill="none">
        <path d="M52 28 L78 118 M84 18 L104 124 M116 16 L128 124 M148 24 L150 116" />
        <path d="M28 54 L176 46 M26 78 L180 72 M34 102 L170 98" />
      </g>
      <ellipse cx="74" cy="44" rx="34" ry="20" fill="#fff" opacity="0.30" transform="rotate(-18 74 44)" />
    </svg>
  );
}

export function Strawberry({ size = 110, rot = 0, style }: { size?: number; rot?: number; style?: React.CSSProperties }) {
  const id = useSvgId("sb");
  return (
    <svg viewBox="0 0 120 150" width={size} height={size * 1.25} style={{ transform: `rotate(${rot}deg)`, ...style }} aria-hidden>
      <defs>
        <radialGradient id={`${id}-b`} cx="0.34" cy="0.26" r="0.85">
          <stop offset="0" stopColor="#ff6b7f" /><stop offset="0.5" stopColor="#e4213f" />
          <stop offset="1" stopColor="#9e0c24" />
        </radialGradient>
      </defs>
      <path d="M60 148 C22 120 10 84 14 58 C18 32 36 20 60 20 C84 20 102 32 106 58 C110 84 98 120 60 148 Z" fill={`url(#${id}-b)`} />
      <g fill="#ffdf8d" opacity="0.8">
        {[[38,52],[60,44],[82,52],[30,76],[52,70],[74,70],[94,78],[40,98],[62,94],[84,98],[52,120],[70,118]].map(([x,y],i)=>(
          <ellipse key={i} cx={x} cy={y} rx="2.6" ry="3.6" transform={`rotate(${(i*37)%60-30} ${x} ${y})`} />
        ))}
      </g>
      <path d="M60 20 L44 6 L52 20 L34 14 L46 26 L60 22 L74 26 L86 14 L68 20 L76 6 Z" fill="#4f8a35" />
      <ellipse cx="40" cy="50" rx="14" ry="20" fill="#fff" opacity="0.24" transform="rotate(-24 40 50)" />
    </svg>
  );
}

export function Banana({ size = 150, rot = 0, style }: { size?: number; rot?: number; style?: React.CSSProperties }) {
  const id = useSvgId("bn");
  return (
    <svg viewBox="0 0 180 120" width={size} height={size * 0.66} style={{ transform: `rotate(${rot}deg)`, ...style }} aria-hidden>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe886" /><stop offset="0.6" stopColor="#f5cc3c" />
          <stop offset="1" stopColor="#c99a12" />
        </linearGradient>
      </defs>
      <path d="M18 30 C22 82 70 112 128 108 C158 106 170 92 168 80 C166 70 152 72 140 78 C104 96 60 76 46 34 C42 22 20 18 18 30 Z" fill={`url(#${id}-b)`} />
      <path d="M26 34 C32 78 74 104 126 100" stroke="#fff" strokeOpacity="0.35" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Pistachio({ size = 80, rot = 0, style }: { size?: number; rot?: number; style?: React.CSSProperties }) {
  const id = useSvgId("pt");
  return (
    <svg viewBox="0 0 100 90" width={size} height={size * 0.9} style={{ transform: `rotate(${rot}deg)`, ...style }} aria-hidden>
      <defs>
        <radialGradient id={`${id}-g`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#cfe08e" /><stop offset="1" stopColor="#8aa057" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="46" rx="38" ry="32" fill={`url(#${id}-g)`} />
      <ellipse cx="44" cy="40" rx="26" ry="22" fill="#c6d894" />
      <path d="M50 16 C34 26 34 66 50 76" stroke="#7b9152" strokeWidth="2.5" fill="none" />
      <ellipse cx="38" cy="34" rx="10" ry="7" fill="#fff" opacity="0.3" />
    </svg>
  );
}

export function IceCube({ size = 70, rot = 0, style }: { size?: number; rot?: number; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ transform: `rotate(${rot}deg)`, ...style }} aria-hidden>
      <path d="M50 6 L90 28 L50 50 L10 28 Z" fill="#fff" opacity="0.55" />
      <path d="M10 28 L50 50 L50 94 L10 72 Z" fill="#fff" opacity="0.30" />
      <path d="M90 28 L50 50 L50 94 L90 72 Z" fill="#fff" opacity="0.40" />
      <path d="M50 6 L90 28 L50 50 L10 28 Z" fill="none" stroke="#fff" strokeOpacity="0.7" />
    </svg>
  );
}

"use client";

const WAVE_PATH =
  "M 0 0 C 40 0, 85 -67, 125 -67 C 165 -67, 210 0, 250 0 C 290 0, 335 67, 375 67 C 415 67, 460 0, 500 0 C 540 0, 585 -67, 625 -67 C 665 -67, 710 0, 750 0 C 790 0, 835 67, 875 67 C 915 67, 960 0, 1000 0";

const WAVES = [
  {
    d: WAVE_PATH,
    position: "top-[15%]",
    className:
      "text-zinc-400/30 animate-[line-wave-1_14s_linear_infinite] dark:text-zinc-300/20",
  },
  {
    d: WAVE_PATH,
    position: "top-[45%]",
    className:
      "text-zinc-500/25 animate-[line-wave-2_10s_linear_infinite] dark:text-zinc-400/15",
  },
  {
    d: WAVE_PATH,
    position: "top-[75%]",
    className:
      "text-zinc-400/20 animate-[line-wave-3_18s_linear_infinite_reverse] dark:text-zinc-300/10",
  },
];

export function LineWaves({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {WAVES.map((wave, i) => (
        <svg
          key={i}
          className={`absolute left-0 h-[35%] w-[200%] ${wave.position} ${wave.className}`}
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d={wave.d}
            stroke="currentColor"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ))}
    </div>
  );
}

"use client";

export function ShinyText({
  text,
  className = "",
  streakWidth = 40,
  shimmerWidth = 100,
}: {
  text: string;
  className?: string;
  streakWidth?: number;
  shimmerWidth?: number;
}) {
  return (
    <span
      className={className}
      style={{
        backgroundImage:
          `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) ${shimmerWidth}%, transparent 100%), ` +
          "linear-gradient(90deg, currentColor, currentColor)",
        backgroundSize: `${streakWidth}px 100%, 100% 100%`,
        backgroundRepeat: "no-repeat",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: "shimmer-sweep 3s ease-out 1",
      }}
    >
      {text}
    </span>
  );
}

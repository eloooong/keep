"use client";

export function GradientText({
  children,
  className = "",
  colors = ["#6366f1", "#8b5cf6", "#60a5fa"],
  animationSpeed = 6,
}: {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
}) {
  const backgroundImage = `linear-gradient(90deg, ${colors.join(", ")}, ${colors[0]})`;

  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage,
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        animation: `gradient-shift ${animationSpeed}s ease-in-out infinite`,
      }}
    >
      {children}
    </span>
  );
}

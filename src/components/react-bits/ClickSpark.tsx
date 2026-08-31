"use client";

import { type ReactNode, useCallback, useRef, useState } from "react";

type Spark = {
  id: number;
  x: number;
  y: number;
  angle: number;
  size: number;
};

export function ClickSpark({
  children,
  className = "",
  sparkColor = "currentColor",
  sparkCount = 6,
  sparkRadius = 16,
  duration = 400,
}: {
  children: ReactNode;
  className?: string;
  sparkColor?: string;
  sparkCount?: number;
  sparkRadius?: number;
  duration?: number;
}) {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const counterRef = useRef(0);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newSparks: Spark[] = Array.from({ length: sparkCount }, (_, i) => {
        counterRef.current += 1;
        return {
          id: counterRef.current,
          x,
          y,
          angle: (360 / sparkCount) * i + Math.random() * 20 - 10,
          size: 3 + Math.random() * 3,
        };
      });

      setSparks(newSparks);
      setTimeout(() => setSparks([]), duration);
    },
    [sparkCount, duration]
  );

  return (
    <div className={`relative inline-flex ${className}`} onClick={handleClick}>
      {children}
      {sparks.length > 0 && (
        <span className="pointer-events-none absolute inset-0" aria-hidden="true">
          {sparks.map((spark) => (
            <span
              key={spark.id}
              className="absolute rounded-full"
              style={
                {
                  left: spark.x,
                  top: spark.y,
                  "--spark-angle": `${spark.angle}deg`,
                  "--spark-radius": `${sparkRadius}px`,
                  width: spark.size,
                  height: spark.size,
                  backgroundColor: sparkColor,
                  animation: `click-spark-fade ${duration / 1000}s ease-out forwards`,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      )}
    </div>
  );
}

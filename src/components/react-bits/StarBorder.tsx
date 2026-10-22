"use client";

// React Bits StarBorder, d50d8117: neutral frame, explicit pause, no button wrapper.
// See README.md and LICENSE.react-bits-2025.md.
import type { ReactNode } from "react";

export function StarBorder({
  children,
  paused = false,
  className = "",
}: {
  children: ReactNode;
  paused?: boolean;
  className?: string;
}) {
  return (
    <div className={`star-border ${className}`} data-paused={paused}>
      <span className="star-border-bottom" aria-hidden="true" />
      <span className="star-border-top" aria-hidden="true" />
      <div className="star-border-content">{children}</div>
    </div>
  );
}

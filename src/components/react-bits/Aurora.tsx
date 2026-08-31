"use client";

export function Aurora({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute -left-1/4 -top-1/4 h-[150%] w-[150%] animate-[aurora_12s_ease-in-out_infinite] opacity-20 dark:opacity-15"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(120,119,198,0.4) 0%, transparent 50%), " +
              "radial-gradient(ellipse at 80% 20%, rgba(74,144,226,0.3) 0%, transparent 50%), " +
              "radial-gradient(ellipse at 40% 80%, rgba(131,58,180,0.25) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute -right-1/4 -bottom-1/4 h-[150%] w-[150%] animate-[aurora_15s_ease-in-out_infinite_reverse] opacity-15 dark:opacity-10"
          style={{
            background:
              "radial-gradient(ellipse at 80% 50%, rgba(131,58,180,0.35) 0%, transparent 50%), " +
              "radial-gradient(ellipse at 20% 80%, rgba(74,144,226,0.3) 0%, transparent 50%), " +
              "radial-gradient(ellipse at 60% 20%, rgba(120,119,198,0.25) 0%, transparent 50%)",
          }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

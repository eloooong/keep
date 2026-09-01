import { type ReactNode } from "react";

export function IconButton({
  icon,
  ariaLabel,
  title,
  onClick,
  disabled,
  variant = "default",
  type = "button",
  className = "",
}: {
  icon: ReactNode;
  ariaLabel: string;
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
  type?: "button" | "submit";
  className?: string;
}) {
  const danger = variant === "danger";
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors disabled:opacity-50 ${
        danger
          ? "border-black/[.08] text-red-600 hover:bg-red-50 dark:border-white/[.15] dark:text-red-400 dark:hover:bg-red-950"
          : "border-black/[.08] text-zinc-600 hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-300 dark:hover:bg-zinc-800"
      } ${className}`}
    >
      {icon}
    </button>
  );
}

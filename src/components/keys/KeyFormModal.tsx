"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatedContent } from "@/components/react-bits/AnimatedContent";

export function KeyFormModal({
  open,
  onClose,
  titleId,
  children,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open && triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <AnimatedContent className="relative z-10 w-full max-w-lg px-4">
        <div
          ref={panelRef}
          tabIndex={-1}
          className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-xl dark:border-white/[.1] dark:bg-zinc-900 outline-none"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2
              id={titleId}
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Add a key
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          {children}
        </div>
      </AnimatedContent>
    </div>,
    document.body,
  );
}

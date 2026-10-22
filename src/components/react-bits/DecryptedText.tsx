"use client";

// React Bits DecryptedText, reduced to a one-shot sequential reveal.
// Adapted from d50d8117; see README.md and LICENSE.react-bits-2025.md.
import { useEffect, useRef } from "react";

export function DecryptedText({
  text,
  paused = false,
}: {
  text: string;
  paused?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const played = useRef<string | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const glyphs = root.querySelectorAll<HTMLElement>(".decrypt-glyph");
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let timer: ReturnType<typeof setInterval> | undefined;
    let started = false;
    const finish = () => {
      clearInterval(timer);
      glyphs.forEach((glyph, i) => {
        glyph.textContent = text[i];
      });
      root.dataset.scrambling = "false";
    };
    if (paused || media.matches || played.current === text) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      played.current = text;
      const start = performance.now();
      root.dataset.scrambling = "true";
      timer = setInterval(() => {
        const iteration = Math.min(18, (performance.now() - start) / 36);
        const revealed = Math.floor((iteration / 18) * text.length);
        glyphs.forEach((glyph, i) => {
          glyph.textContent =
            i < revealed || text[i] === " "
              ? text[i]
              : characters[Math.floor(Math.random() * characters.length)];
        });
        if (iteration >= 18) finish();
      }, 36);
    });
    observer.observe(root);
    const reduce = () => {
      if (media.matches) finish();
    };
    const hidden = () => {
      if (document.hidden) finish();
    };
    media.addEventListener("change", reduce);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      finish();
      observer.disconnect();
      media.removeEventListener("change", reduce);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [text, paused]);

  return (
    <span ref={ref} className="decrypted-text">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split("").map((character, i) => (
          <span key={i} className="decrypt-cell">
            <span className="decrypt-spacer">{character}</span>
            <span className="decrypt-glyph">{character}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

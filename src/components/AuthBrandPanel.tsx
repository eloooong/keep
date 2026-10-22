"use client";

import Link from "next/link";
import { useRef } from "react";
import { useInView } from "motion/react";
import { useReducedMotion } from "@/components/react-bits/useReducedMotion";
import { KeepLogo } from "@/components/brand/KeepLogo";
import { Glyph } from "@/components/ui/Glyph";
import { Threads } from "@/components/react-bits/Threads";
import { DecryptedText } from "@/components/react-bits/DecryptedText";
import { SpotlightCard } from "@/components/react-bits/SpotlightCard";
import { StarBorder } from "@/components/react-bits/StarBorder";

export function AuthBrandPanel() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.1 });
  const reduce = useReducedMotion();
  const stopped = reduce || !inView;

  return (
    <aside
      ref={ref}
      className="auth-aside"
      data-effects={stopped ? "paused" : "running"}
    >
      <Threads paused={stopped} />
      <Link className="wordmark" href="/login" aria-label="Keep home">
        <KeepLogo />
      </Link>
      <div className="auth-copy">
        <h1>
          <DecryptedText text="A little order." paused={stopped} />
          <span className="auth-title-secondary">
            For everything
            <br />
            you’re building.
          </span>
        </h1>
        <p>
          Keep your API keys in one place, ready for the project that needs
          them.
        </p>
        <div
          className="auth-key-preview"
          aria-label="Illustrative preview of a hidden API key"
        >
          <StarBorder paused={stopped}>
            <SpotlightCard
              disabled={stopped}
              className="auth-preview-card"
              spotlightColor="rgba(255,255,255,0.16)"
            >
              <div className="auth-preview-heading">
                <span className="auth-preview-icon">
                  <Glyph name="keys" size={23} />
                </span>
                <span>
                  Your next project<small>API key</small>
                </span>
                <Glyph name="lock" size={17} />
              </div>
              <div className="auth-preview-value">
                <code>•••• •••• •••• ••••</code>
                <span>Hidden by default</span>
              </div>
              <p className="auth-preview-caption">Illustrative preview</p>
            </SpotlightCard>
          </StarBorder>
        </div>
        <ul className="auth-features">
          <li>
            <Glyph name="lock" />
            Encrypted before they reach storage.
          </li>
          <li>
            <Glyph name="share" />
            Share access with the right people.
          </li>
          <li>
            <Glyph name="activity" />
            Stay on top of expiry and activity.
          </li>
        </ul>
      </div>
      <footer>Your keys. Your workspace.</footer>
    </aside>
  );
}

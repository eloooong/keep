"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import { AddKeyButton } from "./AddKeyButton";
import { KeyCount } from "./KeyCount";
import { Glyph } from "@/components/ui/Glyph";
import { Threads } from "@/components/react-bits/Threads";
import { StarBorder } from "@/components/react-bits/StarBorder";
import { SpotlightCard } from "@/components/react-bits/SpotlightCard";
import { DecryptedText } from "@/components/react-bits/DecryptedText";
import { useReducedMotion } from "@/components/react-bits/useReducedMotion";

export function VaultHeader({
  total,
  categories,
  attention,
}: {
  total: number;
  categories: number;
  attention: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.1 });
  const reduce = useReducedMotion();
  const stopped = reduce || !visible;

  return (
    <div ref={ref} className="vault-header">
      <StarBorder paused={stopped}>
        <SpotlightCard
          className="vault-header-surface"
          disabled={stopped}
          spotlightColor="rgba(255,255,255,0.07)"
        >
          <Threads paused={stopped} />
          <div className="vault-header-top">
            <h1>
              <DecryptedText text="API keys" paused={stopped} />
            </h1>
            <AddKeyButton />
          </div>
          <p className="page-description">
            A home for the keys that keep your projects running.
          </p>
          <div className="vault-summary" aria-label="Vault overview">
            <div>
              <strong>
                <KeyCount value={total} />
              </strong>
              <span>Total keys</span>
            </div>
            <div>
              <strong>
                <KeyCount value={categories} />
              </strong>
              <span>Categories</span>
            </div>
            <div className={attention ? "needs-attention" : ""}>
              <strong>
                <KeyCount value={attention} />
              </strong>
              <span>Need attention</span>
            </div>
            <p>
              <Glyph name="lock" size={14} />
              Encrypted at rest
            </p>
          </div>
        </SpotlightCard>
      </StarBorder>
    </div>
  );
}

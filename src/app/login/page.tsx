"use client";

import { SplitText } from "@/components/react-bits/SplitText";
import { GradientWaves } from "@/components/react-bits/GradientWaves";
import { ShinyText } from "@/components/react-bits/ShinyText";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LockIcon,
  Share01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { LoginCard } from "./login-card";

const valueProps = [
  {
    icon: LockIcon,
    title: "Encrypted storage",
    description: "Your keys are encrypted before they ever touch storage.",
  },
  {
    icon: Share01Icon,
    title: "Secure sharing",
    description: "Share access with your team without exposing secrets.",
  },
  {
    icon: Clock01Icon,
    title: "Expiry reminders",
    description: "Get notified before a key expires, every time.",
  },
];

export default function LoginPage() {
  return (
    <main className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0">
        <GradientWaves className="" />
      </div>

      <div className="relative z-10 grid w-full max-w-4xl items-center gap-12 lg:grid-cols-2">
        <div className="hidden lg:block">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            <SplitText text="Keep." delay={100} stagger={0.05} />
          </h1>
          <p className="mt-3 text-lg text-zinc-700 dark:text-zinc-300">
            <ShinyText text="Keep every API key in one safe place." />
          </p>

          <ul className="mt-8 flex flex-col gap-5">
            {valueProps.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/[.08] bg-white text-zinc-900 dark:border-white/[.1] dark:bg-zinc-900 dark:text-zinc-50">
                  <HugeiconsIcon icon={Icon} size={18} />
                </span>
                <span>
                  <span className="block font-medium text-zinc-900 dark:text-zinc-50">
                    {title}
                  </span>
                  <span className="block text-sm text-zinc-600 dark:text-zinc-400">
                    {description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <LoginCard />
      </div>
    </main>
  );
}

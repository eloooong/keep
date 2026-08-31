"use client";

import { CountUp } from "@/components/react-bits/CountUp";

export function KeyCount({ value }: { value: number }) {
  return <CountUp end={value} className="tabular-nums" />;
}

"use client";

import { parseDollarsToCents } from "@/lib/money";

interface CurrencyInputProps {
  label: string;
  cents: number;
  onChange: (cents: number) => void;
}

export function CurrencyInput({ label, cents, onChange }: CurrencyInputProps) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-foreground/60">{label}</span>
      <span className="flex items-center gap-1">
        <span className="text-foreground/40">$</span>
        <input
          value={(cents / 100).toFixed(2)}
          onChange={(e) => onChange(parseDollarsToCents(e.target.value))}
          inputMode="decimal"
          className="w-20 rounded-md border border-foreground/10 bg-background px-2 py-1 text-right"
        />
      </span>
    </label>
  );
}

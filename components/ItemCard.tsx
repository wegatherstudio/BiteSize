"use client";

import { formatCents, parseDollarsToCents } from "@/lib/money";

export interface DraftItem {
  localId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  confidence: number;
}

interface ItemCardProps {
  item: DraftItem;
  onChange: (item: DraftItem) => void;
  onRemove: () => void;
}

export function ItemCard({ item, onChange, onRemove }: ItemCardProps) {
  const lineTotalCents = item.unitPriceCents * item.quantity;
  const lowConfidence = item.confidence < 0.6;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
      {lowConfidence && (
        <span
          title="Low OCR confidence — please double-check"
          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500"
        />
      )}
      <div className="flex flex-1 flex-col gap-2">
        <input
          value={item.name}
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          placeholder="Item name"
          className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium focus:border-foreground/20 focus:bg-background focus:outline-none"
        />
        <div className="flex items-center gap-2 text-xs text-foreground/50">
          <span>Qty</span>
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) =>
              onChange({ ...item, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })
            }
            className="w-12 rounded-md border border-foreground/10 bg-background px-1 py-0.5 text-center"
          />
          <span>×</span>
          <input
            value={(item.unitPriceCents / 100).toFixed(2)}
            onChange={(e) =>
              onChange({ ...item, unitPriceCents: parseDollarsToCents(e.target.value) })
            }
            inputMode="decimal"
            className="w-16 rounded-md border border-foreground/10 bg-background px-1 py-0.5 text-center"
          />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="text-sm font-semibold">{formatCents(lineTotalCents)}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-foreground/40 hover:text-red-500"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

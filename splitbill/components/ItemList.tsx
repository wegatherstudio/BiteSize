"use client";

import { ItemCard, type DraftItem } from "@/components/ItemCard";

interface ItemListProps {
  items: DraftItem[];
  onChange: (items: DraftItem[]) => void;
}

export function ItemList({ items, onChange }: ItemListProps) {
  function updateItem(localId: string, next: DraftItem) {
    onChange(items.map((item) => (item.localId === localId ? next : item)));
  }

  function removeItem(localId: string) {
    onChange(items.filter((item) => item.localId !== localId));
  }

  function addItem() {
    onChange([
      ...items,
      {
        localId: crypto.randomUUID(),
        name: "",
        quantity: 1,
        unitPriceCents: 0,
        confidence: 1,
      },
    ]);
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {items.length === 0 && (
        <p className="rounded-xl border border-dashed border-foreground/15 p-4 text-center text-sm text-foreground/50">
          No items yet — add one below.
        </p>
      )}
      {items.map((item) => (
        <ItemCard
          key={item.localId}
          item={item}
          onChange={(next) => updateItem(item.localId, next)}
          onRemove={() => removeItem(item.localId)}
        />
      ))}
      <button
        type="button"
        onClick={addItem}
        className="mt-1 rounded-xl border border-dashed border-foreground/20 py-3 text-sm font-medium text-foreground/60 active:bg-foreground/5"
      >
        + Add item
      </button>
    </div>
  );
}

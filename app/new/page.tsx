"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptUploader } from "@/components/ReceiptUploader";
import { ItemList } from "@/components/ItemList";
import { CurrencyInput } from "@/components/CurrencyInput";
import type { DraftItem } from "@/components/ItemCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createSession, newSessionId } from "@/lib/session";
import { uploadReceiptImage } from "@/lib/receiptStorage";
import { formatCents } from "@/lib/money";
import type { ParsedReceipt } from "@/lib/types";

type Stage = "upload" | "reviewing" | "creating";

export default function NewSessionPage() {
  const router = useRouter();
  const { uid } = useCurrentUser();

  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [averageConfidence, setAverageConfidence] = useState<number | null>(null);

  const [payerName, setPayerName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [taxCents, setTaxCents] = useState(0);
  const [serviceChargeCents, setServiceChargeCents] = useState(0);
  const [tipCents, setTipCents] = useState(0);
  const [discountCents, setDiscountCents] = useState(0);
  const [receiptTotalOverrideCents, setReceiptTotalOverrideCents] = useState<number | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const subtotalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0),
    [items],
  );
  const computedTotalCents =
    subtotalCents + taxCents + serviceChargeCents + tipCents - discountCents;
  const receiptTotalCents = receiptTotalOverrideCents ?? computedTotalCents;
  const totalMismatch = receiptTotalCents !== computedTotalCents;

  async function handleFileSelected(selected: File) {
    setFile(selected);
    setOcrError(null);
    setOcrLoading(true);
    setStage("reviewing");

    try {
      const formData = new FormData();
      formData.append("image", selected);
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const parsed: ParsedReceipt | { error: string } = await res.json();

      if (!res.ok || "error" in parsed) {
        setOcrError(
          "We couldn't read that receipt automatically. Add the items below manually.",
        );
        return;
      }

      if (parsed.lines.length === 0) {
        setOcrError(
          "We couldn't find any line items on that receipt. Add them below manually.",
        );
      }

      setItems(
        parsed.lines.map((line) => ({
          localId: crypto.randomUUID(),
          name: line.name,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          confidence: line.confidence,
        })),
      );
      setRawText(parsed.rawText);
      setAverageConfidence(parsed.averageConfidence);
      if (parsed.guessedRestaurantName) setRestaurantName(parsed.guessedRestaurantName);
      if (parsed.guessedTaxCents !== null) setTaxCents(parsed.guessedTaxCents);
      if (parsed.guessedTotalCents !== null) setReceiptTotalOverrideCents(parsed.guessedTotalCents);
    } catch {
      setOcrError("We couldn't read that receipt automatically. Add the items below manually.");
    } finally {
      setOcrLoading(false);
    }
  }

  async function handleCreateSession() {
    setCreateError(null);

    if (!uid) {
      setCreateError("Still setting things up — try again in a second.");
      return;
    }
    if (!payerName.trim()) {
      setCreateError("Enter your name so others know who to pay back.");
      return;
    }
    if (items.length === 0) {
      setCreateError("Add at least one item before creating the session.");
      return;
    }

    setStage("creating");
    try {
      const sessionId = newSessionId();
      const receiptImageUrl = file ? await uploadReceiptImage(sessionId, file) : null;

      await createSession({
        sessionId,
        payerAuthUid: uid,
        payerName: payerName.trim(),
        receiptImageUrl,
        restaurantName: restaurantName.trim() || null,
        currency: "USD",
        items: items.map((item) => ({
          name: item.name.trim() || "Item",
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.unitPriceCents * item.quantity,
          confidence: item.confidence,
        })),
        subtotalCents,
        taxCents,
        serviceChargeCents,
        tipCents,
        discountCents,
        receiptTotalCents,
        ocrRawText: rawText,
        ocrConfidence: averageConfidence,
      });

      router.push(`/session/${sessionId}`);
    } catch {
      setCreateError("Something went wrong creating the session. Try again.");
      setStage("reviewing");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <h1 className="text-xl font-semibold">New bill</h1>

      {stage === "upload" && <ReceiptUploader onFileSelected={handleFileSelected} />}

      {stage !== "upload" && (
        <div className="flex flex-col gap-6">
          <ReceiptUploader onFileSelected={handleFileSelected} disabled={stage === "creating"} />

          {ocrLoading && (
            <p className="text-center text-sm text-foreground/60">
              Reading your receipt…
            </p>
          )}

          {ocrError && (
            <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              {ocrError}
            </p>
          )}

          {!ocrLoading && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-foreground/60">Your name</span>
                <input
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Who's paying?"
                  className="rounded-lg border border-foreground/10 bg-background px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="text-foreground/60">Restaurant (optional)</span>
                <input
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="rounded-lg border border-foreground/10 bg-background px-3 py-2"
                />
              </label>

              <ItemList items={items} onChange={setItems} />

              <div className="flex flex-col gap-2 rounded-xl border border-foreground/10 p-4">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Subtotal</span>
                  <span>{formatCents(subtotalCents)}</span>
                </div>
                <CurrencyInput label="Tax" cents={taxCents} onChange={setTaxCents} />
                <CurrencyInput
                  label="Service charge"
                  cents={serviceChargeCents}
                  onChange={setServiceChargeCents}
                />
                <CurrencyInput label="Tip" cents={tipCents} onChange={setTipCents} />
                <CurrencyInput
                  label="Discount"
                  cents={discountCents}
                  onChange={setDiscountCents}
                />
                <div className="mt-1 border-t border-foreground/10 pt-2">
                  <CurrencyInput
                    label="Receipt total (printed)"
                    cents={receiptTotalCents}
                    onChange={setReceiptTotalOverrideCents}
                  />
                </div>
                {totalMismatch && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    That&apos;s {formatCents(Math.abs(receiptTotalCents - computedTotalCents))}{" "}
                    {receiptTotalCents > computedTotalCents ? "more" : "less"} than
                    items + tax/tip/discount add up to. Double-check the numbers above.
                  </p>
                )}
              </div>

              {createError && (
                <p className="text-sm text-red-500">{createError}</p>
              )}

              <button
                type="button"
                onClick={handleCreateSession}
                disabled={stage === "creating"}
                className="flex h-14 w-full items-center justify-center rounded-full bg-accent text-base font-medium text-accent-foreground shadow-lg shadow-accent/25 disabled:opacity-60"
              >
                {stage === "creating" ? "Creating…" : "Create Session"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

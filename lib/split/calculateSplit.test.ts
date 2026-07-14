import { describe, expect, it } from "vitest";
import { calculateSplit } from "./calculateSplit";
import type { Participant, ReceiptItem } from "@/lib/types";

function item(overrides: Partial<ReceiptItem>): ReceiptItem {
  return {
    id: overrides.id ?? "item-1",
    name: "Item",
    quantity: 1,
    unitPriceCents: 0,
    lineTotalCents: 0,
    isShared: false,
    claimedBy: [],
    sortOrder: 0,
    ocrConfidence: null,
    wasEdited: false,
    ...overrides,
  };
}

function participant(id: string, name: string): Participant {
  return { id, name, authUid: id, isPayer: false, joinedAt: 0, amountOwedCents: 0 };
}

describe("calculateSplit", () => {
  it("gives each person exactly what they claimed when there are no extra charges", () => {
    const alice = participant("alice", "Alice");
    const bob = participant("bob", "Bob");

    const result = calculateSplit({
      items: [
        item({ id: "burger", lineTotalCents: 1200, claimedBy: ["alice"] }),
        item({ id: "fries", lineTotalCents: 500, claimedBy: ["bob"] }),
      ],
      participants: [alice, bob],
      taxCents: 0,
      serviceChargeCents: 0,
      tipCents: 0,
      discountCents: 0,
      receiptTotalCents: 1700,
      payerParticipantId: "alice",
    });

    expect(result.perParticipant.find((p) => p.participantId === "alice")?.totalCents).toBe(1200);
    expect(result.perParticipant.find((p) => p.participantId === "bob")?.totalCents).toBe(500);
    expect(result.computedTotalCents).toBe(1700);
  });

  it("splits a shared item evenly, including odd cents", () => {
    const alice = participant("alice", "Alice");
    const bob = participant("bob", "Bob");
    const carol = participant("carol", "Carol");

    const result = calculateSplit({
      items: [
        item({
          id: "nachos",
          lineTotalCents: 1000,
          isShared: true,
          claimedBy: ["alice", "bob", "carol"],
        }),
      ],
      participants: [alice, bob, carol],
      taxCents: 0,
      serviceChargeCents: 0,
      tipCents: 0,
      discountCents: 0,
      receiptTotalCents: 1000,
      payerParticipantId: "alice",
    });

    const totals = result.perParticipant.map((p) => p.totalCents).sort((a, b) => a - b);
    // 1000 / 3 = 333.33 -> two people get 333, one gets 334, summing to 1000 exactly.
    expect(totals).toEqual([333, 333, 334]);
    expect(result.computedTotalCents).toBe(1000);
  });

  it("distributes tax, service charge, and tip proportionally to what each person ordered", () => {
    const alice = participant("alice", "Alice");
    const bob = participant("bob", "Bob");

    const result = calculateSplit({
      items: [
        item({ id: "steak", lineTotalCents: 3000, claimedBy: ["alice"] }),
        item({ id: "salad", lineTotalCents: 1000, claimedBy: ["bob"] }),
      ],
      participants: [alice, bob],
      taxCents: 400,
      serviceChargeCents: 200,
      tipCents: 800,
      discountCents: 0,
      receiptTotalCents: 3000 + 1000 + 400 + 200 + 800,
      payerParticipantId: "alice",
    });

    const aliceResult = result.perParticipant.find((p) => p.participantId === "alice")!;
    const bobResult = result.perParticipant.find((p) => p.participantId === "bob")!;

    // Alice ordered 75% of the subtotal, so she should carry ~75% of the extras.
    expect(aliceResult.taxShareCents).toBe(300);
    expect(bobResult.taxShareCents).toBe(100);
    expect(result.computedTotalCents).toBe(result.receiptTotalCents);
  });

  it("applies discount proportionally, reducing each person's share", () => {
    const alice = participant("alice", "Alice");
    const bob = participant("bob", "Bob");

    const result = calculateSplit({
      items: [
        item({ id: "a", lineTotalCents: 2000, claimedBy: ["alice"] }),
        item({ id: "b", lineTotalCents: 2000, claimedBy: ["bob"] }),
      ],
      participants: [alice, bob],
      taxCents: 0,
      serviceChargeCents: 0,
      tipCents: 0,
      discountCents: 400,
      receiptTotalCents: 3600,
      payerParticipantId: "alice",
    });

    expect(result.perParticipant.find((p) => p.participantId === "alice")?.totalCents).toBe(1800);
    expect(result.perParticipant.find((p) => p.participantId === "bob")?.totalCents).toBe(1800);
    expect(result.computedTotalCents).toBe(3600);
  });

  it("reconciles rounding leftovers onto the payer so the totals always sum exactly", () => {
    const alice = participant("alice", "Alice");
    const bob = participant("bob", "Bob");
    const carol = participant("carol", "Carol");

    const result = calculateSplit({
      items: [
        item({ id: "a", lineTotalCents: 999, claimedBy: ["alice"] }),
        item({ id: "b", lineTotalCents: 999, claimedBy: ["bob"] }),
        item({ id: "c", lineTotalCents: 999, claimedBy: ["carol"] }),
      ],
      participants: [alice, bob, carol],
      taxCents: 100,
      serviceChargeCents: 0,
      tipCents: 0,
      discountCents: 0,
      receiptTotalCents: 999 * 3 + 100,
      payerParticipantId: "alice",
    });

    const sum = result.perParticipant.reduce((s, p) => s + p.totalCents, 0);
    expect(sum).toBe(result.receiptTotalCents);
  });

  it("routes the cost of unclaimed items to the payer via reconciliation", () => {
    const alice = participant("alice", "Alice");
    const bob = participant("bob", "Bob");

    const result = calculateSplit({
      items: [
        item({ id: "claimed", lineTotalCents: 1000, claimedBy: ["bob"] }),
        item({ id: "unclaimed", lineTotalCents: 500, claimedBy: [] }),
      ],
      participants: [alice, bob],
      taxCents: 0,
      serviceChargeCents: 0,
      tipCents: 0,
      discountCents: 0,
      receiptTotalCents: 1500,
      payerParticipantId: "alice",
    });

    expect(result.perParticipant.find((p) => p.participantId === "bob")?.totalCents).toBe(1000);
    expect(result.perParticipant.find((p) => p.participantId === "alice")?.totalCents).toBe(500);
  });

  it("prevents double counting: a non-shared item only ever counts its first claimant", () => {
    const alice = participant("alice", "Alice");
    const bob = participant("bob", "Bob");

    const result = calculateSplit({
      items: [item({ id: "a", lineTotalCents: 1000, isShared: false, claimedBy: ["alice", "bob"] })],
      participants: [alice, bob],
      taxCents: 0,
      serviceChargeCents: 0,
      tipCents: 0,
      discountCents: 0,
      receiptTotalCents: 1000,
      payerParticipantId: "alice",
    });

    expect(result.computedTotalCents).toBe(1000);
    expect(result.perParticipant.find((p) => p.participantId === "alice")?.totalCents).toBe(1000);
    expect(result.perParticipant.find((p) => p.participantId === "bob")?.totalCents).toBe(0);
  });
});

// FILE: src/lib/schedule.ts
import type { TimeSlot } from "@/types/core";

export type ClassType = "ROUTINE" | "SWAP" | "EXTRA";

export type ClassItem = {
  timeSlot: TimeSlot;
  code: string;
  type: ClassType;
  fromCode?: string;
};

const ORDER: TimeSlot[] = [
  "10:00-11:00",
  "11:00-12:00",
  "12:00-01:00",
  "02:00-03:00",
  "03:00-04:00",
  "04:00-05:00"
];

export function applySwapsAndExtras(
  base: { timeSlot: TimeSlot; code: string }[],
  swaps: { timeSlot: string; toCode: string }[],
  extras: { timeSlot: string; code: string }[]
): ClassItem[] {
  const swapMap = new Map(swaps.map((s) => [s.timeSlot, s.toCode]));

  const out: ClassItem[] = base.map((b) => {
    const to = swapMap.get(b.timeSlot);
    if (to && to !== b.code) return { timeSlot: b.timeSlot, code: to, type: "SWAP", fromCode: b.code };
    return { timeSlot: b.timeSlot, code: b.code, type: "ROUTINE" };
  });

  for (const ex of extras) {
    out.push({ timeSlot: ex.timeSlot as TimeSlot, code: ex.code, type: "EXTRA" });
  }

  out.sort((a, b) => ORDER.indexOf(a.timeSlot) - ORDER.indexOf(b.timeSlot));
  return out;
}

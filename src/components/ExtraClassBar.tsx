// FILE: src/components/ExtraClassBar.tsx
"use client";

import { TIME_SLOTS } from "@/types/core";
import { useState } from "react";

export default function ExtraClassBar(props: {
  subjects: { code: string; name: string }[];
  extras: { timeSlot: string; code: string }[];
  onAdd: (timeSlot: string, code: string) => void;
  onRemove: (timeSlot: string, code: string) => void;
}) {
  const [timeSlot, setTimeSlot] = useState<string>(TIME_SLOTS[0]);
  const [code, setCode] = useState<string>(props.subjects[0]?.code ?? "");

  return (
    <div className="bg-white border rounded-xl p-3 shadow-sm space-y-2">
      <div className="text-sm font-semibold">Extra Class</div>

      <div className="flex gap-2">
        <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} className="border rounded px-2 py-2 text-sm">
          {TIME_SLOTS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select value={code} onChange={(e) => setCode(e.target.value)} className="border rounded px-2 py-2 text-sm w-full">
          {props.subjects.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>

        <button onClick={() => props.onAdd(timeSlot, code)} className="px-3 py-2 rounded bg-gray-900 text-white text-sm">
          Add
        </button>
      </div>

      {props.extras.length > 0 && (
        <div className="text-xs text-gray-700">
          <div className="font-semibold mb-1">Existing extras</div>
          <div className="flex flex-col gap-1">
            {props.extras.map((e) => (
              <div key={`${e.timeSlot}__${e.code}`} className="flex items-center justify-between border rounded px-2 py-1">
                <span>
                  {e.timeSlot} • {e.code}
                </span>
                <button onClick={() => props.onRemove(e.timeSlot, e.code)} className="text-xs px-2 py-1 rounded border">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

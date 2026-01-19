// FILE: src/app/holidays/page.tsx
"use client";

import { useEffect, useState } from "react";
import { todayISO } from "@/lib/date";

type Holiday = { date: string; label: string; isCancelled: boolean };

export default function HolidaysPage() {
  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState("2026-12-31");
  const [list, setList] = useState<Holiday[]>([]);
  const [date, setDate] = useState(todayISO());
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await fetch(`/api/holidays?from=${from}&to=${to}`, { cache: "no-store" });
    const j = await r.json();
    setList(j);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  async function upsert(d: string, l: string, isCancelled?: boolean) {
    setMsg("Saving…");
    const r = await fetch("/api/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: d, label: l, isCancelled })
    });
    const j = await r.json();
    setMsg(r.ok ? "✅ Saved" : `❌ ${j.error || r.status}`);
    await load();
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      <a href="/" className="underline text-sm">
        ← Back
      </a>
      <h1 className="text-xl font-bold">Holidays</h1>

      <div className="bg-white border rounded-xl p-3 space-y-2">
        <div className="text-sm font-semibold">View range</div>
        <div className="flex gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1 w-full" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1 w-full" />
        </div>
      </div>

      <div className="bg-white border rounded-xl p-3 space-y-2">
        <div className="text-sm font-semibold">Add / Update holiday</div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded px-2 py-2 w-full" />
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Holi)" className="border rounded px-2 py-2 w-full" />
        <button onClick={() => upsert(date, label, false)} className="px-3 py-2 rounded bg-gray-900 text-white text-sm w-full">
          Save Holiday
        </button>
        <div className="text-xs text-gray-600">{msg}</div>
      </div>

      <div className="bg-white border rounded-xl p-3 space-y-2">
        <div className="text-sm font-semibold">Existing</div>
        <div className="space-y-2">
          {list.map((h) => (
            <div key={h.date} className="border rounded p-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{h.date}</div>
                <div className="text-xs text-gray-700">
                  {h.label || "(no label)"} {h.isCancelled ? "• CANCELLED" : "• ACTIVE"}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => upsert(h.date, h.label, !h.isCancelled)} className="text-xs px-2 py-1 rounded border">
                  {h.isCancelled ? "Un-cancel" : "Cancel"}
                </button>
              </div>
            </div>
          ))}
          {list.length === 0 ? <div className="text-xs text-gray-600">No holidays in this range.</div> : null}
        </div>
      </div>
    </div>
  );
}

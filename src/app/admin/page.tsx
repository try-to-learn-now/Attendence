// FILE: src/app/admin/page.tsx
"use client";

import { useState } from "react";

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");

  async function seed() {
    setMsg("Seeding…");
    const r = await fetch("/api/admin/seed", { method: "POST", headers: { "x-admin-key": key } });
    const j = await r.json();
    setMsg(r.ok ? `✅ Seeded subjects=${j.subjects}, routine=${j.routine}` : `❌ ${j.error || r.status}`);
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      <a href="/" className="underline text-sm">
        ← Back
      </a>
      <h1 className="text-xl font-bold">Admin</h1>

      <div className="bg-white border rounded-xl p-3 space-y-2">
        <div className="text-sm font-semibold">Seed Subjects + Routine (MongoDB)</div>
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="ADMIN_KEY" className="border rounded px-2 py-2 w-full" />
        <button onClick={seed} className="px-3 py-2 rounded bg-gray-900 text-white text-sm">
          Run Seed
        </button>
        <div className="text-xs text-gray-600">{msg}</div>
      </div>
    </div>
  );
}

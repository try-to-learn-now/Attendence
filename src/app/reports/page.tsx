// FILE: src/app/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { todayISO } from "@/lib/date";

type DayGridRow = {
  date: string;
  mode: string;
  biometricDone: boolean;
  isHoliday: boolean;
  subjects: { timeSlot: string; name: string; code: string; status: string | null }[];
};

function setColorForStatus(doc: jsPDF, status: string | null) {
  if (status === "PRESENT") doc.setTextColor(0, 128, 0);
  else if (status === "PRESENT_PROXY") doc.setTextColor(255, 140, 0);
  else if (status === "PROXY") doc.setTextColor(0, 0, 0);
  else if (status === "ABSENT") doc.setTextColor(200, 0, 0);
  else if (status === "NO_CLASS") doc.setTextColor(120, 120, 120);
  else doc.setTextColor(80, 80, 80);
}

export default function Reports() {
  const [from, setFrom] = useState("2026-01-19");
  const [to, setTo] = useState(todayISO());
  const [code, setCode] = useState("104501");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/meta", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setFrom(j.semesterStart || "2026-01-19"))
      .catch(() => {});
  }, []);

  async function downloadDayGrid() {
    setMsg("Generating day-grid…");
    const r = await fetch(`/api/report/day-grid?from=${from}&to=${to}`, { cache: "no-store" });
    const j = await r.json();
    const rows: DayGridRow[] = j.rows;

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Attendance Day Grid (${j.from} to ${j.to})`, 14, 16);
    doc.setFontSize(10);

    let y = 26;

    for (const row of rows) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(0, 0, 0);
      doc.text(`${row.date} | ${row.mode} | BIO:${row.biometricDone ? "YES" : "NO"} ${row.isHoliday ? "| HOLIDAY" : ""}`, 14, y);
      y += 6;

      for (const s of row.subjects) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        setColorForStatus(doc, s.status);
        const st = s.status ?? "-";
        doc.text(`${s.timeSlot}  ${s.name} (${s.code}) = ${st}`, 14, y);
        y += 5;
      }

      y += 4;
    }

    doc.save(`day-grid_${from}_to_${to}.pdf`);
    setMsg("✅ Downloaded");
  }

  async function downloadSubjectWise() {
    setMsg("Generating subject-wise…");
    const r = await fetch(`/api/report/subject?code=${code}&from=${from}&to=${to}`, { cache: "no-store" });
    const j = await r.json();

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Subject Report: ${j.subject?.name || code} (${code})`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Teacher: ${j.subject?.teacher || ""}`, 14, 22);
    doc.text(`Range: ${j.from} to ${j.to}`, 14, 28);

    let y = 38;
    doc.setTextColor(0, 0, 0);
    for (const e of j.entries) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${e.date} | ${e.timeSlot} | ${e.status}`, 14, y);
      y += 6;
    }

    doc.save(`subject_${code}_${from}_to_${to}.pdf`);
    setMsg("✅ Downloaded");
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      <a href="/" className="underline text-sm">
        ← Back
      </a>
      <h1 className="text-xl font-bold">Reports</h1>

      <div className="bg-white border rounded-xl p-3 space-y-2">
        <div className="text-sm font-semibold">Range</div>
        <div className="flex gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1 w-full" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1 w-full" />
        </div>
      </div>

      <div className="bg-white border rounded-xl p-3 space-y-2">
        <button onClick={downloadDayGrid} className="w-full px-3 py-2 rounded bg-gray-900 text-white text-sm">
          Download Day-Grid PDF
        </button>
      </div>

      <div className="bg-white border rounded-xl p-3 space-y-2">
        <div className="text-sm font-semibold">Subject-wise</div>
        <input value={code} onChange={(e) => setCode(e.target.value)} className="border rounded px-2 py-2 w-full" placeholder="Subject code e.g. 104501" />
        <button onClick={downloadSubjectWise} className="w-full px-3 py-2 rounded border text-sm">
          Download Subject PDF
        </button>
      </div>

      <div className="text-xs text-gray-600">{msg}</div>
    </div>
  );
}

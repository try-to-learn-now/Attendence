// components/SubjectCard.js
"use client";

import { useEffect, useMemo, useState } from "react";
import PdfButton from "./PdfButton";

const STATUS = [
  { key: "green", label: "PRESENT" },
  { key: "orange", label: "P+PROXY" },
  { key: "black", label: "PROXY" },
  { key: "red", label: "ABSENT" },
  { key: "grey", label: "NO CLASS" },
];

export default function SubjectCard({
  subjectName,
  subjectCode,
  classTime,
  isScheduled,
  selectedDate,
  biometricDone,
  isFuture,
}) {
  const [todayStatus, setTodayStatus] = useState(null);
  const [topic, setTopic] = useState("");
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ teacher: 0, bio: 0 });
  const [saving, setSaving] = useState(false);

  const title = useMemo(
    () => `${subjectName} (${subjectCode})`,
    [subjectName, subjectCode]
  );

  // Load current status + logs + stats
  useEffect(() => {
    let ignore = false;

    async function load() {
      const res = await fetch(
        `/api/attendance/check?code=${encodeURIComponent(subjectCode)}&date=${encodeURIComponent(
          selectedDate
        )}&timeSlot=${encodeURIComponent(classTime)}`
      );
      const data = await res.json();
      if (ignore) return;

      setTodayStatus(data?.status ?? null);
      setLogs(Array.isArray(data?.logs) ? data.logs : []);
      setStats(data?.stats ?? { teacher: 0, bio: 0 });

      // If there is an existing log for this slot, preload topic
      const match = (data?.logs || []).find((l) => {
        const d = new Date(l.date).toISOString().split("T")[0];
        return d === selectedDate && l.timeSlot === classTime;
      });
      setTopic(match?.topic || "");
    }

    load();
    return () => {
      ignore = true;
    };
  }, [subjectCode, selectedDate, classTime]);

  async function mark(statusKey) {
    if (isFuture) return;
    setSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: subjectCode,
          name: subjectName,
          status: statusKey,
          topic,
          date: selectedDate,
          timeSlot: classTime,
        }),
      });

      if (!res.ok) throw new Error("Failed to save attendance");

      // refresh after save
      const chk = await fetch(
        `/api/attendance/check?code=${encodeURIComponent(subjectCode)}&date=${encodeURIComponent(
          selectedDate
        )}&timeSlot=${encodeURIComponent(classTime)}`
      );
      const data = await chk.json();
      setTodayStatus(data?.status ?? null);
      setLogs(Array.isArray(data?.logs) ? data.logs : []);
      setStats(data?.stats ?? { teacher: 0, bio: 0 });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-gray-500">{classTime}</div>
          <div className="text-lg font-black text-gray-900 leading-tight">{subjectName}</div>
          <div className="text-xs font-bold text-gray-400">{subjectCode}</div>
          <div className="mt-1 text-[10px] font-bold">
            {isScheduled ? (
              <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700">ROUTINE</span>
            ) : (
              <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-700">EXTRA</span>
            )}
          </div>
        </div>

        <div className="text-right text-[10px] font-bold text-gray-500">
          <div>Teacher: {stats.teacher}%</div>
          <div>Bio: {stats.bio}%</div>
        </div>
      </div>

      <div className="mt-3">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic (optional)"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 font-bold text-sm outline-none"
          disabled={isFuture || saving}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {STATUS.map((s) => (
          <button
            key={s.key}
            onClick={() => mark(s.key)}
            disabled={isFuture || saving}
            className={`py-2 rounded-xl font-black text-xs border transition-all ${
              todayStatus === s.key
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200"
            }`}
            title={s.label}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="text-[10px] font-bold text-gray-400">
          {biometricDone ? "✅ Bio logged" : "⚠️ Bio not logged"}
        </div>
        <PdfButton subjectName={title} logs={logs} />
      </div>

      {saving && <div className="mt-2 text-xs font-bold text-gray-400">Saving…</div>}
    </div>
  );
}

// components/SubjectCard.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { ALL_SUBJECTS, getSubjectByCode } from "@/lib/universal_data";
import PdfButton from "./PdfButton";

const STATUS_BTNS = [
  { key: "green", label: "PRESENT" },
  { key: "orange", label: "P+PROXY" },
  { key: "black", label: "PROXY" },
  { key: "red", label: "ABSENT" },
  { key: "grey", label: "NO CLASS" },
];

function statusLabel(status) {
  if (status === "green") return "PRESENT";
  if (status === "orange") return "P+PROXY";
  if (status === "black") return "PROXY";
  if (status === "red") return "ABSENT";
  return "NO CLASS";
}

export default function SubjectCard({
  period,
  classTime,
  subjectCode, // actual code
  subjectName,
  type, // ROUTINE | EXTRA | SWAP
  selectedDate,
  biometricDone,
  isHoliday,
  isFuture,
  isOngoing,

  scheduledCode, // for swap/slot meaning
  refreshDashboard, // callback
}) {
  const [slotStatus, setSlotStatus] = useState(null);
  const [topic, setTopic] = useState("");
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ teacher: 0, bio: 0 });
  const [target, setTarget] = useState(75);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // swap UI
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapTo, setSwapTo] = useState("");

  // biometric warning counts
  const [warnCount, setWarnCount] = useState({});

  const title = useMemo(() => `${subjectName} (${subjectCode})`, [subjectName, subjectCode]);

  async function load() {
    const res = await fetch(
      `/api/attendance/check?code=${encodeURIComponent(subjectCode)}&date=${encodeURIComponent(
        selectedDate
      )}&timeSlot=${encodeURIComponent(classTime)}`
    );
    const data = await res.json();

    setSlotStatus(data?.status ?? null);
    setLogs(Array.isArray(data?.logs) ? data.logs : []);
    setStats(data?.stats ?? { teacher: 0, bio: 0 });
    setTarget(data?.target_percent ?? 75);

    // preload topic for this slot (if exists)
    const match = (data?.logs || []).find((l) => {
      const d = new Date(l.date).toISOString().split("T")[0];
      return d === selectedDate && l.timeSlot === classTime;
    });
    setTopic(match?.topic || "");
  }

  useEffect(() => {
    setMsg("");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectCode, selectedDate, classTime]);

  const markingLocked = isFuture || isHoliday;

  async function mark(statusKey) {
    if (markingLocked) return;

    const requiresBio = statusKey === "green" || statusKey === "orange";
    const warnKey = `${selectedDate}|${subjectCode}|${classTime}|${statusKey}`;

    let bioOverride = false;

    if (requiresBio && !biometricDone) {
      const c = warnCount[warnKey] || 0;

      if (c === 0) {
        setWarnCount((p) => ({ ...p, [warnKey]: 1 }));
        setMsg("⚠️ Biometric not done. Tap again to confirm (online class).");
        return;
      }
      if (c === 1) {
        setWarnCount((p) => ({ ...p, [warnKey]: 2 }));
        bioOverride = true;
        setMsg("⚠️ Saving as OVERRIDE (Bio not done).");
      }
    }

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

          scheduledCode: scheduledCode || "",
          bioOverride,
          overrideReason: bioOverride ? "online_class" : "",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err?.error === "HOLIDAY_LOCK") setMsg("Holiday mode is ON. Turn off holiday to mark.");
        else if (err?.error === "BIO_REQUIRED") setMsg("Mark biometric first, or tap twice to override.");
        else setMsg("Save failed.");
        return;
      }

      await load();
      refreshDashboard?.();
    } finally {
      setSaving(false);
    }
  }

  async function saveSwap() {
    if (!swapTo || !scheduledCode) return;
    setSaving(true);
    try {
      await fetch("/api/daily-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateString: selectedDate,
          swap: { timeSlot: classTime, fromCode: scheduledCode, toCode: swapTo },
        }),
      });
      setSwapOpen(false);
      setSwapTo("");
      refreshDashboard?.();
    } finally {
      setSaving(false);
    }
  }

  async function undoSwap() {
    setSaving(true);
    try {
      await fetch("/api/daily-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateString: selectedDate, removeSwap: { timeSlot: classTime } }),
      });
      refreshDashboard?.();
    } finally {
      setSaving(false);
    }
  }

  async function removeExtra() {
    setSaving(true);
    try {
      await fetch("/api/daily-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateString: selectedDate,
          removeExtra: { timeSlot: classTime, code: subjectCode },
        }),
      });
      refreshDashboard?.();
    } finally {
      setSaving(false);
    }
  }

  const riskLow = stats.teacher > 0 && stats.teacher < target;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border p-4 transition ${
        isOngoing ? "border-black" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black text-gray-500">
            #{period} • {classTime}
          </div>

          <div className="text-lg font-black text-gray-900 leading-tight">{subjectName}</div>
          <div className="text-xs font-bold text-gray-400">{subjectCode}</div>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700">
              {type}
            </span>

            {scheduledCode && type === "SWAP" && (
              <span className="px-2 py-1 rounded-full text-[10px] font-black bg-orange-50 text-orange-700">
                Scheduled: {scheduledCode}
              </span>
            )}

            {isOngoing && (
              <span className="px-2 py-1 rounded-full text-[10px] font-black bg-black text-white">
                ONGOING
              </span>
            )}
          </div>
        </div>

        <div className="text-right text-[10px] font-bold text-gray-500">
          <div>
            Teacher:{" "}
            <span className={riskLow ? "text-red-600 font-black" : "text-gray-700 font-black"}>
              {stats.teacher}%
            </span>
            <span className="text-gray-400"> / target {target}%</span>
          </div>
          <div>Bio: <span className="text-gray-700 font-black">{stats.bio}%</span></div>
          {riskLow && (
            <div className="mt-1 text-[10px] font-black text-red-600">⚠️ Risk below target</div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic (optional)"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 font-bold text-sm outline-none"
          disabled={markingLocked || saving}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {STATUS_BTNS.map((s) => (
          <button
            key={s.key}
            onClick={() => mark(s.key)}
            disabled={markingLocked || saving}
            className={`py-2 rounded-xl font-black text-xs border transition-all ${
              slotStatus === s.key ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="text-[10px] font-bold text-gray-400">
          {biometricDone ? "✅ Bio logged" : "⚠️ Bio not logged"}
          {markingLocked && isHoliday && <span className="ml-2 text-red-600">Holiday lock</span>}
        </div>

        <PdfButton subjectName={title} logs={logs} subjectCode={subjectCode} />
      </div>

      <div className="mt-3 flex gap-2">
        {scheduledCode && (type === "ROUTINE" || type === "SWAP") && (
          <>
            {type === "SWAP" ? (
              <button
                onClick={undoSwap}
                disabled={saving}
                className="flex-1 py-2 rounded-xl font-black text-xs border border-gray-200"
              >
                Undo Swap
              </button>
            ) : (
              <button
                onClick={() => setSwapOpen((v) => !v)}
                disabled={saving}
                className="flex-1 py-2 rounded-xl font-black text-xs border border-gray-200"
              >
                Swap
              </button>
            )}
          </>
        )}

        {type === "EXTRA" && (
          <button
            onClick={removeExtra}
            disabled={saving}
            className="flex-1 py-2 rounded-xl font-black text-xs border border-gray-200"
          >
            Remove Extra
          </button>
        )}
      </div>

      {swapOpen && (
        <div className="mt-3">
          <input
            value={swapTo}
            onChange={(e) => setSwapTo(e.target.value)}
            placeholder="Enter code (e.g. 104506)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 font-bold text-sm outline-none"
            list="allSubjects"
          />
          <datalist id="allSubjects">
            {ALL_SUBJECTS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </datalist>

          <button
            onClick={saveSwap}
            disabled={saving || !swapTo}
            className="mt-2 w-full py-2 rounded-xl font-black text-xs bg-black text-white"
          >
            Save Swap
          </button>
        </div>
      )}

      {msg && <div className="mt-2 text-xs font-bold text-gray-500">{msg}</div>}
    </div>
  );
}


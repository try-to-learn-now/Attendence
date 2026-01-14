// components/SubjectCard.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { ALL_SUBJECTS, getSubjectByCode } from "@/lib/universal_data";

function statusLabel(status) {
  if (status === "green") return "PRESENT";
  if (status === "orange") return "P + PROXY";
  if (status === "black") return "PROXY";
  if (status === "red") return "ABSENT";
  return "NO CLASS";
}

function statusColor(status) {
  if (status === "green") return "bg-green-600";
  if (status === "orange") return "bg-orange-500";
  if (status === "black") return "bg-gray-800";
  if (status === "red") return "bg-red-500";
  return "bg-gray-400";
}

export default function SubjectCard({
  period,
  classTime,
  subjectCode,
  subjectName,
  type, // "ROUTINE" | "SWAP" | "EXTRA"
  scheduledCode, // original routine code (if SWAP)
  selectedDate,
  biometricDone,
  isHoliday,
  isFuture,
  isOngoing,
  refreshDashboard,
}) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const [teacherPercent, setTeacherPercent] = useState(0);
  const [bioPercent, setBioPercent] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [targetPercent, setTargetPercent] = useState(75);

  const [swapOpen, setSwapOpen] = useState(false);
  const [swapToCode, setSwapToCode] = useState("");

  const canEdit = !isFuture;

  const listId = useMemo(() => {
    return `swapSubjects-${String(classTime).replace(/[^a-zA-Z0-9]/g, "")}-${period}`;
  }, [classTime, period]);

  const scheduledName = useMemo(() => {
    const s = scheduledCode ? getSubjectByCode(scheduledCode) : null;
    return s?.name || "";
  }, [scheduledCode]);

  useEffect(() => {
    async function fetchStatus() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/attendance/check?code=${subjectCode}&date=${selectedDate}&timeSlot=${classTime}`
        );
        const data = await res.json();

        if (data.success) {
          setStatus(data.status);

          setTeacherPercent(data.stats.teacher);
          setBioPercent(data.stats.bio);
          setTotalClasses(data.stats.total);
          setTargetPercent(data.target_percent);
        }
      } catch (err) {
        // ignore
      }
      setLoading(false);
    }

    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectCode, selectedDate, classTime]);

  const teacherNeeds = useMemo(() => {
    if (totalClasses === 0) return { label: "No data", color: "text-gray-400" };

    const target = targetPercent || 75;
    const current = teacherPercent;

    if (current >= target) {
      return { label: `Safe (${current}%)`, color: "text-green-600" };
    }

    return { label: `Risky (${current}% < ${target}%)`, color: "text-red-600" };
  }, [teacherPercent, totalClasses, targetPercent]);

  async function markAttendance(newStatus) {
    if (isHoliday || isFuture) return;

    setStatus(newStatus);

    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: subjectCode,
        name: subjectName,
        status: newStatus,
        topic: "",
        date: selectedDate,
        timeSlot: classTime,
        scheduledCode: scheduledCode || "",
      }),
    });

    refreshDashboard?.();
  }

  async function applySwap() {
    if (!canEdit) return;
    const toCode = (swapToCode || "").trim().toUpperCase();
    if (!toCode) return;

    const fromCode = (scheduledCode || subjectCode || "").trim().toUpperCase();
    if (!fromCode) return;

    if (toCode === fromCode) {
      await removeSwap();
      setSwapToCode("");
      setSwapOpen(false);
      return;
    }

    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateString: selectedDate,
        swap: { timeSlot: classTime, fromCode, toCode },
      }),
    });

    setSwapOpen(false);
    setSwapToCode("");
    refreshDashboard?.();
  }

  async function removeSwap() {
    if (!canEdit) return;

    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateString: selectedDate,
        removeSwap: { timeSlot: classTime },
      }),
    });

    setSwapOpen(false);
    setSwapToCode("");
    refreshDashboard?.();
  }

  async function removeExtra() {
    if (!canEdit) return;

    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateString: selectedDate,
        removeExtra: { timeSlot: classTime, code: subjectCode },
      }),
    });

    refreshDashboard?.();
  }

  const typeLabel =
    type === "ROUTINE" ? "ROUTINE" : type === "SWAP" ? "SWAP" : "EXTRA";

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm ${
        isOngoing ? "ring-2 ring-black" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-black text-gray-400">
            Period {period} • {typeLabel}
          </div>

          <div className="mt-1 text-lg font-black truncate">{subjectName}</div>

          <div className="text-xs font-bold text-gray-500">
            Code: {subjectCode} • Time: {classTime}
          </div>

          {type === "SWAP" ? (
            <div className="mt-1 text-xs font-bold text-gray-500">
              Swap: {scheduledCode} → {subjectCode}
              {scheduledName ? ` • ${scheduledName}` : ""}
            </div>
          ) : type === "ROUTINE" ? (
            <div className="mt-1 text-xs font-bold text-gray-500">
              Scheduled: {scheduledCode}
            </div>
          ) : null}

          {!isFuture && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(type === "ROUTINE" || type === "SWAP") && (
                <button
                  onClick={() => setSwapOpen((p) => !p)}
                  className="px-3 py-1 rounded-xl border border-gray-200 text-xs font-black"
                >
                  {swapOpen ? "Close" : type === "SWAP" ? "Change Swap" : "Swap"}
                </button>
              )}

              {type === "SWAP" && (
                <button
                  onClick={removeSwap}
                  className="px-3 py-1 rounded-xl border border-gray-200 text-xs font-black"
                >
                  Remove Swap
                </button>
              )}

              {type === "EXTRA" && (
                <button
                  onClick={removeExtra}
                  className="px-3 py-1 rounded-xl border border-gray-200 text-xs font-black"
                >
                  Remove Extra
                </button>
              )}
            </div>
          )}

          {swapOpen && (type === "ROUTINE" || type === "SWAP") && (
            <div className="mt-3 bg-gray-50 border border-gray-100 rounded-2xl p-3">
              <div className="text-xs font-black text-gray-500">Swap to</div>

              <div className="mt-2 flex gap-2">
                <input
                  value={swapToCode}
                  onChange={(e) => setSwapToCode(e.target.value)}
                  placeholder="Subject code"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 font-black"
                  list={listId}
                />
                <datalist id={listId}>
                  {ALL_SUBJECTS.map((s) => (
                    <option key={`${classTime}-${s.code}`} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </datalist>

                <button
                  onClick={applySwap}
                  disabled={!swapToCode}
                  className="px-4 py-2 rounded-xl bg-black text-white font-black disabled:opacity-40"
                >
                  Apply
                </button>
              </div>

              <div className="mt-2 text-[11px] font-bold text-gray-500">
                Choosing the scheduled code will remove the swap.
              </div>
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          {loading ? (
            <div className="text-xs font-bold text-gray-400">Loading...</div>
          ) : (
            <div
              className={`px-3 py-1 rounded-xl text-xs font-black text-white ${statusColor(
                status
              )}`}
            >
              {statusLabel(status)}
            </div>
          )}

          <div className="mt-2 text-[11px] font-black text-gray-400">
            Teacher:{" "}
            <span className={teacherNeeds.color}>{teacherNeeds.label}</span>
          </div>
          <div className="text-[11px] font-black text-gray-400">
            Bio: {bioPercent}%
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        <button
          onClick={() => markAttendance("green")}
          disabled={isHoliday || isFuture}
          className={`py-2 rounded-xl text-xs font-black text-white ${
            status === "green" ? "bg-green-700" : "bg-green-600"
          } disabled:opacity-40`}
        >
          P
        </button>

        <button
          onClick={() => markAttendance("orange")}
          disabled={isHoliday || isFuture}
          className={`py-2 rounded-xl text-xs font-black text-white ${
            status === "orange" ? "bg-orange-600" : "bg-orange-500"
          } disabled:opacity-40`}
        >
          P+Pr
        </button>

        <button
          onClick={() => markAttendance("black")}
          disabled={isHoliday || isFuture}
          className={`py-2 rounded-xl text-xs font-black text-white ${
            status === "black" ? "bg-gray-900" : "bg-gray-800"
          } disabled:opacity-40`}
        >
          Pr
        </button>

        <button
          onClick={() => markAttendance("red")}
          disabled={isHoliday || isFuture}
          className={`py-2 rounded-xl text-xs font-black text-white ${
            status === "red" ? "bg-red-600" : "bg-red-500"
          } disabled:opacity-40`}
        >
          A
        </button>

        <button
          onClick={() => markAttendance("grey")}
          disabled={isHoliday || isFuture}
          className={`py-2 rounded-xl text-xs font-black text-white ${
            status === "grey" ? "bg-gray-600" : "bg-gray-400"
          } disabled:opacity-40`}
        >
          NC
        </button>
      </div>

      {!isFuture &&
        !isHoliday &&
        (status === "green" || status === "orange") &&
        !biometricDone && (
          <div className="mt-3 text-xs font-black text-red-600 bg-red-50 border border-red-100 rounded-xl p-2">
            Bio not marked. Saving P / P+Proxy may be blocked unless override is enabled.
          </div>
        )}
    </div>
  );
}


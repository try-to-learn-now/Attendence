// ===== File: components/SubjectCard.js =====
"use client";

import { useEffect, useMemo, useState } from "react";

function label(status) {
  if (status === "green") return "PRESENT";
  if (status === "orange") return "P+PROXY";
  if (status === "black") return "PROXY";
  if (status === "red") return "ABSENT";
  return "NO CLASS";
}

function badge(status) {
  if (status === "green") return "bg-green-600 text-white";
  if (status === "orange") return "bg-orange-500 text-white";
  if (status === "black") return "bg-gray-900 text-white";
  if (status === "red") return "bg-red-600 text-white";
  return "bg-gray-200 text-gray-700";
}

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "-";
  }
}

export default function SubjectCard({
  period,
  classTime,
  subjectCode,
  subjectName,
  type,
  scheduledCode,
  selectedDate,
  biometricDone,
  isHoliday,
  isFuture,
  isOngoing,
  refreshDashboard,
}) {
  const [loading, setLoading] = useState(true);

  const [currentStatus, setCurrentStatus] = useState(null);
  const [topic, setTopic] = useState("");

  const [lastLogs, setLastLogs] = useState([]);
  const [stats, setStats] = useState({ teacher: 0, bio: 0, total: 0 });

  const [target, setTarget] = useState(75);

  // Biometric override UX
  const [warnCount, setWarnCount] = useState(0);
  const [overrideReason, setOverrideReason] = useState("online_class");

  const needsBio = useMemo(
    () => currentStatus === "green" || currentStatus === "orange",
    [currentStatus]
  );

  const riskLow = useMemo(() => {
    // Only show risk when there is real data
    return stats.total > 0 && stats.teacher < target;
  }, [stats, target]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/attendance/check?code=${encodeURIComponent(
          subjectCode
        )}&date=${encodeURIComponent(selectedDate)}&timeSlot=${encodeURIComponent(
          classTime
        )}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setCurrentStatus(null);
        setLastLogs([]);
        setStats({ teacher: 0, bio: 0, total: 0 });
        setTarget(75);
        setTopic("");
        setLoading(false);
        return;
      }

      setCurrentStatus(data?.current?.status ?? data?.status ?? null);
      setTopic(data?.current?.topic ?? "");
      setLastLogs(data?.logs || []);
      setStats(data?.stats || { teacher: 0, bio: 0, total: 0 });
      setTarget(data?.target_percent ?? 75);
    } catch {
      setCurrentStatus(null);
      setLastLogs([]);
      setStats({ teacher: 0, bio: 0, total: 0 });
      setTarget(75);
      setTopic("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectCode, selectedDate, classTime]);

  async function mark(status) {
    if (isFuture) return;
    if (isHoliday && status !== "grey") {
      window.alert("Holiday lock: only NO CLASS allowed.");
      return;
    }

    const requiresBio = status === "green" || status === "orange";

    // 2-step warning before override save
    let bioOverride = false;
    let reason = "";

    if (requiresBio && !biometricDone) {
      if (warnCount < 1) {
        setWarnCount(1);
        window.alert(
          "Biometric not done.\nTap the SAME button again to save as ONLINE (override)."
        );
        return;
      }
      bioOverride = true;
      reason = overrideReason || "online_class";
    } else {
      setWarnCount(0);
    }

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: subjectCode,
        name: subjectName,
        status,
        topic: topic || "",
        date: selectedDate,
        timeSlot: classTime,
        scheduledCode: scheduledCode || subjectCode,

        // biometric override
        bioOverride,
        overrideReason: reason,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      window.alert(err?.error || "Save failed");
      return;
    }

    await load();
    await refreshDashboard?.();
  }

  return (
    <div
      className={`bg-white border border-gray-100 rounded-2xl p-4 ${
        isOngoing ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-black text-gray-400">
            PERIOD {period} • {classTime}
            {type && type !== "ROUTINE" ? (
              <span className="ml-2 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700">
                {type}
              </span>
            ) : null}
            {isOngoing ? (
              <span className="ml-2 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700">
                ONGOING
              </span>
            ) : null}
          </div>

          <div className="mt-1 text-lg font-black truncate">
            {subjectName}
          </div>
          <div className="text-xs font-bold text-gray-500">{subjectCode}</div>
        </div>

        <div className="text-right">
          <div className="text-xs font-black text-gray-400">TEACHER</div>
          <div className="text-2xl font-black">{stats.teacher}%</div>

          <div className="mt-1 text-xs font-black text-gray-400">BIO</div>
          <div className="text-lg font-black">{stats.bio}%</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="text-xs font-black text-gray-500">
          Target: {target}%
        </div>
        {riskLow ? (
          <div className="px-2 py-0.5 rounded-lg bg-red-50 text-red-700 text-xs font-black">
            Below target
          </div>
        ) : null}
        {stats.total > 0 ? (
          <div className="px-2 py-0.5 rounded-lg bg-gray-50 text-gray-700 text-xs font-black">
            Total: {stats.total}
          </div>
        ) : null}
      </div>

      {(!biometricDone) ? (
        <div className="mt-2 text-xs font-bold text-gray-500">
          Bio is OFF — saving Present/P+Proxy needs override (2nd tap).
          <select
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            className="ml-2 border border-gray-200 rounded-lg px-2 py-1"
          >
            <option value="online_class">online_class</option>
            <option value="biometric_machine_off">biometric_machine_off</option>
            <option value="teacher_said_skip">teacher_said_skip</option>
          </select>
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-5 gap-2">
        <button
          onClick={() => mark("green")}
          disabled={loading || (isHoliday && !isFuture)}
          className={`py-2 rounded-xl font-black ${
            currentStatus === "green" ? "bg-green-600 text-white" : "bg-green-50 text-green-800"
          }`}
        >
          P
        </button>

        <button
          onClick={() => mark("orange")}
          disabled={loading || (isHoliday && !isFuture)}
          className={`py-2 rounded-xl font-black ${
            currentStatus === "orange" ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-800"
          }`}
        >
          P+Pr
        </button>

        <button
          onClick={() => mark("black")}
          disabled={loading || (isHoliday && !isFuture)}
          className={`py-2 rounded-xl font-black ${
            currentStatus === "black" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"
          }`}
        >
          Pr
        </button>

        <button
          onClick={() => mark("red")}
          disabled={loading || (isHoliday && !isFuture)}
          className={`py-2 rounded-xl font-black ${
            currentStatus === "red" ? "bg-red-600 text-white" : "bg-red-50 text-red-800"
          }`}
        >
          A
        </button>

        <button
          onClick={() => mark("grey")}
          disabled={loading}
          className={`py-2 rounded-xl font-black ${
            currentStatus === "grey" ? "bg-gray-300 text-gray-900" : "bg-gray-50 text-gray-700"
          }`}
        >
          NC
        </button>
      </div>

      <div className="mt-3">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic (optional)"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 font-bold"
        />
      </div>

      <div className="mt-4">
        <div className="text-xs font-black text-gray-400">Last logs (semester)</div>

        <div className="mt-2 space-y-2">
          {lastLogs.length === 0 ? (
            <div className="text-xs font-bold text-gray-400">No logs yet</div>
          ) : (
            lastLogs.map((l, idx) => (
              <div
                key={`${idx}-${l.date}-${l.timeSlot}`}
                className="flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-black text-gray-700 truncate">
                    {fmtDate(l.date)} • {l.timeSlot || "-"}
                  </div>
                  <div className="text-[11px] font-bold text-gray-500 truncate">
                    {l.topic || "-"}
                  </div>
                </div>

                <div className={`px-2 py-1 rounded-lg text-[11px] font-black ${badge(l.status)}`}>
                  {label(l.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

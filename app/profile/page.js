// ===== File: app/profile/page.js =====
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SEMESTER } from "@/lib/semester_config";

function statusToLabel(status) {
  if (status === "green") return "PRESENT";
  if (status === "orange") return "P+PROXY";
  if (status === "black") return "PROXY";
  if (status === "red") return "ABSENT";
  return "NO CLASS";
}

function computeSubjectStats(subjects) {
  const semStart = new Date(SEMESTER.startDate);

  return (subjects || [])
    .map((s) => {
      const logs = (s.attendance_logs || []).filter(
        (l) => new Date(l.date) >= semStart
      );

      const valid = logs.filter((l) => l.status !== "grey");
      const total = valid.length;

      const teacherPresent = valid.filter((l) =>
        ["green", "orange", "black"].includes(l.status)
      ).length;

      const bioPresent = valid.filter((l) => Boolean(l.is_bio_present)).length;

      const teacherPct = total ? Math.round((teacherPresent / total) * 100) : 0;
      const bioPct = total ? Math.round((bioPresent / total) * 100) : 0;

      const attended = valid.filter((l) =>
        ["green", "orange"].includes(l.status)
      ).length;

      const target = s.target_percent ?? 75;

      return {
        _id: s._id,
        name: s.name,
        code: s.code,
        schedule: s.schedule,
        target,
        total,
        teacherPct,
        bioPct,
        attended,
      };
    })
    .sort((a, b) => (a.teacherPct - a.target) - (b.teacherPct - b.target)); // lowest first (most risky)
}

export default function ProfilePage() {
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    pproxy: 0,
    proxy: 0,
    absent: 0,
    noClass: 0,
  });

  const [subjects, setSubjects] = useState([]);
  const [targets, setTargets] = useState({});
  const [saving, setSaving] = useState({}); // _id -> bool

  async function fetchSubjects() {
    const res = await fetch(`/api/subjects?ts=${Date.now()}`, {
      cache: "no-store",
    });
    return res.json();
  }

  async function loadAll() {
    // analytics
    const res = await fetch(`/api/analytics?ts=${Date.now()}`, {
      cache: "no-store",
    });
    const data = await res.json();

    // FIX: analytics is {success:true, data:{...}}
    setStats(data?.data || data);

    // subjects
    const subRes = await fetchSubjects();
    const list = subRes?.subjects || [];
    setSubjects(list);

    // init editable targets
    const map = {};
    for (const s of list) map[s._id] = s.target_percent ?? 75;
    setTargets(map);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const presentPlusPproxyPercent =
    stats.total > 0
      ? Math.round(((stats.present + stats.pproxy) / stats.total) * 100)
      : 0;

  const presentOnlyPercent =
    stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  const perSubject = useMemo(() => computeSubjectStats(subjects), [subjects]);

  async function saveTarget(s) {
    const val = Number(targets[s._id]);
    const clean = Number.isFinite(val) ? Math.max(0, Math.min(100, val)) : 75;

    setSaving((p) => ({ ...p, [s._id]: true }));

    await fetch("/api/subjects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _id: s._id,
        name: s.name,
        code: s.code,
        schedule: s.schedule,
        target_percent: clean,
      }),
    });

    setSaving((p) => ({ ...p, [s._id]: false }));
    await loadAll();
  }

  // ---- PDF (semester only) ----
  async function downloadCompleteReport() {
    const { subjects } = await fetchSubjects();
    const semStart = new Date(SEMESTER.startDate);

    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Attendance Report (Complete • Semester)", 14, 18);
    doc.setFontSize(11);
    doc.text(`Semester start: ${SEMESTER.startDate}`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

    const rows = [];

    for (const subject of subjects || []) {
      const logs = (subject.attendance_logs || []).filter(
        (l) => new Date(l.date) >= semStart
      );

      for (const log of logs) {
        const d = new Date(log.date).toLocaleDateString();
        rows.push([
          subject.name,
          subject.code,
          log.scheduled_code || "-",
          d,
          log.timeSlot || "-",
          statusToLabel(log.status),
          log.topic || "-",
          log.is_bio_present ? "YES" : "NO",
          log.bio_override ? "YES" : "NO",
          log.override_reason || "-",
        ]);
      }
    }

    autoTable(doc, {
      startY: 38,
      head: [
        [
          "Subject",
          "Code",
          "Scheduled",
          "Date",
          "Time",
          "Status",
          "Topic",
          "Bio",
          "Override",
          "Reason",
        ],
      ],
      body: rows,
      theme: "grid",
      styles: { fontSize: 8 },
    });

    doc.save("Attendance_Report_Semester_ALL.pdf");
  }

  async function downloadPresentPlusPproxyOnly() {
    const { subjects } = await fetchSubjects();
    const semStart = new Date(SEMESTER.startDate);

    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Attendance Report (PRESENT + P+PROXY • Semester)", 14, 18);
    doc.setFontSize(11);
    doc.text(`Semester start: ${SEMESTER.startDate}`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

    const rows = [];

    for (const subject of subjects || []) {
      const logs = (subject.attendance_logs || [])
        .filter((l) => new Date(l.date) >= semStart)
        .filter((l) => l.status === "green" || l.status === "orange");

      for (const log of logs) {
        const d = new Date(log.date).toLocaleDateString();
        rows.push([
          subject.name,
          subject.code,
          log.scheduled_code || "-",
          d,
          log.timeSlot || "-",
          statusToLabel(log.status),
          log.topic || "-",
          log.is_bio_present ? "YES" : "NO",
          log.bio_override ? "YES" : "NO",
          log.override_reason || "-",
        ]);
      }
    }

    autoTable(doc, {
      startY: 38,
      head: [
        [
          "Subject",
          "Code",
          "Scheduled",
          "Date",
          "Time",
          "Status",
          "Topic",
          "Bio",
          "Override",
          "Reason",
        ],
      ],
      body: rows,
      theme: "grid",
      styles: { fontSize: 8 },
    });

    doc.save("Attendance_Report_Semester_PRESENT_PPROXY.pdf");
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-sm font-black text-gray-400">
        ← BACK TO DASHBOARD
      </Link>

      <h1 className="mt-6 text-5xl font-black">Analytics 📊</h1>
      <div className="mt-2 text-xs font-bold text-gray-500">
        Semester start: {SEMESTER.startDate}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="text-xs font-black text-gray-400">PRESENT + P+PROXY</div>
          <div className="mt-2 text-5xl font-black text-blue-600">
            {presentPlusPproxyPercent}%
          </div>
          <div className="mt-2 text-sm font-bold text-gray-400">
            Total classes counted: {stats.total}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="text-xs font-black text-gray-400">PRESENT ONLY</div>
          <div className="mt-2 text-5xl font-black text-green-600">
            {presentOnlyPercent}%
          </div>
          <div className="mt-2 text-sm font-bold text-gray-400">
            NO CLASS (ignored): {stats.noClass}
          </div>
        </div>
      </div>

      <h2 className="mt-10 text-3xl font-black">Subjects (Semester)</h2>

      <div className="mt-4 space-y-3">
        {perSubject.map((s) => {
          const risky = s.total > 0 && s.teacherPct < s.target;

          return (
            <div
              key={s._id}
              className="bg-white rounded-2xl border border-gray-100 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-black truncate">{s.name}</div>
                  <div className="text-xs font-bold text-gray-500">{s.code}</div>

                  <div className="mt-2 text-xs font-bold text-gray-500">
                    Total: {s.total} • Attended (P+P+Proxy): {s.attended}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-gray-400">Teacher%</div>
                  <div className={`text-2xl font-black ${risky ? "text-red-600" : "text-green-600"}`}>
                    {s.teacherPct}%
                  </div>

                  <div className="mt-1 text-xs font-black text-gray-400">Bio%</div>
                  <div className="text-lg font-black">{s.bioPct}%</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="text-xs font-black text-gray-500">
                  Target %
                </div>

                <input
                  type="number"
                  value={targets[s._id] ?? 75}
                  onChange={(e) =>
                    setTargets((p) => ({ ...p, [s._id]: e.target.value }))
                  }
                  className="w-20 border border-gray-200 rounded-xl px-3 py-2 font-black"
                  min={0}
                  max={100}
                />

                <button
                  onClick={() => saveTarget(s)}
                  disabled={Boolean(saving[s._id])}
                  className="px-4 py-2 rounded-xl bg-black text-white font-black disabled:opacity-40"
                >
                  {saving[s._id] ? "Saving..." : "Save"}
                </button>

                {risky ? (
                  <div className="ml-auto px-2 py-1 rounded-xl bg-red-50 text-red-700 text-xs font-black">
                    Below target
                  </div>
                ) : (
                  <div className="ml-auto px-2 py-1 rounded-xl bg-green-50 text-green-700 text-xs font-black">
                    Safe
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {perSubject.length === 0 ? (
          <div className="text-sm font-bold text-gray-400">
            No subjects found.
          </div>
        ) : null}
      </div>

      <h2 className="mt-10 text-3xl font-black">Download Reports (Semester)</h2>

      <div className="mt-4 space-y-3">
        <button
          onClick={downloadCompleteReport}
          className="w-full bg-black text-white py-4 rounded-2xl font-black flex items-center justify-between px-6"
        >
          Complete Report <span>📄</span>
        </button>

        <button
          onClick={downloadPresentPlusPproxyOnly}
          className="w-full bg-white border border-gray-200 text-gray-900 py-4 rounded-2xl font-black flex items-center justify-between px-6"
        >
          Present + P+Proxy Only <span>📄</span>
        </button>
      </div>
    </div>
  );
}

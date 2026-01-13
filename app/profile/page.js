// app/profile/page.js
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    pproxy: 0,
    proxy: 0,
    absent: 0,
    noClass: 0,
  });

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/analytics?ts=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setStats(data);
    }
    load();
  }, []);

  const presentPlusPproxyPercent =
    stats.total > 0 ? Math.round(((stats.present + stats.pproxy) / stats.total) * 100) : 0;

  const presentOnlyPercent =
    stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  // ---- PDF helpers (same idea as your current code, but fixed NO CLASS mapping) ----
  async function fetchSubjects() {
    const res = await fetch(`/api/subjects?ts=${Date.now()}`, { cache: "no-store" });
    return res.json();
  }

  function statusToLabel(status) {
    if (status === "green") return "PRESENT";
    if (status === "orange") return "P+PROXY";
    if (status === "black") return "PROXY";
    if (status === "red") return "ABSENT";
    return "NO CLASS";
  }

  async function downloadCompleteReport() {
    const { subjects } = await fetchSubjects();

    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Attendance Report (Complete)", 14, 18);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

    const rows = [];

    for (const subject of subjects || []) {
      const logs = subject.attendance_logs || [];
      for (const log of logs) {
        const d = new Date(log.date).toLocaleDateString();
        rows.push([
          subject.name,
          subject.code,
          d,
          log.timeSlot || "-",
          statusToLabel(log.status),
          log.topic || "-",
        ]);
      }
    }

    autoTable(doc, {
      startY: 32,
      head: [["Subject", "Code", "Date", "Time", "Status", "Topic"]],
      body: rows,
      theme: "grid",
    });

    doc.save("Attendance_Report_ALL.pdf");
  }

  async function downloadPresentPlusPproxyOnly() {
    const { subjects } = await fetchSubjects();

    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Attendance Report (Present + P+Proxy Only)", 14, 18);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

    const rows = [];

    for (const subject of subjects || []) {
      const logs = (subject.attendance_logs || []).filter(
        (l) => l.status === "green" || l.status === "orange"
      );

      for (const log of logs) {
        const d = new Date(log.date).toLocaleDateString();
        rows.push([
          subject.name,
          subject.code,
          d,
          log.timeSlot || "-",
          statusToLabel(log.status),
          log.topic || "-",
        ]);
      }
    }

    autoTable(doc, {
      startY: 32,
      head: [["Subject", "Code", "Date", "Time", "Status", "Topic"]],
      body: rows,
      theme: "grid",
    });

    doc.save("Attendance_Report_PRESENT_PPROXY.pdf");
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-sm font-black text-gray-400">
        ← BACK TO DASHBOARD
      </Link>

      <h1 className="mt-6 text-5xl font-black">Analytics 📊</h1>

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

      <h2 className="mt-10 text-3xl font-black">Download Reports</h2>

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


// components/PdfButton.js
"use client";

import { useState } from "react";

function statusLabel(status) {
  if (status === "green") return "PRESENT";
  if (status === "orange") return "P+PROXY";
  if (status === "black") return "PROXY";
  if (status === "red") return "ABSENT";
  return "NO CLASS";
}

function bioLabel(log) {
  if (log.bio_done_at_save) return "✅";
  if (log.bio_override) return "⚠️ OVERRIDE";
  return "❌";
}

export default function PdfButton({ subjectName, logs, subjectCode }) {
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    setLoading(true);
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Attendance Report", 14, 18);
    doc.setFontSize(11);
    doc.text(`Subject: ${subjectName}`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

    const sorted = [...logs].sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      if (da !== db) return da - db;
      return (a.timeSlot || "").localeCompare(b.timeSlot || "");
    });

    let lastDate = "";
    const rows = sorted.map((log) => {
      const d = new Date(log.date).toLocaleDateString();
      const showDate = d === lastDate ? "" : d;
      lastDate = d;

      const swap =
        log.scheduled_code && subjectCode && log.scheduled_code !== subjectCode
          ? `SWAP(${log.scheduled_code}→${subjectCode})`
          : "";

      return [
        showDate,
        log.timeSlot || "-",
        statusLabel(log.status),
        log.topic || "-",
        bioLabel(log),
        swap || "-",
      ];
    });

    autoTable(doc, {
      startY: 38,
      head: [["Date", "Time", "Status", "Topic", "BIO", "SWAP"]],
      body: rows,
      theme: "grid",
    });

    doc.save(`${subjectName}_Report.pdf`);
    setLoading(false);
  };

  return (
    <button
      onClick={generatePDF}
      disabled={loading}
      className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-sm active:scale-95 transition"
    >
      {loading ? "Generating..." : "Download PDF 📄"}
    </button>
  );
}

// components/PdfButton.js
"use client";
import { useState } from 'react';

export default function PdfButton({ subjectName, logs }) {
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    setLoading(true);
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Attendance Report", 14, 20);
    doc.setFontSize(12);
    doc.text(`Subject: ${subjectName}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

    // Sort by Date (Oldest to Newest looks better for lists)
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Logic to hide duplicate dates
    let lastDate = "";
    
    const tableRows = sortedLogs.map(log => {
      const currentDate = new Date(log.date).toLocaleDateString();
      const showDate = currentDate !== lastDate; // Only show if different from row above
      lastDate = currentDate;

      return [
        showDate ? currentDate : "", // Show date or blank
        log.status.toUpperCase(),
        log.topic || "-",
        log.status === 'black' ? 'PROXY' : (log.status === 'green' ? 'REAL' : (log.status === 'grey' ? 'CLOSED' : '-'))
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Status', 'Topic', 'Type']],
      body: tableRows,
      theme: 'grid',
      // ... (Rest of styling logic remains same)
    });

    const pdfBlob = doc.output('bloburl');
    // ... (Download logic remains same)
    const link = document.createElement('a');
    link.href = pdfBlob;
    link.download = `${subjectName}_Report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setLoading(false);
  };

  return (
    <button 
      onClick={generatePDF} 
      disabled={loading}
      className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-bold shadow-md active:scale-95 transition-transform"
    >
      {loading ? "Generating..." : "Download PDF 📄"}
    </button>
  );
}

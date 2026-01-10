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

    const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const tableRows = sortedLogs.map(log => [
      new Date(log.date).toLocaleDateString(),
      log.status.toUpperCase(),
      log.topic || "-",
      log.status === 'black' ? 'PROXY' : (log.status === 'green' ? 'REAL' : (log.status === 'grey' ? 'CLOSED' : '-'))
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Status', 'Topic', 'Type']],
      body: tableRows,
      theme: 'grid',
      didParseCell: function (data) {
        if (data.column.index === 1) {
          const s = data.cell.raw;
          if (s === 'GREEN') data.cell.styles.textColor = [0, 150, 0];
          if (s === 'RED' || s === 'ORANGE') data.cell.styles.textColor = [200, 0, 0];
          if (s === 'GREY') data.cell.styles.textColor = [150, 150, 150];
          if (s === 'BLACK') {
             data.cell.styles.textColor = [0, 0, 0];
             data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    const pdfBlob = doc.output('bloburl');
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


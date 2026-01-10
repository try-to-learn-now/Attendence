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

    // 1. Header
    doc.setFontSize(18);
    doc.text("Attendance Report", 14, 20);
    doc.setFontSize(12);
    doc.text(`Subject: ${subjectName}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

    // 2. Data Processing (Sort Oldest to Newest)
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Variables to track duplicate dates
    let lastDate = "";

    const tableRows = sortedLogs.map(log => {
      // Date Formatting
      const currentDate = new Date(log.date).toLocaleDateString();
      
      // Logic: If date is same as previous row, show empty string
      const displayDate = currentDate === lastDate ? "" : currentDate;
      lastDate = currentDate; // Update tracker

      // Logic: The Type Column (The Fix)
      let typeLabel = "-";
      if (log.status === 'green') typeLabel = "REAL";
      if (log.status === 'orange') typeLabel = "BUNK";    // <--- FIXED
      if (log.status === 'black') typeLabel = "PROXY";
      if (log.status === 'red') typeLabel = "ABSENT";     // <--- FIXED
      if (log.status === 'grey') typeLabel = "CLOSED";

      return [
        displayDate,              // Column 1: Date (Clean)
        log.status.toUpperCase(), // Column 2: Status Code
        log.topic || "-",         // Column 3: Topic
        typeLabel                 // Column 4: Description (Corrected)
      ];
    });

    // 3. Create Table
    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Status', 'Topic', 'Type']],
      body: tableRows,
      theme: 'grid',
      didParseCell: function (data) {
        // Color Coding Logic
        if (data.column.index === 1) { // Status Column
          const s = data.cell.raw;
          if (s === 'GREEN') data.cell.styles.textColor = [0, 150, 0];   // Green
          if (s === 'ORANGE') data.cell.styles.textColor = [255, 165, 0]; // Orange
          if (s === 'RED') data.cell.styles.textColor = [200, 0, 0];     // Red
          if (s === 'BLACK') {
             data.cell.styles.textColor = [0, 0, 0];
             data.cell.styles.fontStyle = 'bold';
          }
          if (s === 'GREY') data.cell.styles.textColor = [150, 150, 150];
        }
      }
    });

    // 4. Save
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

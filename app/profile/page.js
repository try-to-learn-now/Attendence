// app/profile/page.js
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const [stats, setStats] = useState({ total: 0, real: 0, bunk: 0, proxy: 0, absent: 0 });
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  const downloadReport = async (type) => {
    setLoading(true);
    
    // 1. Fetch RAW Data (We reuse the Generate API but ask for JSON now)
    // NOTE: You need to update api/pdf/generate to return JSON if we ask for it, 
    // OR simply fetch all subjects here. Let's fetch subjects directly for simplicity.
    const res = await fetch('/api/subjects');
    const response = await res.json();
    const subjects = response.data;

    // 2. Load PDF Libraries dynamically
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();

    // 3. Header
    doc.setFontSize(18);
    doc.text("Nitesh ERP - Global Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Type: ${type} | Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    // 4. Process Data
    let rows = [];
    
    subjects.forEach(sub => {
        sub.attendance_logs.forEach(log => {
            rows.push({
                rawDate: new Date(log.date),
                date: new Date(log.date).toLocaleDateString(),
                subject: sub.name,
                status: log.status.toUpperCase(),
                type: log.status === 'green' ? 'REAL' : (log.status === 'orange' ? 'BUNK' : (log.status === 'black' ? 'PROXY' : 'ABSENT'))
            });
        });
    });

    // Sort Newest First
    rows.sort((a, b) => b.rawDate - a.rawDate);

    // Apply Filters
    if (type === 'REAL_BUNK') {
        rows = rows.filter(r => r.status === 'GREEN' || r.status === 'ORANGE');
    }

    // Hide Duplicate Dates
    let lastDate = "";
    const finalRows = rows.map(r => {
        const showDate = r.date !== lastDate;
        lastDate = r.date;
        return [showDate ? r.date : "", r.subject, r.status, r.type];
    });

    // 5. Generate Table
    autoTable(doc, {
        startY: 35,
        head: [['Date', 'Subject', 'Status', 'Type']],
        body: finalRows,
        theme: 'grid',
        didParseCell: (data) => {
            if (data.column.index === 2) { // Color Status
                const t = data.cell.raw;
                if (t === 'GREEN') data.cell.styles.textColor = [0, 150, 0];
                if (t === 'ORANGE') data.cell.styles.textColor = [255, 165, 0];
                if (t === 'RED') data.cell.styles.textColor = [200, 0, 0];
            }
        }
    });

    // 6. Save
    doc.save(`Attendance_Report_${type}.pdf`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link href="/" className="text-sm font-bold text-gray-400 mb-6 block">← BACK TO DASHBOARD</Link>
      
      <h1 className="text-3xl font-black mb-8">Analytics 📊</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100">
           <p className="text-xs font-bold text-gray-400 uppercase">Real + Bunk</p>
           <p className="text-3xl font-black text-blue-600">
             {stats.total > 0 ? Math.round(((stats.real + stats.bunk) / stats.total) * 100) : 0}%
           </p>
           <p className="text-xs text-gray-400 mt-1">Biometric</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100">
           <p className="text-xs font-bold text-gray-400 uppercase">Real Only</p>
           <p className="text-3xl font-black text-green-600">
             {stats.total > 0 ? Math.round((stats.real / stats.total) * 100) : 0}%
           </p>
           <p className="text-xs text-gray-400 mt-1">Classroom</p>
        </div>
      </div>

      {/* Download Buttons */}
      <h2 className="text-lg font-bold mb-4 text-gray-800">Download Reports</h2>
      <div className="space-y-3">
        <button onClick={() => downloadReport('ALL')} disabled={loading} className="w-full bg-black text-white p-4 rounded-xl font-bold flex justify-between items-center active:scale-95 transition">
           <span>{loading ? "Generating..." : "Complete Report"}</span>
           <span>📄</span>
        </button>
        
        <button onClick={() => downloadReport('REAL_BUNK')} disabled={loading} className="w-full bg-white border border-gray-200 text-gray-800 p-4 rounded-xl font-bold flex justify-between items-center active:scale-95 transition">
           <span>Real + Bunk Only</span>
           <span className="text-orange-500">📄</span>
        </button>
      </div>
    </div>
  );
}

// app/api/pdf/generate/route.js
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import DailyLog from '@/models/DailyLog';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); 

  const subjects = await Subject.find({});
  const dailyLogs = await DailyLog.find({});

  // 1. Better CSS for the Table
  let htmlContent = `
    <html>
      <head>
        <title>Nitesh ERP Report</title>
        <style>
          body { font-family: sans-serif; padding: 20px; font-size: 12px; }
          h1 { margin-bottom: 5px; }
          p { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f3f4f6; text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
          td { border-bottom: 1px solid #eee; padding: 10px; vertical-align: middle; }
          
          /* Status Colors */
          .status-tag { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; }
          .green { background: #dcfce7; color: #166534; }   /* Present */
          .orange { background: #ffedd5; color: #9a3412; }  /* P+Proxy */
          .black { background: #f3f4f6; color: #1f2937; }   /* Proxy */
          .red { background: #fee2e2; color: #991b1b; }     /* Absent */
          .grey { color: #9ca3af; }                          /* No Class */
        </style>
      </head>
      <body>
        <h1>Attendance Report</h1>
        <p>Type: <strong>${type}</strong> | Generated: ${new Date().toLocaleString()}</p>
        
        <table>
          <thead>
            <tr>
              <th style="width: 40%">Subject</th>
              <th style="width: 20%">Date</th>
              <th style="width: 20%">Time</th>
              <th style="width: 20%">Status</th>
            </tr>
          </thead>
          <tbody>
  `;

  let allLogs = [];
  subjects.forEach(sub => {
    sub.attendance_logs.forEach(log => {
      allLogs.push({
        dateObj: new Date(log.date),
        dateStr: new Date(log.date).toLocaleDateString(),
        subject: sub.name,
        code: sub.code,
        time: log.timeSlot || "-",
        status: log.status,
      });
    });
  });

  // Sort by Date (Newest First)
  allLogs.sort((a, b) => b.dateObj - a.dateObj);

  if (type === 'BIO_ONLY') {
    dailyLogs.forEach(log => {
      htmlContent += `
        <tr>
          <td><strong>BIOMETRIC LOG</strong></td>
          <td>${log.dateString}</td>
          <td>-</td>
          <td>${log.biometric_done ? '✅ DONE' : '❌ MISSED'}</td>
        </tr>`;
    });
  } else {
    allLogs.forEach(log => {
      // Filter Logic
      if (type === 'REAL_BUNK' && !['green', 'orange'].includes(log.status)) return;

      // Status Label Logic
      let label = "UNKNOWN";
      let colorClass = "grey";
      
      if (log.status === 'green') { label = "PRESENT"; colorClass = "green"; }
      if (log.status === 'orange') { label = "P+PROXY"; colorClass = "orange"; }
      if (log.status === 'black') { label = "PROXY"; colorClass = "black"; }
      if (log.status === 'red') { label = "ABSENT"; colorClass = "red"; }
      if (log.status === 'grey') { label = "NO CLASS"; colorClass = "grey"; }

      htmlContent += `
        <tr>
          <td>
            <div style="font-weight:bold">${log.subject}</div>
            <div style="font-size:10px; color:#999">${log.code}</div>
          </td>
          <td>${log.dateStr}</td>
          <td>${log.time}</td>
          <td><span class="status-tag ${colorClass}">${label}</span></td>
        </tr>
      `;
    });
  }

  htmlContent += `</tbody></table><script>window.print();</script></body></html>`;
  
  return new NextResponse(htmlContent, { headers: { 'Content-Type': 'text/html' } });
}

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

  let htmlContent = `
    <html>
      <head>
        <title>Attendance Report</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .green { color: green; font-weight: bold; }
          .orange { color: orange; font-weight: bold; }
          .red { color: red; font-weight: bold; }
          .black { color: black; font-weight: bold; text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>Nitesh ERP Report</h1>
        <p>Type: ${type}</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr><th>Date</th><th>Subject</th><th>Status</th><th>Type</th></tr>
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
        status: log.status,
        type: log.status === 'green' ? 'PRESENT' : (log.status === 'orange' ? 'P+PROXY' : (log.status === 'black' ? 'PROXY' : 'ABSENT'))
      });
    });
  });

  allLogs.sort((a, b) => b.dateObj - a.dateObj);

  if (type === 'BIO_ONLY') {
    dailyLogs.forEach(log => {
      htmlContent += `<tr><td>${log.dateString}</td><td>BIOMETRIC</td><td>${log.biometric_done ? 'DONE' : 'MISSED'}</td><td>-</td></tr>`;
    });
  } else {
    let lastDate = "";
    allLogs.forEach(log => {
      if (type === 'REAL_BUNK' && (log.status !== 'green' && log.status !== 'orange')) return;
      
      const displayDate = log.dateStr === lastDate ? "" : log.dateStr;
      lastDate = log.dateStr;
      let colorClass = log.status === 'green' ? 'green' : (log.status === 'red' ? 'red' : 'orange');

      htmlContent += `<tr><td>${displayDate}</td><td>${log.subject}</td><td class="${colorClass}">${log.status.toUpperCase()}</td><td>${log.type}</td></tr>`;
    });
  }

  htmlContent += `</tbody></table><script>window.print();</script></body></html>`;
  
  return new NextResponse(htmlContent, { headers: { 'Content-Type': 'text/html' } });
}

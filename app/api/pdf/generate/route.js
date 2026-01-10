// app/api/pdf/generate/route.js
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import DailyLog from '@/models/DailyLog';
import { NextResponse } from 'next/server';

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'ALL', 'BIO_ONLY', 'REAL_BUNK'

  // Fetch all data
  const subjects = await Subject.find({});
  const dailyLogs = await DailyLog.find({});

  // Generate HTML for Printing
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
        </style>
      </head>
      <body>
        <h1>Nitesh ERP Report</h1>
        <p>Type: ${type}</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
  `;

  // Flatten logs
  let allLogs = [];
  subjects.forEach(sub => {
    sub.attendance_logs.forEach(log => {
      allLogs.push({
        date: new Date(log.date),
        subject: sub.name,
        code: sub.code,
        status: log.status,
        type: log.status === 'green' ? 'REAL' : (log.status === 'orange' ? 'BUNK' : log.status)
      });
    });
  });

  // Sort by Date
  allLogs.sort((a, b) => b.date - a.date);

  // Filter based on Type
  if (type === 'BIO_ONLY') {
    htmlContent += `<tr><td colspan="4"><strong>Biometric Logs</strong></td></tr>`;
    dailyLogs.forEach(log => {
      htmlContent += `
        <tr>
          <td>${log.dateString}</td>
          <td>BIOMETRIC</td>
          <td>${log.biometric_done ? 'DONE' : 'MISSED'}</td>
          <td>-</td>
        </tr>
      `;
    });
  } else {
    allLogs.forEach(log => {
      let colorClass = log.status === 'green' ? 'green' : (log.status === 'red' ? 'red' : 'orange');
      
      if (type === 'REAL_BUNK' && (log.status !== 'green' && log.status !== 'orange')) return;

      htmlContent += `
        <tr>
          <td>${log.date.toLocaleDateString()}</td>
          <td>${log.subject} (${log.code})</td>
          <td class="${colorClass}">${log.status.toUpperCase()}</td>
          <td>${log.type}</td>
        </tr>
      `;
    });
  }

  htmlContent += `
          </tbody>
        </table>
        <script>window.print();</script>
      </body>
    </html>
  `;

  return new NextResponse(htmlContent, {
    headers: { 'Content-Type': 'text/html' },
  });
}

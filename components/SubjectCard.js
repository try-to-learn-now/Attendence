// components/SubjectCard.js
"use client";
import { useState, useEffect } from 'react';
import PdfButton from './PdfButton';

export default function SubjectCard({ subjectName, subjectCode, classTime, isScheduled }) {
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState({ teacher: 0, bio: 0 });
  const [logs, setLogs] = useState([]);

  // Helper to refresh data WITHOUT reloading page
  const refreshData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`/api/attendance/check?code=${subjectCode}&date=${today}`);
    const data = await res.json();
    if(data.status) setStatus(data.status);
    if(data.stats) setStats(data.stats);
    if(data.logs) setLogs(data.logs);
  };

  useEffect(() => {
    refreshData();
  }, [subjectCode]);

  const mark = async (color) => {
    setStatus(color); // Instant feedback
    await fetch('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({
        code: subjectCode,
        name: subjectName,
        status: color,
        date: new Date(),
        topic: "", 
      })
    });
    await refreshData(); // Background refresh
  };

  return (
    <div className={`relative p-5 rounded-2xl border transition-all ${status ? 'border-gray-300 bg-gray-50' : 'border-transparent bg-white shadow-md'}`}>
      
      <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-xs font-bold ${isScheduled ? 'bg-black text-white' : 'bg-orange-500 text-white'}`}>
        {classTime}
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-black text-gray-800 leading-tight">{subjectName}</h3>
        <p className="text-xs font-mono text-gray-400 mt-1">CODE: {subjectCode}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
         <div className="bg-red-50 p-2 rounded-lg text-center">
            <p className="text-[10px] font-bold text-red-800 uppercase">Marks/Teacher</p>
            <p className="text-xl font-black text-red-600">{stats.teacher}%</p>
         </div>
         <div className="bg-orange-50 p-2 rounded-lg text-center">
            <p className="text-[10px] font-bold text-orange-800 uppercase">Biometric</p>
            <p className="text-xl font-black text-orange-600">{stats.bio}%</p>
         </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button onClick={() => mark('green')} className={`flex-1 py-3 rounded-xl font-bold text-xs ${status === 'green' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}>REAL</button>
        <button onClick={() => mark('orange')} className={`flex-1 py-3 rounded-xl font-bold text-xs ${status === 'orange' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700'}`}>BUNK</button>
        <button onClick={() => mark('black')} className={`flex-1 py-3 rounded-xl font-bold text-xs ${status === 'black' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}>PROXY</button>
        <button onClick={() => mark('red')} className={`flex-1 py-3 rounded-xl font-bold text-xs ${status === 'red' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}>ABSENT</button>
      </div>

      <PdfButton subjectName={subjectName} logs={logs} />
    </div>
  );
                                                                                                     }

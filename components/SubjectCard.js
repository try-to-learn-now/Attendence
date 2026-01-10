// components/SubjectCard.js
"use client";
import { useState, useEffect } from 'react';

export default function SubjectCard({ subjectName, subjectCode, classTime, isScheduled }) {
  const [status, setStatus] = useState(null); // 'green', 'orange', etc.

  // Fetch today's status on load
  useEffect(() => {
    // We fetch logs for this specific subject for TODAY
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/attendance/check?code=${subjectCode}&date=${today}`)
      .then(res => res.json())
      .then(res => {
        if(res.status) setStatus(res.status);
      });
  }, [subjectCode]);

  const mark = async (color) => {
    setStatus(color);
    await fetch('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({
        code: subjectCode,
        name: subjectName, // Send name just in case DB needs to create it
        status: color,
        date: new Date(),
        timeSlot: classTime
      })
    });
  };

  return (
    <div className={`relative p-5 rounded-2xl border transition-all ${status ? 'border-gray-300 bg-gray-50' : 'border-transparent bg-white shadow-md'}`}>
      
      {/* Time Badge */}
      <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-xs font-bold ${isScheduled ? 'bg-black text-white' : 'bg-orange-500 text-white'}`}>
        {classTime}
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-black text-gray-800 leading-tight">{subjectName}</h3>
        <p className="text-xs font-mono text-gray-400 mt-1">CODE: {subjectCode}</p>
      </div>

      {/* Minimalist Buttons */}
      <div className="flex gap-2">
        <button onClick={() => mark('green')} className={`flex-1 py-3 rounded-xl font-bold text-xs transition ${status === 'green' ? 'bg-green-600 text-white shadow-lg ring-2 ring-green-200' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
          REAL
        </button>
        <button onClick={() => mark('orange')} className={`flex-1 py-3 rounded-xl font-bold text-xs transition ${status === 'orange' ? 'bg-orange-500 text-white shadow-lg ring-2 ring-orange-200' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>
          BUNK
        </button>
        <button onClick={() => mark('black')} className={`flex-1 py-3 rounded-xl font-bold text-xs transition ${status === 'black' ? 'bg-gray-800 text-white shadow-lg ring-2 ring-gray-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          PROXY
        </button>
        <button onClick={() => mark('red')} className={`flex-1 py-3 rounded-xl font-bold text-xs transition ${status === 'red' ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-200' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
          ABSENT
        </button>
      </div>
    </div>
  );
            }

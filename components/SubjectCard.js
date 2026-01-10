// components/SubjectCard.js
"use client";
import { useState } from 'react';
import PdfButton from './PdfButton';

export default function SubjectCard({ subject }) {
  const [logs, setLogs] = useState(subject.attendance_logs);

  const validClasses = logs.filter(l => l.status !== 'grey').length;
  const teacherPresent = logs.filter(l => l.status === 'green' || l.status === 'black').length;
  const bioPresent = logs.filter(l => l.status === 'green' || l.status === 'orange').length;

  const teacherPercent = validClasses > 0 ? ((teacherPresent / validClasses) * 100).toFixed(1) : 0;
  const bioPercent = validClasses > 0 ? ((bioPresent / validClasses) * 100).toFixed(1) : 0;

  const markAttendance = async (status) => {
    let topic = "";
    if (status !== 'grey') {
        topic = prompt("Topic taught today? (Leave empty if none)");
    }
    
    const res = await fetch('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({
        subjectId: subject._id,
        status,
        topic: topic || "",
        date: new Date()
      })
    });

    if (res.ok) window.location.reload(); 
    else alert("Failed to save!");
  };

  // NEW: Edit The Routine
  const handleEdit = async () => {
    const newName = prompt("Edit Subject Name:", subject.name);
    const newCode = prompt("Edit Subject Code:", subject.code);
    
    // Pre-fill the existing schedule so you can just edit it
    const currentScheduleStr = subject.schedule 
        ? subject.schedule.map(s => `${s.day}-${s.time}`).join(', ')
        : "";

    const newScheduleStr = prompt(
      "Edit Routine (Day-Time, comma separated)\n0=Sun, 1=Mon, 2=Tue...\nExample: 1-10:00AM, 3-02:00PM",
      currentScheduleStr
    );

    if (newName && newCode) {
        const newSchedule = [];
        if (newScheduleStr) {
          const parts = newScheduleStr.split(',');
          parts.forEach(p => {
            const [d, t] = p.trim().split('-');
            if(d && t) newSchedule.push({ day: parseInt(d), time: t });
          });
        }

        await fetch('/api/subjects', {
            method: 'PUT',
            body: JSON.stringify({ _id: subject._id, name: newName, code: newCode, schedule: newSchedule })
        });
        window.location.reload();
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm mb-6 border border-gray-100 relative">
      {/* The Magic Edit Button */}
      <button onClick={handleEdit} className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 text-xl font-bold p-2">
        ✎
      </button>

      <div className="flex justify-between items-center mb-4">
        <div>
            <h2 className="text-xl font-bold text-gray-800">{subject.name}</h2>
            <p className="text-xs text-gray-500 font-mono">{subject.code}</p>
        </div>
        <div className="text-xs text-gray-400 mr-8">{validClasses} Classes Held</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className={`p-3 rounded-xl text-center ${teacherPercent < 75 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">Marks/Teacher</div>
          <div className="text-3xl font-black">{teacherPercent}%</div>
        </div>
        <div className={`p-3 rounded-xl text-center ${bioPercent < 75 ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">Biometric</div>
          <div className="text-3xl font-black">{bioPercent}%</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1 mb-2">
        <button onClick={() => markAttendance('green')} className="bg-green-500 text-white py-3 rounded-lg text-[10px] font-bold">REAL</button>
        <button onClick={() => markAttendance('orange')} className="bg-orange-400 text-white py-3 rounded-lg text-[10px] font-bold">BUNK</button>
        <button onClick={() => markAttendance('black')} className="bg-gray-800 text-white py-3 rounded-lg text-[10px] font-bold">PROXY</button>
        <button onClick={() => markAttendance('red')} className="bg-red-500 text-white py-3 rounded-lg text-[10px] font-bold">ABSENT</button>
        <button onClick={() => markAttendance('grey')} className="bg-gray-300 text-gray-700 py-3 rounded-lg text-[10px] font-bold">CLOSED</button>
      </div>
      
      <PdfButton subjectName={subject.name} logs={logs} />
    </div>
  );
  }

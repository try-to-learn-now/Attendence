// components/SubjectCard.js
"use client";
import { useState, useEffect } from 'react';
import PdfButton from './PdfButton';
import { ALL_SUBJECTS } from '@/lib/universal_data';

// Added selectedDate prop for History Mode
export default function SubjectCard({ subjectName, subjectCode, classTime, isScheduled, selectedDate }) {
  const [activeCode, setActiveCode] = useState(subjectCode);
  const [activeName, setActiveName] = useState(subjectName);
  
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState({ teacher: 0, bio: 0 });
  const [counts, setCounts] = useState({ total: 0, present: 0 }); // NEW: Raw counts
  const [logs, setLogs] = useState([]);

  const refreshData = async () => {
    // Uses the Selected Date (defaults to Today in parent)
    // IMPORTANT: Make sure `selectedDate` is YYYY-MM-DD string
    const res = await fetch(`/api/attendance/check?code=${activeCode}&date=${selectedDate}`);
    const data = await res.json();
    if(data.status) setStatus(data.status);
    if(data.stats) setStats(data.stats);
    if(data.logs) {
        setLogs(data.logs);
        // Calc raw counts
        const valid = data.logs.filter(l => l.status !== 'grey').length;
        const present = data.logs.filter(l => l.status === 'green' || l.status === 'orange').length;
        setCounts({ total: valid, present });
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeCode, selectedDate]); // Refresh if Swapped or Date Changed

  const mark = async (color) => {
    let finalTime = classTime;

    // LOGIC: Only ask for time if it is an EXTRA class
    if (classTime === "Extra" || !isScheduled) {
        const userTime = prompt("🕒 Enter Class Time (e.g. 2:00 PM):");
        if (!userTime || userTime.trim() === "") {
            alert("⚠️ Time is required for Extra Classes! Action Cancelled.");
            return; 
        }
        finalTime = userTime;
    } 
    // IF SWAP: classTime is already set (e.g. "10:00 AM"), so we use that.

    setStatus(color);
    await fetch('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({
        code: activeCode,
        name: activeName,
        status: color,
        date: selectedDate, // Use history date
        timeSlot: finalTime,
        topic: "", 
      })
    });
    await refreshData();
  };

  const handleSwap = () => {
    // SWAP LOGIC: Just change the "Label". Time stays the same.
    const input = prompt("Swap Subject? Enter Name or Code:");
    if (!input) return;

    const val = input.toLowerCase();
    const found = ALL_SUBJECTS.find(s => 
       s.name.toLowerCase().includes(val) || s.code.toLowerCase() === val
    );

    if (found) {
        setActiveCode(found.code);
        setActiveName(found.name);
        // UI updates, but timeSlot remains the same (e.g. "10:00 AM")
    } else {
        alert("Subject not found!");
    }
  };

  return (
    <div className={`relative p-5 rounded-2xl border transition-all duration-300 ${status ? 'border-gray-300 bg-gray-50' : 'border-transparent bg-white shadow-md'}`}>
      
      <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-xs font-bold ${isScheduled ? 'bg-black text-white' : 'bg-orange-500 text-white'}`}>
        {classTime}
      </div>

      <button onClick={handleSwap} className="absolute top-8 right-2 p-2 text-gray-300 hover:text-blue-600">✎</button>

      <div className="mb-4 pr-8">
        <h3 className="text-lg font-black text-gray-800 leading-tight">{activeName}</h3>
        <p className="text-xs font-mono text-gray-400 mt-1 font-bold">CODE: {activeCode}</p>
        
        {/* NEW: Total / Present Counts */}
        <div className="mt-2 flex gap-3 text-[10px] font-bold text-gray-400">
            <span>TOTAL: <span className="text-black text-xs">{counts.total}</span></span>
            <span>PRESENT: <span className="text-green-600 text-xs">{counts.present}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
         <div className="bg-red-50 p-2 rounded-lg text-center border border-red-100">
            <p className="text-[10px] font-bold text-red-800 uppercase">Teacher</p>
            <p className="text-xl font-black text-red-600">{stats.teacher}%</p>
         </div>
         <div className="bg-blue-50 p-2 rounded-lg text-center border border-blue-100">
            <p className="text-[10px] font-bold text-blue-800 uppercase">Biometric</p>
            <p className="text-xl font-black text-blue-600">{stats.bio}%</p>
         </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button onClick={() => mark('green')} className={`flex-1 py-3 rounded-xl font-bold text-xs ${status === 'green' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}>REAL</button>
        <button onClick={() => mark('orange')} className={`flex-1 py-3 rounded-xl font-bold text-xs ${status === 'orange' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700'}`}>BUNK</button>
        <button onClick={() => mark('black')} className={`flex-1 py-3 rounded-xl font-bold text-xs ${status === 'black' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}>PROXY</button>
        <button onClick={() => mark('red')} className={`flex-1 py-3 rounded-xl font-bold text-xs ${status === 'red' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}>ABSENT</button>
      </div>

      <PdfButton subjectName={activeName} logs={logs} />
    </div>
  );
}

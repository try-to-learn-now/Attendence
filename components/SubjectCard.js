// components/SubjectCard.js
"use client";
import { useState, useEffect } from 'react';
import PdfButton from './PdfButton';
import { ALL_SUBJECTS } from '@/lib/universal_data';

export default function SubjectCard({ subjectName, subjectCode, classTime, isScheduled, selectedDate, biometricDone }) {
  const [activeCode, setActiveCode] = useState(subjectCode);
  const [activeName, setActiveName] = useState(subjectName);
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState({ teacher: 0, bio: 0 });
  const [counts, setCounts] = useState({ total: 0, present: 0 });
  const [logs, setLogs] = useState([]);
  
  // Warning counter for Biometric Override
  const [bioWarningCount, setBioWarningCount] = useState(0);

  const refreshData = async () => {
    const res = await fetch(`/api/attendance/check?code=${activeCode}&date=${selectedDate}`);
    const data = await res.json();
    if(data.status) setStatus(data.status);
    if(data.stats) setStats(data.stats);
    if(data.logs) {
        setLogs(data.logs);
        const valid = data.logs.filter(l => l.status !== 'grey').length;
        const present = data.logs.filter(l => l.status === 'green' || l.status === 'blue' || l.status === 'orange').length;
        setCounts({ total: valid, present });
    }
  };

  useEffect(() => { refreshData(); }, [activeCode, selectedDate]);

  const mark = async (color) => {
    // 1. BIOMETRIC CHECK (The Logic Gate)
    const requiresBio = ['green', 'blue', 'orange'].includes(color);
    
    if (requiresBio && !biometricDone) {
        if (bioWarningCount < 1) {
            alert("⚠️ BIOMETRIC NOT DONE!\nYou cannot mark 'Real', 'Bunk', or 'Bio-Proxy' without Biometric.\n\n(If this is an Online Class, click again to force it.)");
            setBioWarningCount(prev => prev + 1);
            return; // STOP HERE
        }
        // If count >= 1, we allow it (User refused twice)
    }

    // 2. EXTRA CLASS TIME CHECK
    let finalTime = classTime;
    if (classTime === "Extra" || !isScheduled) {
        const userTime = prompt("🕒 Enter Class Time (e.g. 2:00 PM):");
        if (!userTime || userTime.trim() === "") {
            alert("⚠️ Time is required!");
            return; 
        }
        finalTime = userTime;
    } 

    setStatus(color);
    setBioWarningCount(0); // Reset warning
    
    await fetch('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({
        code: activeCode,
        name: activeName,
        status: color,
        date: selectedDate,
        timeSlot: finalTime,
        topic: "", 
      })
    });
    await refreshData();
  };

  const handleSwap = () => {
    const input = prompt("Swap Subject? Enter Name or Code:");
    if (!input) return;
    const val = input.toLowerCase();
    const found = ALL_SUBJECTS.find(s => s.name.toLowerCase().includes(val) || s.code.toLowerCase() === val);
    if (found) { setActiveCode(found.code); setActiveName(found.name); } 
    else { alert("Subject not found!"); }
  };

  return (
    <div className={`relative p-4 rounded-2xl border transition-all duration-300 ${status ? 'border-gray-300 bg-gray-50' : 'border-transparent bg-white shadow-md'}`}>
      <div className="flex justify-between items-start mb-2">
         <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{classTime}</div>
            <h3 className="text-lg font-black text-gray-800 leading-tight">{activeName}</h3>
            <p className="text-xs font-mono text-gray-400 mt-1 font-bold">CODE: {activeCode}</p>
         </div>
         <button onClick={handleSwap} className="text-gray-300 hover:text-blue-600 p-2">✎</button>
      </div>

      {/* Stats */}
      <div className="flex gap-2 text-[10px] font-bold text-gray-400 mb-4 bg-gray-100 p-2 rounded-lg inline-flex">
         <span>Total: <span className="text-black">{counts.total}</span></span>
         <span>Present: <span className="text-green-600">{counts.present}</span></span>
         <span className="ml-2">T: {stats.teacher}% | B: {stats.bio}%</span>
      </div>

      {/* 6 BUTTONS GRID */}
      <div className="grid grid-cols-3 gap-1 mb-2">
        <button onClick={() => mark('green')} className={`py-2 rounded-lg font-bold text-[10px] ${status==='green'?'bg-green-600 text-white':'bg-green-50 text-green-700'}`}>REAL</button>
        <button onClick={() => mark('blue')} className={`py-2 rounded-lg font-bold text-[10px] ${status==='blue'?'bg-blue-600 text-white':'bg-blue-50 text-blue-700'}`}>BIO-PROXY</button>
        <button onClick={() => mark('orange')} className={`py-2 rounded-lg font-bold text-[10px] ${status==='orange'?'bg-orange-500 text-white':'bg-orange-50 text-orange-700'}`}>BUNK</button>
        <button onClick={() => mark('black')} className={`py-2 rounded-lg font-bold text-[10px] ${status==='black'?'bg-gray-800 text-white':'bg-gray-100 text-gray-700'}`}>PROXY</button>
        <button onClick={() => mark('red')} className={`py-2 rounded-lg font-bold text-[10px] ${status==='red'?'bg-red-600 text-white':'bg-red-50 text-red-700'}`}>ABSENT</button>
        <button onClick={() => mark('grey')} className={`py-2 rounded-lg font-bold text-[10px] ${status==='grey'?'bg-gray-400 text-white':'bg-gray-100 text-gray-500'}`}>NO CLASS</button>
      </div>

      <PdfButton subjectName={activeName} logs={logs} />
    </div>
  );
}

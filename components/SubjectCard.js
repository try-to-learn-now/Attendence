// components/SubjectCard.js
"use client";
import { useState, useEffect } from 'react';
import PdfButton from './PdfButton';
import { ALL_SUBJECTS } from '@/lib/universal_data'; // Import list for the Edit feature

export default function SubjectCard({ subjectName, subjectCode, classTime, isScheduled }) {
  // State for Subject Details (Allows Swapping)
  const [activeCode, setActiveCode] = useState(subjectCode);
  const [activeName, setActiveName] = useState(subjectName);
  
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState({ teacher: 0, bio: 0 });
  const [logs, setLogs] = useState([]);

  // Helper to refresh data WITHOUT reloading page
  const refreshData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`/api/attendance/check?code=${activeCode}&date=${today}`);
    const data = await res.json();
    if(data.status) setStatus(data.status);
    if(data.stats) setStats(data.stats);
    if(data.logs) setLogs(data.logs);
  };

  // Re-fetch whenever the code changes (e.g. after a Swap)
  useEffect(() => {
    refreshData();
  }, [activeCode]);

  const mark = async (color) => {
    setStatus(color); // Instant UI feedback
    await fetch('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({
        code: activeCode, // Uses the swapped code if changed
        name: activeName,
        status: color,
        date: new Date(),
        topic: "", 
      })
    });
    await refreshData(); // Background refresh (No Page Reload)
  };

  // The New "Edit/Swap" Feature
  const handleSwap = () => {
    const input = prompt("Swap Subject? Enter Name or Code (e.g. '101' or 'Maths'):");
    if (!input) return;

    const val = input.toLowerCase();
    // Smart Search Logic
    const found = ALL_SUBJECTS.find(s => 
       s.name.toLowerCase().includes(val) || s.code.toLowerCase() === val
    );

    if (found) {
        setActiveCode(found.code);
        setActiveName(found.name);
        // Data will auto-refresh via useEffect
    } else {
        alert("Subject not found! Please check the code/name.");
    }
  };

  return (
    <div className={`relative p-5 rounded-2xl border transition-all duration-300 ${status ? 'border-gray-300 bg-gray-50' : 'border-transparent bg-white shadow-md hover:shadow-lg'}`}>
      
      {/* Time Badge */}
      <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-xs font-bold shadow-sm ${isScheduled ? 'bg-black text-white' : 'bg-orange-500 text-white'}`}>
        {classTime}
      </div>

      {/* Edit / Swap Button */}
      <button 
        onClick={handleSwap}
        className="absolute top-8 right-2 p-2 text-gray-300 hover:text-blue-600 transition-colors"
        title="Swap this subject"
      >
        <span className="text-xl font-bold">✎</span>
      </button>

      <div className="mb-4 pr-8">
        <h3 className="text-lg font-black text-gray-800 leading-tight break-words">{activeName}</h3>
        <p className="text-xs font-mono text-gray-400 mt-1 font-bold">CODE: {activeCode}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
         <div className="bg-red-50 p-2 rounded-lg text-center border border-red-100">
            <p className="text-[10px] font-bold text-red-800 uppercase tracking-wide">Marks/Teacher</p>
            <p className="text-xl font-black text-red-600">{stats.teacher}%</p>
         </div>
         <div className="bg-blue-50 p-2 rounded-lg text-center border border-blue-100">
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">Biometric</p>
            <p className="text-xl font-black text-blue-600">{stats.bio}%</p>
         </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => mark('green')} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 ${status === 'green' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>REAL</button>
        <button onClick={() => mark('orange')} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 ${status === 'orange' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>BUNK</button>
        <button onClick={() => mark('black')} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 ${status === 'black' ? 'bg-gray-800 text-white shadow-lg shadow-gray-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>PROXY</button>
        <button onClick={() => mark('red')} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 ${status === 'red' ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>ABSENT</button>
      </div>

      <PdfButton subjectName={activeName} logs={logs} />
    </div>
  );
                                                                                                     }

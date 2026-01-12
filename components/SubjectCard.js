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
  
  const [isSaving, setIsSaving] = useState(false);
  const [bioWarningCount, setBioWarningCount] = useState(0);

  const refreshData = async () => {
    const res = await fetch(`/api/attendance/check?code=${activeCode}&date=${selectedDate}`);
    const data = await res.json();
    if(data.status) setStatus(data.status);
    if(data.stats) setStats(data.stats);
    if(data.logs) {
        setLogs(data.logs);
        const valid = data.logs.filter(l => l.status !== 'grey').length;
        // Count Green(Present), Orange(P+Proxy), Black(Proxy) as Attended
        const present = data.logs.filter(l => ['green', 'orange', 'black'].includes(l.status)).length;
        setCounts({ total: valid, present });
    }
  };

  useEffect(() => { refreshData(); }, [activeCode, selectedDate]);

  const mark = async (color) => {
    if (isSaving) return;

    // 1. BIOMETRIC LOGIC
    // Green (Present) and Orange (P+Proxy) REQUIRE Biometric
    const requiresBio = ['green', 'orange'].includes(color);
    
    if (requiresBio && !biometricDone) {
        if (bioWarningCount < 1) {
            alert("⚠️ BIOMETRIC MISSING!\n\nYou cannot mark 'Present' or 'P+Proxy' without Biometric.\n(Click again to force override)");
            setBioWarningCount(prev => prev + 1);
            return;
        }
    }

    // 2. TIME LOGIC
    let finalTime = classTime;
    if (classTime === "Extra" || !isScheduled) {
        const userTime = prompt("🕒 Enter Class Time (e.g. 2:00 PM):");
        if (!userTime || userTime.trim() === "") {
            alert("⚠️ Time is required!");
            return; 
        }
        finalTime = userTime;
    } 

    // 3. TOPIC
    let topic = "";
    if (['green', 'orange'].includes(color)) {
        topic = prompt("📝 What was taught today? (Optional)");
    }

    setIsSaving(true);
    setStatus(color);
    setBioWarningCount(0);
    
    try {
        await fetch('/api/attendance', {
          method: 'POST',
          body: JSON.stringify({
            code: activeCode,
            name: activeName,
            status: color,
            date: selectedDate,
            timeSlot: finalTime,
            topic: topic || "", 
          })
        });
        await refreshData();
    } catch (error) {
        alert("❌ Save Failed! Network Error.");
    } finally {
        setIsSaving(false);
    }
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

      <div className="flex gap-2 text-[10px] font-bold text-gray-400 mb-4 bg-gray-100 p-2 rounded-lg inline-flex">
         <span>Total: <span className="text-black">{counts.total}</span></span>
         <span>Attended: <span className="text-green-600">{counts.present}</span></span>
      </div>

      {/* 5 BUTTONS GRID (Exactly as requested) */}
      <div className="grid grid-cols-3 gap-1 mb-2">
        {/* Row 1 */}
        <button disabled={isSaving} onClick={() => mark('green')} className={`py-3 rounded-lg font-bold text-[10px] ${status==='green'?'bg-green-600 text-white':'bg-green-50 text-green-700'}`}>PRESENT</button>
        <button disabled={isSaving} onClick={() => mark('red')} className={`py-3 rounded-lg font-bold text-[10px] ${status==='red'?'bg-red-600 text-white':'bg-red-50 text-red-700'}`}>ABSENT</button>
        <button disabled={isSaving} onClick={() => mark('orange')} className={`py-3 rounded-lg font-bold text-[10px] ${status==='orange'?'bg-orange-500 text-white':'bg-orange-50 text-orange-700'}`}>P+PROXY</button>
        
        {/* Row 2 */}
        <button disabled={isSaving} onClick={() => mark('black')} className={`py-3 rounded-lg font-bold text-[10px] ${status==='black'?'bg-black text-white':'bg-gray-200 text-gray-800'}`}>PROXY</button>
        <button disabled={isSaving} onClick={() => mark('grey')} className={`col-span-2 py-3 rounded-lg font-bold text-[10px] ${status==='grey'?'bg-gray-500 text-white':'bg-gray-100 text-gray-500'}`}>NO CLASS</button>
      </div>

      <PdfButton subjectName={activeName} logs={logs} />
    </div>
  );
        }

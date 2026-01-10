// app/page.js
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WEEKLY_ROUTINE, ALL_SUBJECTS, getSubjectByCode } from '@/lib/universal_data';
import SubjectCard from '@/components/SubjectCard';

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayClasses, setTodayClasses] = useState([]);
  const [extraClassCode, setExtraClassCode] = useState("");
  const [biometricDone, setBiometricDone] = useState(false);
  
  // HELPER: Get correct local date string (YYYY-MM-DD)
  const getLocalDate = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Auto-Detect Day
    const dayIndex = new Date().getDay();
    const routine = WEEKLY_ROUTINE[dayIndex] || [];
    const hydrated = routine.map(slot => ({
      ...slot,
      ...getSubjectByCode(slot.code)
    }));
    hydrated.sort((a, b) => a.time.localeCompare(b.time));
    setTodayClasses(hydrated);

    // Check Biometric (Using LOCAL Date)
    const dateStr = getLocalDate();
    fetch(`/api/daily-log?date=${dateStr}`)
      .then(res => res.json())
      .then(res => setBiometricDone(res.biometric));

    return () => clearInterval(timer);
  }, []);

  const markBiometric = async () => {
    setBiometricDone(true);
    await fetch('/api/daily-log', {
      method: 'POST',
      body: JSON.stringify({ 
        biometric: true, 
        dateString: getLocalDate() // Send LOCAL date
      })
    });
  };

  const dateString = currentTime.toLocaleDateString('en-GB', { 
    weekday: 'long', day: 'numeric', month: 'short' 
  });
  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* Top Bar */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm mb-6 sticky top-0 z-10 flex justify-between items-start">
        <div>
           <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{dateString}</h2>
           <h1 className="text-4xl font-black text-gray-900 mt-1">{timeString}</h1>
        </div>
        <Link href="/profile" className="bg-black text-white p-3 rounded-full shadow-lg active:scale-95 transition">👤</Link>
      </div>

      {/* Biometric */}
      {!biometricDone ? (
        <div className="px-4 mb-6">
          <div className="bg-red-500 text-white p-4 rounded-xl shadow-lg animate-pulse">
            <p className="font-bold text-lg mb-2">⚠️ Mark Biometric First!</p>
            <button onClick={markBiometric} className="w-full bg-white text-red-600 py-3 rounded-lg font-bold">YES, DONE</button>
          </div>
        </div>
      ) : (
        <div className="px-4 mb-6">
           <div className="bg-green-100 text-green-800 p-3 rounded-xl font-bold border border-green-200 text-center">✅ Biometric Logged</div>
        </div>
      )}

      {/* Routine */}
      <div className="px-4 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-2">Today's Routine</h2>
        {todayClasses.length > 0 ? (
          <div className="grid gap-4">
            {todayClasses.map((cls, idx) => (
              <SubjectCard key={idx} subjectName={cls.name} subjectCode={cls.code} classTime={cls.time} isScheduled={true} />
            ))}
          </div>
        ) : (
           <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">No Hardcoded Classes Today 😴</div>
        )}
      </div>

      {/* Extra Class (SMART SEARCH FIX) */}
      <div className="px-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-2">Extra Class?</h2>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           <input 
             list="subjects-list" 
             placeholder="Type 'M' for Maths..." 
             className="w-full text-lg font-bold border-b-2 border-gray-200 py-2 focus:outline-none focus:border-black"
             onChange={(e) => {
                const val = e.target.value.toLowerCase();
                const found = ALL_SUBJECTS.find(s => 
                   s.name.toLowerCase().includes(val) || s.code.toLowerCase() === val
                );
                if(found) setExtraClassCode(found.code);
             }}
           />
           <datalist id="subjects-list">
             {ALL_SUBJECTS.map(s => <option key={s.code} value={s.name}>[{s.code}]</option>)}
           </datalist>

           {extraClassCode && (
             <div className="mt-4 animate-fade-in">
               <SubjectCard 
                 subjectName={getSubjectByCode(extraClassCode).name} 
                 subjectCode={extraClassCode} 
                 classTime="Extra" 
                 isScheduled={false} 
               />
             </div>
           )}
        </div>
      </div>
    </div>
  );
        }

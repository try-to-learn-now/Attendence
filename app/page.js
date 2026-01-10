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
  const [loading, setLoading] = useState(true);
  
  const getLocalDate = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  const loadDashboard = async () => {
    // 1. Get Hardcoded Routine
    const dayIndex = new Date().getDay();
    const routineRaw = WEEKLY_ROUTINE[dayIndex] || [];
    
    // --- FIX IS HERE: Renamed 'routine hydrated' to 'routine' ---
    const routine = routineRaw.map(slot => ({
      ...slot,
      ...getSubjectByCode(slot.code),
      type: 'ROUTINE'
    }));

    // 2. Get "Active" Subjects from DB (subjects marked today)
    const dateStr = getLocalDate();
    const res = await fetch('/api/subjects'); 
    const allDbSubjects = await res.json();
    
    if (allDbSubjects.success) {
      const extras = allDbSubjects.data.filter(sub => {
        const isInRoutine = routine.some(r => r.code === sub.code);
        if (isInRoutine) return false;

        const hasLogToday = sub.attendance_logs.some(log => 
          new Date(log.date).toISOString().split('T')[0] === dateStr
        );
        return hasLogToday;
      }).map(sub => ({
        name: sub.name,
        code: sub.code,
        time: "Extra",
        type: 'EXTRA'
      }));

      const finalList = [...routine, ...extras];
      
      finalList.sort((a, b) => {
        if (a.type === b.type) return a.time.localeCompare(b.time);
        return a.type === 'ROUTINE' ? -1 : 1;
      });

      setTodayClasses(finalList);
    } else {
      setTodayClasses(routine);
    }

    // 3. Check Biometric
    const bioRes = await fetch(`/api/daily-log?date=${dateStr}`);
    const bioData = await bioRes.json();
    setBiometricDone(bioData.biometric);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const markBiometric = async () => {
    setBiometricDone(true);
    await fetch('/api/daily-log', {
      method: 'POST',
      body: JSON.stringify({ biometric: true, dateString: getLocalDate() })
    });
  };

  const handleExtraClassSelect = (code) => {
    const subject = getSubjectByCode(code);
    const newClass = { ...subject, time: "Extra", type: 'EXTRA' };
    
    if (!todayClasses.find(c => c.code === code)) {
        setTodayClasses([...todayClasses, newClass]);
    }
    setExtraClassCode(""); 
  };

  const dateString = currentTime.toLocaleDateString('en-GB', { 
    weekday: 'long', day: 'numeric', month: 'short' 
  });
  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-white p-6 rounded-b-3xl shadow-sm mb-6 sticky top-0 z-20 flex justify-between items-start">
        <div>
           <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{dateString}</h2>
           <h1 className="text-4xl font-black text-gray-900 mt-1">{timeString}</h1>
        </div>
        <Link href="/profile" className="bg-black text-white p-3 rounded-full shadow-lg active:scale-95 transition">👤</Link>
      </div>

      {!loading && !biometricDone && (
        <div className="px-4 mb-6">
          <div className="bg-red-500 text-white p-4 rounded-xl shadow-lg animate-pulse">
            <p className="font-bold text-lg mb-2">⚠️ Mark Biometric First!</p>
            <button onClick={markBiometric} className="w-full bg-white text-red-600 py-3 rounded-lg font-bold">YES, DONE</button>
          </div>
        </div>
      )}

      <div className="px-4 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-2">Today's Routine</h2>
        {todayClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayClasses.map((cls, idx) => (
              <SubjectCard 
                key={cls.code + idx} 
                subjectName={cls.name} 
                subjectCode={cls.code} 
                classTime={cls.time} 
                isScheduled={cls.type === 'ROUTINE'} 
              />
            ))}
          </div>
        ) : (
           <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">No Classes Today 😴</div>
        )}
      </div>

      <div className="px-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-2">Add Extra Subject</h2>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           <input 
             list="subjects-list" 
             placeholder="Search Name or Code..." 
             className="w-full text-lg font-bold border-b-2 border-gray-200 py-2 focus:outline-none focus:border-black"
             onChange={(e) => {
                const val = e.target.value.toLowerCase();
                const found = ALL_SUBJECTS.find(s => 
                   s.name.toLowerCase().includes(val) || s.code.toLowerCase() === val
                );
                if(found) handleExtraClassSelect(found.code);
             }}
           />
           <datalist id="subjects-list">
             {ALL_SUBJECTS.map(s => <option key={s.code} value={s.name}>[{s.code}]</option>)}
           </datalist>
        </div>
      </div>
    </div>
  );
      }

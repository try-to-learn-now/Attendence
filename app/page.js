// app/page.js
"use client";
import { useEffect, useState } from 'react';
import SubjectCard from '@/components/SubjectCard';
import { TIMETABLE } from '@/lib/timetable'; // Import Schedule

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [biometricDone, setBiometricDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState([]);

  useEffect(() => {
    // 1. Fetch Subjects
    fetch('/api/subjects')
      .then(res => res.json())
      .then(res => {
        if(res.success) setSubjects(res.data);
      });

    // 2. Fetch Daily Biometric Status
    fetch('/api/daily-log')
      .then(res => res.json())
      .then(res => {
        setBiometricDone(res.biometric);
        setLoading(false);
      });

    // 3. Load Today's Timetable
    const dayIndex = new Date().getDay(); // 0=Sun, 1=Mon
    setTodaySchedule(TIMETABLE[dayIndex] || []);
  }, []);

  const markBiometric = async () => {
    setBiometricDone(true);
    await fetch('/api/daily-log', {
      method: 'POST',
      body: JSON.stringify({ biometric: true })
    });
  };

  const createSubject = async () => {
    // ... (Keep existing create logic)
    const name = prompt("Subject Name");
    const code = prompt("Subject Code");
    if(!name || !code) return;
    await fetch('/api/subjects', { method: 'POST', body: JSON.stringify({ name, code }) });
    window.location.reload();
  };

  return (
    <div className="min-h-screen pb-20">
      {/* 1. Header */}
      <div className="flex justify-between items-center mb-6 mt-2">
        <div>
            <h1 className="text-2xl font-black text-gray-900">Attendance ERP</h1>
            <p className="text-xs text-gray-400">Database Status: Connected 🟢</p>
        </div>
        <button onClick={createSubject} className="bg-black text-white w-10 h-10 rounded-full font-bold shadow-lg">+</button>
      </div>

      {/* 2. Universal Biometric Prompt */}
      {!loading && !biometricDone && (
        <div className="bg-red-500 text-white p-4 rounded-xl shadow-lg mb-6 animate-pulse">
          <p className="font-bold text-lg mb-2">⚠️ Have you done Biometric?</p>
          <div className="flex gap-2">
            <button onClick={markBiometric} className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold flex-1">
              YES, COMPLETED
            </button>
            <button className="bg-red-700 text-white px-4 py-2 rounded-lg font-bold">NO</button>
          </div>
        </div>
      )}
      
      {biometricDone && (
         <div className="bg-green-100 text-green-800 p-3 rounded-xl mb-6 text-sm font-bold border border-green-200 text-center">
            ✅ Biometric Logged for Today
         </div>
      )}

      {/* 3. Today's Timetable (New) */}
      {todaySchedule.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-gray-700">Today's Schedule 📅</h2>
          <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
            {todaySchedule.map((slot, i) => (
               <div key={i} className={`min-w-[120px] p-3 rounded-lg border flex flex-col justify-center items-center ${slot.type === 'LUNCH' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
                  <span className="text-xs font-bold text-gray-400">{slot.time}</span>
                  <span className="font-bold text-sm text-center">{slot.name || "LUNCH"}</span>
                  {slot.code && <span className="text-xs text-blue-500">{slot.code}</span>}
               </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Subject Cards (Supports Multiple Entries) */}
      <h2 className="text-lg font-bold mb-3 text-gray-700">All Subjects</h2>
      {subjects.map(sub => (
          <SubjectCard key={sub._id} subject={sub} />
      ))}
    </div>
  );
}

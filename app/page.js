// app/page.js
"use client";
import { useEffect, useState } from 'react';
import SubjectCard from '@/components/SubjectCard';

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [biometricDone, setBiometricDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState([]);

  // Fix Timezone Issue: Get Phone's Local Date
  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  useEffect(() => {
    const todayStr = getLocalDateString();

    // 1. Fetch Subjects & BUILD SCHEDULE AUTOMATICALLY
    fetch('/api/subjects')
      .then(res => res.json())
      .then(res => {
        if(res.success) {
          setSubjects(res.data);
          
          // SMART LOGIC: Find classes for Today (0=Sun, 1=Mon...)
          const todayIndex = new Date().getDay(); 
          const todaysClasses = [];
          
          res.data.forEach(sub => {
            if (sub.schedule) {
              sub.schedule.forEach(slot => {
                if (slot.day === todayIndex) {
                  todaysClasses.push({
                    time: slot.time,
                    name: sub.name,
                    code: sub.code
                  });
                }
              });
            }
          });
          
          // Sort by time (10:00 AM before 02:00 PM)
          todaysClasses.sort((a, b) => a.time.localeCompare(b.time));
          setTodaySchedule(todaysClasses);
        }
      });

    // 2. Fetch Biometric
    fetch(`/api/daily-log?date=${todayStr}`)
      .then(res => res.json())
      .then(res => {
        setBiometricDone(res.biometric);
        setLoading(false);
      });
  }, []);

  const markBiometric = async () => {
    setBiometricDone(true);
    await fetch('/api/daily-log', {
      method: 'POST',
      body: JSON.stringify({ biometric: true, dateString: getLocalDateString() })
    });
  };

  const createSubject = async () => {
    const name = prompt("Subject Name (e.g. Maths)");
    if(!name) return;
    const code = prompt("Subject Code (e.g. 101)");
    
    // Set Hardcore Routine Once
    const scheduleStr = prompt(
      "Set Routine (Day-Time)\n0=Sun, 1=Mon, 2=Tue...\nExample: 1-10:00AM, 3-02:00PM"
    );
    
    const schedule = [];
    if (scheduleStr) {
      const parts = scheduleStr.split(',');
      parts.forEach(p => {
        const [d, t] = p.trim().split('-');
        if(d && t) schedule.push({ day: parseInt(d), time: t });
      });
    }

    await fetch('/api/subjects', {
      method: 'POST',
      body: JSON.stringify({ name, code, schedule })
    });
    window.location.reload();
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 mt-2">
        <div>
            <h1 className="text-2xl font-black text-gray-900">Attendance ERP</h1>
            <p className="text-xs text-gray-400">Database Status: Connected 🟢</p>
        </div>
        <button onClick={createSubject} className="bg-black text-white w-10 h-10 rounded-full font-bold shadow-lg">+</button>
      </div>

      {/* Biometric Prompt */}
      {!loading && !biometricDone && (
        <div className="bg-red-500 text-white p-4 rounded-xl shadow-lg mb-6 animate-pulse">
          <p className="font-bold text-lg mb-2">⚠️ Have you done Biometric?</p>
          <div className="flex gap-2">
            <button onClick={markBiometric} className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold flex-1">
              YES, DONE
            </button>
          </div>
        </div>
      )}
      
      {biometricDone && (
         <div className="bg-green-100 text-green-800 p-3 rounded-xl mb-6 text-sm font-bold border border-green-200 text-center">
            ✅ Biometric Logged for Today
         </div>
      )}

      {/* DYNAMIC SCHEDULE BAR */}
      {todaySchedule.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-gray-700">Today's Schedule 📅</h2>
          <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
            {todaySchedule.map((slot, i) => (
               <div key={i} className="min-w-[110px] p-3 rounded-lg bg-white border border-gray-200 flex flex-col justify-center items-center shadow-sm">
                  <span className="text-xs font-bold text-gray-400">{slot.time}</span>
                  <span className="font-bold text-sm text-center truncate w-full">{slot.name}</span>
                  <span className="text-[10px] text-blue-500">{slot.code}</span>
               </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-8 text-center text-gray-400 text-sm">
           No classes scheduled for today.<br/>(Or check "All Subjects" below)
        </div>
      )}

      {/* List of All Subjects */}
      <h2 className="text-lg font-bold mb-3 text-gray-700">All Subjects</h2>
      {subjects.map(sub => (
          <SubjectCard key={sub._id} subject={sub} />
      ))}
    </div>
  );
        }

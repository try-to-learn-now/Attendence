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
  
  // 1. Live Clock & Auto-Detect Schedule
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Auto-Detect Day (0-6)
    const dayIndex = new Date().getDay();
    const routine = WEEKLY_ROUTINE[dayIndex] || [];
    
    // Hydrate routine with full names
    const hydrated = routine.map(slot => ({
      ...slot,
      ...getSubjectByCode(slot.code)
    }));
    
    // Sort by Time
    hydrated.sort((a, b) => {
        // Simple AM/PM sorter logic could go here
        return a.time.localeCompare(b.time); 
    });
    
    setTodayClasses(hydrated);

    return () => clearInterval(timer);
  }, []);

  const dateString = currentTime.toLocaleDateString('en-GB', { 
    weekday: 'long', day: 'numeric', month: 'short' 
  });
  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* --- TOP BAR: CLOCK & PROFILE --- */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm mb-6 sticky top-0 z-10">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{dateString}</h2>
            <h1 className="text-4xl font-black text-gray-900 mt-1">{timeString}</h1>
          </div>
          <Link href="/profile" className="bg-black text-white p-3 rounded-full shadow-lg active:scale-95 transition">
            <span className="text-xl">👤</span> 
          </Link>
        </div>
      </div>

      {/* --- SECTION 1: AUTO-DETECTED TODAY --- */}
      <div className="px-4 mb-8">
        <div className="flex items-center gap-2 mb-4">
           <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
           <h2 className="text-xl font-bold text-gray-800">Today's Routine</h2>
        </div>

        {todayClasses.length > 0 ? (
          <div className="grid gap-4">
            {todayClasses.map((cls, idx) => (
              <SubjectCard 
                key={idx} 
                subjectName={cls.name} 
                subjectCode={cls.code} 
                classTime={cls.time} 
                isScheduled={true}
              />
            ))}
          </div>
        ) : (
           <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
             No Hardcoded Classes Today 😴
           </div>
        )}
      </div>

      {/* --- SECTION 2: EXTRA CLASS (AUTOCOMPLETE) --- */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-4">
           <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
           <h2 className="text-xl font-bold text-gray-800">Extra Class?</h2>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           <label className="text-xs font-bold text-gray-400 uppercase">Search by Code or Name</label>
           <input 
             list="subjects-list" 
             placeholder="Type 'M' for Maths..." 
             className="w-full text-lg font-bold border-b-2 border-gray-200 py-2 focus:outline-none focus:border-black mt-1"
             onChange={(e) => {
                const val = e.target.value;
                // Try to find the code from the name selection
                const found = ALL_SUBJECTS.find(s => s.name === val || s.code === val);
                if(found) setExtraClassCode(found.code);
             }}
           />
           {/* THE AUTOCOMPLETE DROPDOWN */}
           <datalist id="subjects-list">
             {ALL_SUBJECTS.map(s => (
               <option key={s.code} value={s.name}>[{s.code}]</option>
             ))}
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

// app/page.js
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WEEKLY_ROUTINE, ALL_SUBJECTS, getSubjectByCode, HOLIDAYS } from '@/lib/universal_data';
import SubjectCard from '@/components/SubjectCard';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(() => {
     const d = new Date();
     const offset = d.getTimezoneOffset() * 60000;
     return new Date(d.getTime() - offset).toISOString().split('T')[0];
  });

  const [todayClasses, setTodayClasses] = useState([]); 
  const [extraClassCode, setExtraClassCode] = useState("");
  const [biometricDone, setBiometricDone] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [isHardHoliday, setIsHardHoliday] = useState(false); 
  const [isManualHoliday, setIsManualHoliday] = useState(false);
  const [isFuture, setIsFuture] = useState(false);
  const [dayName, setDayName] = useState("");

  const loadDashboard = async () => {
    const dateObj = new Date(selectedDate);
    const dayIndex = dateObj.getDay(); 
    const dateMonth = selectedDate.slice(5); 
    
    // 1. Basic Info
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    setDayName(days[dayIndex]);

    // Future Check
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset()*60000).toISOString().split('T')[0];
    setIsFuture(selectedDate > todayStr);

    // Holiday Check
    const isSunday = dayIndex === 0;
    const isGovHoliday = HOLIDAYS.includes(dateMonth);
    setIsHardHoliday(isSunday || isGovHoliday);

    // 2. Routine
    const routineRaw = WEEKLY_ROUTINE[dayIndex] || [];
    const routine = routineRaw.map(slot => ({
      ...slot,
      ...getSubjectByCode(slot.code),
      type: 'ROUTINE'
    }));

    // 3. Database Sync
    const res = await fetch('/api/subjects'); 
    const allDbSubjects = await res.json();
    
    if (allDbSubjects.success) {
      const extras = [];
      allDbSubjects.data.forEach(sub => {
        const todaysLogs = sub.attendance_logs.filter(log => 
            new Date(log.date).toISOString().split('T')[0] === selectedDate
        );
        todaysLogs.forEach(log => {
            // Find if this log belongs to a routine class
            const isRoutine = routine.some(r => r.code === sub.code && r.time === log.timeSlot);
            
            if (!isRoutine) {
                // If not routine, it's Extra
                if (!extras.some(e => e.code === sub.code && e.time === log.timeSlot)) {
                    extras.push({
                        name: sub.name, 
                        code: sub.code, 
                        time: log.timeSlot || "Extra", 
                        type: 'EXTRA'
                    });
                }
            }
        });
      });
      
      const finalList = [...routine, ...extras];
      finalList.sort((a, b) => a.time.localeCompare(b.time));
      setTodayClasses(finalList);
    } else {
      setTodayClasses(routine);
    }

    // 4. Biometric Sync
    const bioRes = await fetch(`/api/daily-log?date=${selectedDate}`);
    const bioData = await bioRes.json();
    setBiometricDone(bioData.biometric);
    setIsManualHoliday(bioData.is_holiday);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadDashboard();
  }, [selectedDate]);

  const toggleBiometric = async () => {
    if(isFuture) return;
    const newState = !biometricDone;
    setBiometricDone(newState);
    await fetch('/api/daily-log', {
      method: 'POST',
      body: JSON.stringify({ biometric: newState, dateString: selectedDate })
    });
  };

  const toggleManualHoliday = async () => {
    if(isFuture) return;
    const newState = !isManualHoliday;
    setIsManualHoliday(newState);
    await fetch('/api/daily-log', {
      method: 'POST',
      body: JSON.stringify({ is_holiday: newState, dateString: selectedDate })
    });
  };

  const handleExtraClassSelect = (code) => {
    if(isFuture) return;
    const subject = getSubjectByCode(code);
    const newClass = { ...subject, time: "Extra", type: 'EXTRA' };
    setTodayClasses([...todayClasses, newClass]);
    setExtraClassCode(""); 
  };

  const isHoliday = isHardHoliday || isManualHoliday;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm mb-4 sticky top-0 z-20">
        <div className="flex justify-between items-center mb-2">
          <div>
             {/* Date Picker */}
             <input 
               type="date" 
               value={selectedDate} 
               onChange={(e) => setSelectedDate(e.target.value)} 
               className="text-2xl font-black text-gray-900 bg-transparent outline-none w-full"
             />
             <p className="text-sm font-bold text-blue-600 tracking-widest mt-1 uppercase">{dayName}</p>
          </div>
          <Link href="/profile" className="bg-black text-white p-3 rounded-full shadow-lg">👤</Link>
        </div>
      </div>

      {/* WARNINGS */}
      {isFuture && (
         <div className="px-4 mb-4"><div className="bg-gray-200 text-gray-600 p-3 rounded-xl font-bold text-center">🔮 Future Date (Read Only)</div></div>
      )}

      {isHoliday && !isFuture && (
        <div className="px-4 mb-4">
            <div className="bg-purple-100 text-purple-800 p-4 rounded-xl font-bold text-center border border-purple-200 shadow-sm">
                🎉 HOLIDAY / WEEKEND
            </div>
        </div>
      )}

      {/* CONTROLS (Bio & Holiday) */}
      {!loading && !isFuture && (
        <div className="px-4 mb-6 grid grid-cols-2 gap-2">
            {/* Biometric Toggle */}
            <button 
                onClick={toggleBiometric}
                className={`py-3 rounded-xl font-bold text-sm shadow-sm transition-all ${
                    biometricDone 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-red-500 text-white animate-pulse'
                }`}
            >
                {biometricDone ? "✅ Bio Done" : "⚠️ Mark Bio"}
            </button>

            {/* Holiday Toggle */}
            <button 
                onClick={toggleManualHoliday}
                className={`py-3 rounded-xl font-bold text-sm shadow-sm transition-all ${
                    isManualHoliday 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white border border-gray-200 text-gray-500'
                }`}
            >
                {isManualHoliday ? "Holiday On" : "Mark Holiday"}
            </button>
        </div>
      )}

      {/* CLASSES LIST */}
      <div className="px-4 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-2">Schedule</h2>
        {todayClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayClasses.map((cls, idx) => (
              <SubjectCard 
                key={cls.code + idx + cls.time} // Unique Key Fix
                subjectName={cls.name} 
                subjectCode={cls.code} 
                classTime={cls.time} 
                isScheduled={cls.type === 'ROUTINE'} 
                selectedDate={selectedDate}
                biometricDone={biometricDone}
                isFuture={isFuture} 
              />
            ))}
          </div>
        ) : (
           <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">No Classes Found</div>
        )}
      </div>

      {/* EXTRA CLASS INPUT */}
      {!isFuture && (
          <div className="px-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-2">Add Extra Class</h2>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <input 
                    list="subjects-list" 
                    placeholder="Search Name or Code..." 
                    className="w-full text-lg font-bold border-b-2 border-gray-200 py-2 outline-none"
                    onChange={(e) => {
                        const val = e.target.value.toLowerCase();
                        const found = ALL_SUBJECTS.find(s => s.name.toLowerCase().includes(val) || s.code.toLowerCase() === val);
                        if(found) handleExtraClassSelect(found.code);
                    }}
                />
                <datalist id="subjects-list">
                    {ALL_SUBJECTS.map(s => <option key={s.code} value={s.name}>[{s.code}]</option>)}
                </datalist>
            </div>
          </div>
      )}
    </div>
  );
                  }

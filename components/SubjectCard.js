// app/page.js
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WEEKLY_ROUTINE, ALL_SUBJECTS, getSubjectByCode, HOLIDAYS } from '@/lib/universal_data';
import SubjectCard from '@/components/SubjectCard';

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
     const d = new Date();
     const offset = d.getTimezoneOffset() * 60000;
     return new Date(d.getTime() - offset).toISOString().split('T')[0];
  });

  const [todayClasses, setTodayClasses] = useState([]); 
  const [extraClassCode, setExtraClassCode] = useState("");
  const [biometricDone, setBiometricDone] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Status Flags
  const [isHardHoliday, setIsHardHoliday] = useState(false); // Code/Sunday
  const [isManualHoliday, setIsManualHoliday] = useState(false); // MongoDB
  const [isFuture, setIsFuture] = useState(false);
  const [dayName, setDayName] = useState("");

  const loadDashboard = async () => {
    const dateObj = new Date(selectedDate);
    const dayIndex = dateObj.getDay(); 
    const dateMonth = selectedDate.slice(5); 
    
    // 1. Calculate Day Name & Future
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    setDayName(days[dayIndex]);

    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset()*60000).toISOString().split('T')[0];
    setIsFuture(selectedDate > todayStr);

    // 2. Hardcoded Holiday Check
    const isSunday = dayIndex === 0;
    const isGovHoliday = HOLIDAYS.includes(dateMonth);
    setIsHardHoliday(isSunday || isGovHoliday);

    // 3. Load Routine
    const routineRaw = WEEKLY_ROUTINE[dayIndex] || [];
    const routine = routineRaw.map(slot => ({
      ...slot,
      ...getSubjectByCode(slot.code),
      type: 'ROUTINE'
    }));

    // 4. Fetch DB Data (Subjects + Logs)
    const res = await fetch('/api/subjects'); 
    const allDbSubjects = await res.json();
    
    if (allDbSubjects.success) {
      const extras = [];
      allDbSubjects.data.forEach(sub => {
        const todaysLogs = sub.attendance_logs.filter(log => 
            new Date(log.date).toISOString().split('T')[0] === selectedDate
        );
        todaysLogs.forEach(log => {
            const isRoutine = routine.some(r => r.code === sub.code && r.time === log.timeSlot);
            if (!isRoutine) {
                if (!extras.some(e => e.code === sub.code && e.time === log.timeSlot)) {
                    extras.push({
                        name: sub.name, code: sub.code, time: log.timeSlot || "Extra", type: 'EXTRA'
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

    // 5. Fetch Daily Log (Biometric + Manual Holiday)
    const bioRes = await fetch(`/api/daily-log?date=${selectedDate}`);
    const bioData = await bioRes.json();
    setBiometricDone(bioData.biometric);
    setIsManualHoliday(bioData.is_holiday);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadDashboard();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [selectedDate]);

  const markBiometric = async () => {
    if(isFuture) return;
    setBiometricDone(true);
    await fetch('/api/daily-log', {
      method: 'POST',
      body: JSON.stringify({ biometric: true, dateString: selectedDate })
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

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isHoliday = isHardHoliday || isManualHoliday;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* Top Bar */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm mb-4 sticky top-0 z-20">
        <div className="flex justify-between items-start mb-2">
          <div>
             <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-gray-500 font-bold bg-transparent outline-none"/>
             <h1 className="text-4xl font-black text-gray-900 mt-1">{timeString}</h1>
             <p className="text-sm font-bold text-blue-600 tracking-widest mt-1 uppercase">{dayName}</p>
          </div>
          <Link href="/profile" className="bg-black text-white p-3 rounded-full">👤</Link>
        </div>
      </div>

      {/* Warning Banners */}
      {isFuture && (
         <div className="px-4 mb-4"><div className="bg-gray-200 text-gray-600 p-3 rounded-xl font-bold text-center">🔮 Future Date (Read Only)</div></div>
      )}

      {isHoliday && !isFuture && (
        <div className="px-4 mb-4">
            <div className="bg-purple-100 text-purple-800 p-4 rounded-xl font-bold text-center border border-purple-200 shadow-sm">
                🎉 HOLIDAY / WEEKEND<br/><span className="text-[10px] font-normal opacity-75">(Classes Optional)</span>
            </div>
        </div>
      )}

      {/* Action Area (Biometric & Holiday) */}
      {!loading && !isFuture && (
        <div className="px-4 mb-6 grid gap-2">
            
            {/* Biometric Status */}
            {!biometricDone ? (
                <div className="bg-red-500 text-white p-4 rounded-xl shadow-lg flex justify-between items-center">
                    <span className="font-bold">⚠️ Mark Biometric</span>
                    <button onClick={markBiometric} className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold text-sm">DONE</button>
                </div>
            ) : (
                <div className="bg-green-100 text-green-800 p-3 rounded-xl font-bold text-center border border-green-200">✅ Biometric Logged</div>
            )}

            {/* Manual Holiday Toggle */}
            <button 
                onClick={toggleManualHoliday}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${isManualHoliday ? 'bg-purple-600 text-white shadow-lg' : 'bg-white border border-purple-200 text-purple-600'}`}
            >
                {isManualHoliday ? "Cancel Holiday Override ❌" : "Mark Today as Holiday 🎉"}
            </button>
        </div>
      )}

      {/* Routine */}
      <div className="px-4 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-2">
            Schedule
        </h2>
        {todayClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayClasses.map((cls, idx) => (
              <SubjectCard 
                key={cls.code + idx} 
                subjectName={cls.name} 
                subjectCode={cls.code} 
                classTime={cls.time} 
                isScheduled={cls.type === 'ROUTINE'} 
                selectedDate={selectedDate}
                biometricDone={biometricDone}
                isFuture={isFuture} // Lock future cards
              />
            ))}
          </div>
        ) : (
           <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">No Classes Found</div>
        )}
      </div>

      {/* Add Extra */}
      {!isFuture && (
          <div className="px-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-2">Add Extra / Swap</h2>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <input list="subjects-list" placeholder="Search Name or Code..." className="w-full text-lg font-bold border-b-2 border-gray-200 py-2 outline-none"
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

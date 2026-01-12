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
  const [isHoliday, setIsHoliday] = useState(false);

  const loadDashboard = async () => {
    // 1. Holiday Check
    const dateObj = new Date(selectedDate);
    const dayIndex = dateObj.getDay(); 
    const dateMonth = selectedDate.slice(5); // MM-DD
    
    const isSunday = dayIndex === 0;
    const isGovHoliday = HOLIDAYS.includes(dateMonth);
    
    if (isSunday || isGovHoliday) {
        setIsHoliday(true);
    } else {
        setIsHoliday(false);
    }

    // 2. Load Routine (Only if not holiday, but we show structure anyway)
    const routineRaw = WEEKLY_ROUTINE[dayIndex] || [];
    const routine = routineRaw.map(slot => ({
      ...slot,
      ...getSubjectByCode(slot.code),
      type: 'ROUTINE'
    }));

    // 3. Fetch DB Data (Merge Extras)
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

    // 4. Biometric Check
    const bioRes = await fetch(`/api/daily-log?date=${selectedDate}`);
    const bioData = await bioRes.json();
    setBiometricDone(bioData.biometric);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadDashboard();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [selectedDate]);

  const markBiometric = async () => {
    setBiometricDone(true);
    await fetch('/api/daily-log', {
      method: 'POST',
      body: JSON.stringify({ biometric: true, dateString: selectedDate })
    });
  };

  const handleExtraClassSelect = (code) => {
    const subject = getSubjectByCode(code);
    const newClass = { ...subject, time: "Extra", type: 'EXTRA' };
    setTodayClasses([...todayClasses, newClass]);
    setExtraClassCode(""); 
  };

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* Top Bar */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm mb-6 sticky top-0 z-20">
        <div className="flex justify-between items-start mb-4">
          <div>
             <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-gray-500 font-bold bg-transparent outline-none"/>
             <h1 className="text-4xl font-black text-gray-900 mt-1">{timeString}</h1>
          </div>
          <Link href="/profile" className="bg-black text-white p-3 rounded-full">👤</Link>
        </div>
      </div>

      {/* Holiday Banner */}
      {isHoliday && (
        <div className="px-4 mb-4">
            <div className="bg-purple-100 text-purple-800 p-4 rounded-xl font-bold text-center border border-purple-200">
                🎉 Holiday / Weekend Detected!<br/><span className="text-xs font-normal">(You can still add Extra Classes below for Online sessions)</span>
            </div>
        </div>
      )}

      {/* Biometric */}
      {!loading && !biometricDone && !isHoliday && (
        <div className="px-4 mb-6">
          <div className="bg-red-500 text-white p-4 rounded-xl shadow-lg animate-pulse">
            <p className="font-bold text-lg mb-2">⚠️ Mark Biometric First!</p>
            <div className="flex gap-2">
                <button onClick={markBiometric} className="flex-1 bg-white text-red-600 py-3 rounded-lg font-bold">YES, DONE</button>
                <button className="bg-red-700 text-white px-4 py-3 rounded-lg font-bold">NO</button>
            </div>
          </div>
        </div>
      )}
      
      {biometricDone && (
         <div className="px-4 mb-6"><div className="bg-green-100 text-green-800 p-3 rounded-xl font-bold text-center">✅ Biometric Logged</div></div>
      )}

      {/* Routine */}
      <div className="px-4 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-2">
            {isHoliday ? "Holiday Schedule" : "Today's Routine"}
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
                biometricDone={biometricDone} // Pass Bio Status to Card
              />
            ))}
          </div>
        ) : (
           <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">No Classes Found</div>
        )}
      </div>

      {/* Add Extra */}
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
    </div>
  );
  }

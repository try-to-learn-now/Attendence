// app/page.js
"use client";
import { useEffect, useState } from 'react';
import SubjectCard from '@/components/SubjectCard';

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/subjects')
      .then(res => res.json())
      .then(res => {
        if(res.success) setSubjects(res.data);
        setLoading(false);
      });
  }, []);

  const createSubject = async () => {
    const name = prompt("Subject Name (e.g., Analog Electronics)");
    const code = prompt("Subject Code (e.g., 104401)");
    if(!name || !code) return;

    await fetch('/api/subjects', {
      method: 'POST',
      body: JSON.stringify({ name, code })
    });
    window.location.reload();
  };

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-8 mt-2">
        <div>
            <h1 className="text-2xl font-black text-gray-900">My Attendance</h1>
            <p className="text-sm text-gray-400">Engineering Survival Kit</p>
        </div>
        <button 
            onClick={createSubject} 
            className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-lg"
        >
          +
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 mt-20 animate-pulse">Loading data...</p>
      ) : subjects.length === 0 ? (
        <div className="text-center mt-20 opacity-50">
            <p className="text-4xl mb-2">😴</p>
            <p>No subjects found.</p>
            <p className="text-sm">Click + to add one.</p>
        </div>
      ) : (
        subjects.map(sub => (
          <SubjectCard key={sub._id} subject={sub} />
        ))
      )}
    </div>
  );
}

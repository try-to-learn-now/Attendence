// app/profile/page.js
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const [stats, setStats] = useState({ total: 0, real: 0, bunk: 0, proxy: 0, absent: 0 });
  
  useEffect(() => {
    // Fetch aggregated stats from API (You need to build this API endpoint)
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  const downloadReport = (type) => {
    // Trigger PDF generation based on type
    // type = 'ALL', 'BIO_ONLY', 'REAL_BUNK'
    window.open(`/api/pdf/generate?type=${type}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link href="/" className="text-sm font-bold text-gray-400 mb-6 block">← BACK TO DASHBOARD</Link>
      
      <h1 className="text-3xl font-black mb-8">Analytics 📊</h1>

      {/* 1. Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm">
           <p className="text-xs font-bold text-gray-400 uppercase">Real + Bunk</p>
           <p className="text-3xl font-black text-blue-600">
             {Math.round(((stats.real + stats.bunk) / stats.total || 0) * 100)}%
           </p>
           <p className="text-xs text-gray-400 mt-1">Biometric Presence</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm">
           <p className="text-xs font-bold text-gray-400 uppercase">Real Only</p>
           <p className="text-3xl font-black text-green-600">
             {Math.round((stats.real / stats.total || 0) * 100)}%
           </p>
           <p className="text-xs text-gray-400 mt-1">Actual Class</p>
        </div>
      </div>

      {/* 2. Advanced PDF Filters */}
      <h2 className="text-lg font-bold mb-4 text-gray-800">Generate Reports</h2>
      <div className="space-y-3">
        <button onClick={() => downloadReport('ALL')} className="w-full bg-black text-white p-4 rounded-xl font-bold flex justify-between items-center">
           <span>Complete Report</span>
           <span className="opacity-50">📄</span>
        </button>
        
        <button onClick={() => downloadReport('BIO_ONLY')} className="w-full bg-white border border-gray-200 text-gray-800 p-4 rounded-xl font-bold flex justify-between items-center">
           <span>Only Biometric (Yes/No)</span>
           <span className="text-blue-500">📄</span>
        </button>

        <button onClick={() => downloadReport('REAL_BUNK')} className="w-full bg-white border border-gray-200 text-gray-800 p-4 rounded-xl font-bold flex justify-between items-center">
           <span>Real + Bunk Combo</span>
           <span className="text-orange-500">📄</span>
        </button>
      </div>

    </div>
  );
}

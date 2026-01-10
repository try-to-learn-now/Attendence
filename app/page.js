// app/login/page.js
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Call the API to verify password
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password })
    });

    if (res.ok) {
      router.push('/'); // Success! Go to Dashboard
      router.refresh();
    } else {
      setError('Wrong Password! ❌');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Nitesh ERP 🔒</h1>
        
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Admin Password"
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button 
            type="submit" 
            className="w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-800 transition"
          >
            Unlock System
          </button>
        </form>

        {error && <p className="text-red-500 text-center mt-4 font-bold">{error}</p>}
      </div>
    </div>
  );
}

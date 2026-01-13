// app/login/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Wrong Password! ❌");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-50">
      <h1 className="text-3xl font-black mb-6">Nitesh ERP</h1>

      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl border w-full max-w-sm"
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter Admin Password"
          className="w-full p-3 border rounded-lg mb-4 font-bold"
        />

        <button className="w-full p-3 rounded-lg bg-black text-white font-black">
          Unlock System
        </button>

        {error && (
          <div className="mt-4 text-red-600 font-bold text-center">{error}</div>
        )}
      </form>
    </div>
  );
}

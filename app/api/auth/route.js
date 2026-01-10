// app/api/auth/route.js
import { NextResponse } from 'next/server';

// 🛑 FORCE DYNAMIC: Tells Vercel to ignore this during the Static Build phase
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    
    // 1. Check Password
    if (body.password === process.env.ADMIN_PASSWORD) {
      
      const response = NextResponse.json({ success: true });
      
      // 2. Set Cookie (Safe Mode)
      response.cookies.set('is_admin_logged_in', 'true', {
        httpOnly: true, 
        maxAge: 60 * 60 * 24 * 30, // 30 Days
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });

  } catch (error) {
    // If anything fails (like JSON parsing), return error instead of crashing build
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

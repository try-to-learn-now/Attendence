// app/api/auth/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  
  // 1. Check against the Vercel Environment Variable
  if (body.password === process.env.ADMIN_PASSWORD) {
    
    // 2. Create the "Success" response
    const response = NextResponse.json({ success: true });
    
    // 3. Set a Cookie (This is your "Digital ID Card")
    response.cookies.set('is_admin_logged_in', 'true', {
      httpOnly: true, // Secure: JavaScript cannot read this
      maxAge: 60 * 60 * 24 * 30, // Stay logged in for 30 Days
      path: '/',
    });

    return response;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}


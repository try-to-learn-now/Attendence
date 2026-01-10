// app/layout.js
import './globals.css';

// 1. Metadata (Title, Description) - NO VIEWPORT HERE
export const metadata = {
  title: 'Nitesh Attendance ERP',
  description: 'Student ERP System',
};

// 2. Viewport (Mobile Scaling) - SEPARATE EXPORT
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  // themeColor: 'black', // Optional: Makes mobile browser bar match your app
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <main className="max-w-md mx-auto min-h-screen p-4 pb-20">
          {children}
        </main>
      </body>
    </html>
  );
}

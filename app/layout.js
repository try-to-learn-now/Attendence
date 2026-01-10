// app/layout.js
import './globals.css';

export const metadata = {
  title: 'Nitesh Attendance ERP',
  description: 'Student ERP System',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
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


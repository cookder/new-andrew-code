import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sales Call Feedback AI',
  description: 'Real-time AI-powered feedback system for sales calls',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}

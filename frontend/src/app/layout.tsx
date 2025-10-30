import type { Metadata } from 'next';
import './globals.css';
import Navigation from '../components/Dashboard/Navigation';

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
        <Navigation />
        {children}
      </body>
    </html>
  );
}

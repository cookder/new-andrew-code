/**
 * Call History Page
 */

import CallHistory from '../../components/Dashboard/CallHistory';

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <CallHistory />
      </div>
    </main>
  );
}

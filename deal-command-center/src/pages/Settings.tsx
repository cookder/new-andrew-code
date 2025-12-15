import { useState } from 'react';
import { Target, Database, Trash2, Download, Info } from 'lucide-react';
import { PageContainer, Section } from '../components/layout/PageContainer';
import { SimpleHeader } from '../components/layout/Header';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useQuotaStore } from '../stores/quotaStore';
import { useDealStore } from '../stores/dealStore';
import { useContactStore } from '../stores/contactStore';
import { useActivityStore } from '../stores/activityStore';

export function Settings() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const getCurrentMonthQuota = useQuotaStore((state) => state.getCurrentMonthQuota);
  const setQuotaTarget = useQuotaStore((state) => state.setQuotaTarget);
  const updateClosedWon = useQuotaStore((state) => state.updateClosedWon);

  const deals = useDealStore((state) => state.deals);
  const contacts = useContactStore((state) => state.contacts);
  const activities = useActivityStore((state) => state.activities);

  const currentQuota = getCurrentMonthQuota();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [quotaTarget, setQuotaTargetValue] = useState(
    currentQuota?.target.toString() || ''
  );
  const [closedWon, setClosedWonValue] = useState(
    currentQuota?.closedWon.toString() || ''
  );

  const handleSaveQuota = () => {
    const target = Number(quotaTarget) || 0;
    const won = Number(closedWon) || 0;

    setQuotaTarget(currentMonth, currentYear, target);
    updateClosedWon(currentMonth, currentYear, won);
  };

  const handleResetData = () => {
    localStorage.removeItem('deal-store');
    localStorage.removeItem('contact-store');
    localStorage.removeItem('activity-store');
    localStorage.removeItem('quota-store');
    window.location.reload();
  };

  const handleExportData = () => {
    const data = {
      deals,
      contacts,
      activities,
      quota: currentQuota,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deal-command-center-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="flex flex-col min-h-full">
      <SimpleHeader title="Settings" />
      <PageContainer>
        {/* Quota Settings */}
        <Section title="Quota Settings">
          <Card>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-500" />
                {monthNames[currentMonth - 1]} {currentYear} Quota
              </div>
            </CardTitle>

            <div className="space-y-4 mt-4">
              <Input
                label="Monthly Target"
                type="number"
                value={quotaTarget}
                onChange={(e) => setQuotaTargetValue(e.target.value)}
                placeholder="Enter your quota target"
              />

              <Input
                label="Closed Won (so far)"
                type="number"
                value={closedWon}
                onChange={(e) => setClosedWonValue(e.target.value)}
                placeholder="Enter closed won amount"
                helperText="Update this as you close deals"
              />

              <Button onClick={handleSaveQuota} fullWidth>
                Save Quota Settings
              </Button>
            </div>
          </Card>
        </Section>

        {/* Data Statistics */}
        <Section title="Your Data">
          <Card>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary-500" />
                Data Statistics
              </div>
            </CardTitle>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <StatBox label="Deals" value={deals.length} />
              <StatBox label="Contacts" value={contacts.length} />
              <StatBox label="Activities" value={activities.length} />
            </div>

            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={handleExportData} fullWidth>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </Card>
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone">
          <Card className="border-danger/20">
            <CardTitle>
              <div className="flex items-center gap-2 text-danger">
                <Trash2 className="w-5 h-5" />
                Reset All Data
              </div>
            </CardTitle>

            <p className="text-sm text-gray-500 mt-2">
              This will permanently delete all your deals, contacts, activities, and quota data.
              This action cannot be undone.
            </p>

            <Button
              variant="danger"
              onClick={() => setShowResetConfirm(true)}
              className="mt-4"
              fullWidth
            >
              Reset All Data
            </Button>
          </Card>
        </Section>

        {/* About */}
        <Section title="About">
          <Card>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary-500" />
                Deal Command Center
              </div>
            </CardTitle>

            <div className="mt-3 space-y-2 text-sm text-gray-500">
              <p>Version 1.0.0</p>
              <p>A mobile-first PWA for B2B sales pipeline management.</p>
              <p>Built for Box Enterprise Account Executives.</p>
            </div>
          </Card>
        </Section>
      </PageContainer>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset All Data?"
        size="sm"
      >
        <p className="text-gray-600 mb-4">
          This will permanently delete all your data including {deals.length} deals,{' '}
          {contacts.length} contacts, and {activities.length} activities.
        </p>
        <p className="text-danger text-sm mb-4 font-medium">
          This action cannot be undone!
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowResetConfirm(false)}
            fullWidth
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleResetData} fullWidth>
            Reset Everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: number;
}

function StatBox({ label, value }: StatBoxProps) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Account {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  accountId: string;
}

export default function NewOpportunityPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    accountId: '',
    primaryContactId: '',
    amount: '',
    expectedCloseDate: '',
    currentStage: 'Discovery',
  });

  useEffect(() => {
    fetchAccounts();
    fetchContacts();
  }, []);

  useEffect(() => {
    if (formData.accountId) {
      setFilteredContacts(contacts.filter(c => c.accountId === formData.accountId));
    } else {
      setFilteredContacts([]);
    }
  }, [formData.accountId, contacts]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const opportunity = await response.json();
        router.push(`/crm/opportunities/${opportunity.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      alert('Failed to create opportunity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/crm">
            <Button variant="ghost" size="sm">← Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opportunity Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Enterprise Software Deal - Acme Corp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account *
                </label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value, primaryContactId: '' })}
                >
                  <option value="">Select an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2">
                  <Link href="/crm/accounts/new">
                    <Button type="button" variant="ghost" size="sm">
                      + Create New Account
                    </Button>
                  </Link>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Contact
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.primaryContactId}
                  onChange={(e) => setFormData({ ...formData, primaryContactId: e.target.value })}
                  disabled={!formData.accountId}
                >
                  <option value="">Select a contact (optional)</option>
                  {filteredContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="100000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.expectedCloseDate}
                    onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Stage
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.currentStage}
                  onChange={(e) => setFormData({ ...formData, currentStage: e.target.value })}
                >
                  <option value="Discovery">Discovery</option>
                  <option value="Demo">Demo</option>
                  <option value="Validating Business Case">Validating Business Case</option>
                  <option value="Negotiating $">Negotiating $</option>
                  <option value="Finalizing Closure">Finalizing Closure</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Opportunity'}
                </Button>
                <Link href="/crm">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

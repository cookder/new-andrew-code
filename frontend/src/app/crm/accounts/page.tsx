'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Account {
  id: string;
  name: string;
  industry: string | null;
  companySize: number | null;
  website: string | null;
  opportunities: any[];
  contacts: any[];
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your customer accounts
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/crm">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link href="/crm/accounts/new">
                <Button variant="primary">+ New Account</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Loading accounts...</div>
          </div>
        ) : accounts.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-gray-400 mb-4">No accounts found</div>
            <Link href="/crm/accounts/new">
              <Button variant="primary">Create Your First Account</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {account.name}
                  </h3>
                  {account.industry && (
                    <div className="text-sm text-gray-600">{account.industry}</div>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {account.companySize && (
                    <div>Employees: {account.companySize.toLocaleString()}</div>
                  )}
                  {account.website && (
                    <div className="truncate">
                      <a
                        href={account.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {account.website}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm border-t pt-4">
                  <div>
                    <span className="font-medium">{account.opportunities.length}</span> opportunities
                  </div>
                  <div>
                    <span className="font-medium">{account.contacts.length}</span> contacts
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

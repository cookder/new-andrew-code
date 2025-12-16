import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Contact } from '../types';
import { generateId, toISODateString } from '../lib/utils';

interface ContactState {
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => string;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  getContact: (id: string) => Contact | undefined;
  getContactsByDeal: (dealId: string) => Contact[];
  deleteContactsByDeal: (dealId: string) => void;
}

export const useContactStore = create<ContactState>()(
  persist(
    (set, get) => ({
      contacts: [],

      addContact: (contactData) => {
        const id = generateId();
        const newContact: Contact = {
          ...contactData,
          id,
          createdAt: toISODateString(),
        };

        set((state) => ({
          contacts: [...state.contacts, newContact],
        }));

        return id;
      },

      updateContact: (id, updates) => {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id ? { ...contact, ...updates } : contact
          ),
        }));
      },

      deleteContact: (id) => {
        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.id !== id),
        }));
      },

      getContact: (id) => {
        return get().contacts.find((contact) => contact.id === id);
      },

      getContactsByDeal: (dealId) => {
        return get().contacts.filter((contact) => contact.dealId === dealId);
      },

      deleteContactsByDeal: (dealId) => {
        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.dealId !== dealId),
        }));
      },
    }),
    {
      name: 'contact-store',
    }
  )
);

import { Phone, Mail, MoreVertical } from 'lucide-react';
import type { Contact } from '../../types';
import { Card } from '../ui/Card';
import { CONTACT_ROLE_LABELS, CONTACT_ROLE_COLORS } from '../../lib/constants';
import { formatRelativeDate, cn } from '../../lib/utils';

interface StakeholderCardProps {
  contact: Contact;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function StakeholderCard({ contact, onEdit, onDelete }: StakeholderCardProps) {

  return (
    <Card padding="sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{contact.name}</h4>
            <span
              className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                contact.engagementLevel === 'hot' && 'bg-green-500',
                contact.engagementLevel === 'warm' && 'bg-yellow-500',
                contact.engagementLevel === 'cold' && 'bg-blue-500'
              )}
            />
          </div>
          {contact.title && (
            <p className="text-sm text-gray-500 truncate mb-2">{contact.title}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
                CONTACT_ROLE_COLORS[contact.role]
              )}
            >
              {CONTACT_ROLE_LABELS[contact.role]}
            </span>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-1 text-xs text-primary-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </a>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-1 text-xs text-primary-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call</span>
          </a>
        )}
        {contact.lastContactDate && (
          <span className="text-xs text-gray-400 ml-auto">
            Last contact: {formatRelativeDate(contact.lastContactDate)}
          </span>
        )}
      </div>

      {contact.notes && (
        <p className="mt-2 text-xs text-gray-500 line-clamp-2">{contact.notes}</p>
      )}
    </Card>
  );
}

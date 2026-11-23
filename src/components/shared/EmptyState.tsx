import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-neutral-800 p-4 text-neutral-500">
        {icon || <Inbox size={32} />}
      </div>
      <h3 className="text-lg font-medium text-white">{title}</h3>
      <p className="mt-1 text-sm text-neutral-500 max-w-md">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

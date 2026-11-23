import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, padding = true }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-800 bg-neutral-900',
        padding && 'p-6',
        className,
      )}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, action }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {action}
    </div>
  );
};

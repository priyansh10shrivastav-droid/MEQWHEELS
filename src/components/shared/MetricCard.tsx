import React from 'react';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

export const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value }) => {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-3 inline-flex rounded-lg bg-neutral-800 p-2.5 text-neutral-400">
        {icon}
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-neutral-500">{label}</div>
    </div>
  );
};

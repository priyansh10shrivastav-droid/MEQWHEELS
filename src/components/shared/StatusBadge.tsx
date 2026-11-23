import React from 'react';
import { Badge } from '../ui/Badge';
import { BOOKING_STATUS_CONFIG, VEHICLE_STATUS_CONFIG, VERIFICATION_STATUS_CONFIG } from '../../lib/constants';

type StatusType = 'booking' | 'vehicle' | 'verification';

interface StatusBadgeProps {
  status: string;
  type: StatusType;
}

const configMap = {
  booking: BOOKING_STATUS_CONFIG,
  vehicle: VEHICLE_STATUS_CONFIG,
  verification: VERIFICATION_STATUS_CONFIG,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  const config = configMap[type] as Record<string, { label: string; color: string }>;
  const statusConfig = config[status];

  if (!statusConfig) {
    return <Badge className="bg-neutral-700 text-neutral-300 border-neutral-600">{status}</Badge>;
  }

  return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
};

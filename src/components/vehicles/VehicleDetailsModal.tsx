import React, { useState, useEffect } from 'react';
import { Vehicle, Booking } from '../../types';
import { bookingService } from '../../services/bookingService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StatusBadge } from '../shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Bike,
  Wrench,
  History,
  Calendar,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  FileText,
  Tag,
} from 'lucide-react';

interface VehicleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onEdit: (vehicle: Vehicle) => void;
  onUpdateStatus: (vehicleId: string, status: Vehicle['status']) => Promise<unknown>;
  onBookNow: (vehicleId: string) => void;
}

export const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onEdit,
  onUpdateStatus,
  onBookNow,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'maintenance'>('overview');
  const [loading, setLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (vehicle && isOpen) {
      setLoading(true);
      bookingService
        .getByVehicle(vehicle.id)
        .then(setBookings)
        .finally(() => setLoading(false));
    }
  }, [vehicle, isOpen]);

  if (!vehicle) return null;

  const handleStatusChange = async (newStatus: Vehicle['status']) => {
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(vehicle.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const isBookable = vehicle.status === 'available' || vehicle.status === 'reserved';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Hero Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-800 text-neutral-300 border border-neutral-700">
              <Bike size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <StatusBadge status={vehicle.status} type="vehicle" />
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1 font-mono">
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-semibold">
                  {vehicle.registrationNumber}
                </span>
                <span>• {vehicle.category}</span>
                <span>• ID: {vehicle.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isBookable && (
              <Button
                size="sm"
                icon={<PlusCircle size={15} />}
                onClick={() => {
                  onClose();
                  onBookNow(vehicle.id);
                }}
              >
                Book Vehicle
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(vehicle);
              }}
            >
              Edit
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Overview & Pricing
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <History size={15} />
            Rental History ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`pb-3 px-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'maintenance'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Wrench size={15} />
            Maintenance & Status
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40">
                    <p className="text-xs text-neutral-400">Daily Rental</p>
                    <p className="text-base font-bold text-white mt-1">
                      {formatCurrency(vehicle.rentalPrice)}/day
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40">
                    <p className="text-xs text-neutral-400">Security Deposit</p>
                    <p className="text-base font-bold text-neutral-200 mt-1">
                      {formatCurrency(vehicle.securityDeposit)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40">
                    <p className="text-xs text-neutral-400">Category</p>
                    <p className="text-base font-bold text-emerald-400 mt-1">
                      {vehicle.category}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40">
                    <p className="text-xs text-neutral-400">Total Bookings</p>
                    <p className="text-base font-bold text-white mt-1">
                      {bookings.length}
                    </p>
                  </div>
                </div>

                {vehicle.notes && (
                  <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FileText size={14} /> Vehicle Notes & Condition
                    </p>
                    <p className="text-sm text-neutral-300 whitespace-pre-line">{vehicle.notes}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {bookings.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-8">
                    No rental history recorded for this vehicle yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-neutral-800">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-800/60 text-xs text-neutral-400">
                        <tr>
                          <th className="p-3">Booking ID</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Dates</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800 text-neutral-300">
                        {bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-neutral-800/30">
                            <td className="p-3 font-mono text-xs">{b.id}</td>
                            <td className="p-3">
                              <div className="font-medium text-white">{b.customerName}</div>
                              <div className="text-xs text-neutral-500">{b.customerPhone}</div>
                            </td>
                            <td className="p-3 text-xs">
                              {formatDate(b.pickupDate)} - {formatDate(b.returnDate)} ({b.rentalDuration}d)
                            </td>
                            <td className="p-3 font-semibold text-white">
                              {formatCurrency(b.rentalAmount)}
                            </td>
                            <td className="p-3">
                              <StatusBadge status={b.status} type="booking" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-4">
                {vehicle.status === 'maintenance' ? (
                  <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-950/20 space-y-3">
                    <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
                      <AlertTriangle size={18} />
                      Vehicle Currently In Maintenance
                    </div>
                    <p className="text-xs text-orange-300/80">
                      This vehicle is locked from bookings until maintenance is completed.
                    </p>
                    {vehicle.notes && (
                      <div className="p-3 rounded-lg bg-black/40 border border-orange-500/20 text-xs text-neutral-300">
                        <span className="font-semibold text-orange-300">Issue / Log:</span>{' '}
                        {vehicle.notes}
                      </div>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<CheckCircle size={16} />}
                      loading={isUpdatingStatus}
                      onClick={() => handleStatusChange('available')}
                    >
                      Complete Maintenance (Make Available)
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white">Maintenance Operations</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Need to service brakes, tyres, oil, or repairs? Move this vehicle into maintenance.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Wrench size={15} />}
                        loading={isUpdatingStatus}
                        onClick={() => handleStatusChange('maintenance')}
                      >
                        Send to Maintenance
                      </Button>
                    </div>
                  </div>
                )}

                {/* Quick Availability Switcher */}
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Quick Availability Toggle
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(['available', 'reserved', 'maintenance', 'inactive'] as const).map((st) => (
                      <button
                        key={st}
                        disabled={vehicle.status === st || isUpdatingStatus}
                        onClick={() => handleStatusChange(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                          vehicle.status === st
                            ? 'bg-neutral-800 text-white border-neutral-600 opacity-60 cursor-default'
                            : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-800'
                        }`}
                      >
                        Set {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-neutral-800">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

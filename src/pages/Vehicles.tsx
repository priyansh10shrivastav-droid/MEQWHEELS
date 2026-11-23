import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { Vehicle, VehicleFormData, VehicleCategory, VehicleStatus } from '../types';
import { VEHICLE_CATEGORIES } from '../lib/constants';
import { VehicleModal } from '../components/vehicles/VehicleModal';
import { VehicleDetailsModal } from '../components/vehicles/VehicleDetailsModal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { StatusBadge } from '../components/shared/StatusBadge';
import { SearchBar } from '../components/shared/SearchBar';
import { EmptyState } from '../components/shared/EmptyState';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../lib/utils';
import {
  Bike,
  Plus,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Eye,
  Edit2,
  Trash2,
  Tag,
  ShieldAlert,
} from 'lucide-react';

export const Vehicles: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    vehicles,
    loading,
    createVehicle,
    updateVehicle,
    updateStatus,
    deleteVehicle,
  } = useVehicles();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [detailsVehicle, setDetailsVehicle] = useState<Vehicle | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    variant?: 'danger' | 'primary';
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  // Handle URL query parameters for ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setEditingVehicle(null);
      setIsFormOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Keep details modal synchronized if vehicles list updates
  useEffect(() => {
    if (detailsVehicle) {
      const refreshed = vehicles.find((v) => v.id === detailsVehicle.id);
      if (refreshed) {
        setDetailsVehicle(refreshed);
      }
    }
  }, [vehicles, detailsVehicle]);

  // Computed metrics
  const totalFleet = vehicles.length;
  const availableCount = vehicles.filter((v) => v.status === 'available').length;
  const rentedCount = vehicles.filter((v) => v.status === 'rented').length;
  const maintenanceCount = vehicles.filter((v) => v.status === 'maintenance').length;

  // Filtered list
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // Category filter
      if (categoryFilter !== 'all' && v.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && v.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.registrationNumber.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          (v.notes && v.notes.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [vehicles, categoryFilter, statusFilter, searchQuery]);

  const handleFormSubmit = async (data: VehicleFormData) => {
    if (editingVehicle) {
      await updateVehicle(editingVehicle.id, data);
    } else {
      await createVehicle(data);
    }
    setIsFormOpen(false);
    setEditingVehicle(null);
  };

  const handleDeleteConfirm = (vehicle: Vehicle) => {
    if (vehicle.status === 'rented') {
      setConfirmDialog({
        isOpen: true,
        title: 'Cannot Delete Vehicle',
        message: `${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}) is currently on rent. Please complete or cancel the rental before deleting.`,
        confirmLabel: 'Understood',
        variant: 'primary',
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        },
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Vehicle from Fleet',
      message: `Are you sure you want to remove ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})? This action cannot be undone.`,
      confirmLabel: 'Delete Forever',
      variant: 'danger',
      onConfirm: async () => {
        await deleteVehicle(vehicle.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleQuickMaintenanceToggle = async (vehicle: Vehicle) => {
    const newStatus = vehicle.status === 'maintenance' ? 'available' : 'maintenance';
    await updateStatus(vehicle.id, newStatus);
  };

  const handleBookNow = (vehicleId: string) => {
    navigate(`/bookings?action=new&vehicleId=${vehicleId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Vehicle Fleet</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage your fleet availability, categories, maintenance logs, and rental rates.
          </p>
        </div>
        <Button
          icon={<Plus size={18} />}
          onClick={() => {
            setEditingVehicle(null);
            setIsFormOpen(true);
          }}
        >
          Add Vehicle
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Total Fleet</span>
            <Bike size={16} className="text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalFleet}</div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Available to Rent</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{availableCount}</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Currently Rented</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{rentedCount}</div>
        </div>

        <div className="rounded-xl border border-orange-500/30 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">In Maintenance</span>
            <Wrench size={16} className="text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-400 mt-2">{maintenanceCount}</div>
        </div>
      </div>

      {/* Search & Category Filter bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by brand, model, registration number..."
            className="w-full md:w-96"
          />

          {/* Status filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(
              [
                { id: 'all', label: 'All Status' },
                { id: 'available', label: 'Available' },
                { id: 'rented', label: 'Rented' },
                { id: 'reserved', label: 'Reserved' },
                { id: 'maintenance', label: 'Maintenance' },
                { id: 'inactive', label: 'Inactive' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-400 hover:bg-neutral-800/40 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-neutral-500 font-medium shrink-0 flex items-center gap-1">
            <Tag size={13} /> Category:
          </span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
              categoryFilter === 'all'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All
          </button>
          {VEHICLE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                categoryFilter === cat
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <EmptyState
            icon={<Bike size={32} />}
            title={searchQuery ? 'No vehicles match your search' : 'No vehicles found'}
            description={
              searchQuery
                ? 'Try adjusting your search criteria or category filter.'
                : 'Add your first two-wheeler to the MEQ Wheels fleet.'
            }
            action={
              !searchQuery && (
                <Button
                  size="sm"
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setEditingVehicle(null);
                    setIsFormOpen(true);
                  }}
                >
                  Add Vehicle
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/90 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Vehicle</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Daily Rate</th>
                  <th className="px-4 py-3.5">Security Deposit</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Service / Notes</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-neutral-800/25 transition-colors group cursor-pointer"
                    onClick={() => {
                      setDetailsVehicle(vehicle);
                      setIsDetailsOpen(true);
                    }}
                  >
                    {/* Vehicle Brand & Registration */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1c1c1c] text-neutral-300 border border-neutral-800">
                          <Bike size={20} />
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                            {vehicle.brand} {vehicle.model}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded">
                              {vehicle.registrationNumber}
                            </span>
                            <span className="text-[11px] font-mono text-neutral-500">
                              {vehicle.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4 text-sm text-neutral-300 font-medium">
                      {vehicle.category}
                    </td>

                    {/* Daily Rate */}
                    <td className="px-4 py-4 text-sm font-semibold text-white">
                      {formatCurrency(vehicle.rentalPrice)}
                      <span className="text-xs font-normal text-neutral-500"> /day</span>
                    </td>

                    {/* Security Deposit */}
                    <td className="px-4 py-4 text-sm text-neutral-300">
                      {formatCurrency(vehicle.securityDeposit)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <StatusBadge status={vehicle.status} type="vehicle" />
                    </td>

                    {/* Notes / Condition */}
                    <td className="px-4 py-4 text-xs text-neutral-400 max-w-xs truncate">
                      {vehicle.notes || <span className="text-neutral-600 italic">—</span>}
                    </td>

                    {/* Actions */}
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {/* View details */}
                        <button
                          onClick={() => {
                            setDetailsVehicle(vehicle);
                            setIsDetailsOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="View Specs & History"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingVehicle(vehicle);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Edit Vehicle"
                        >
                          <Edit2 size={16} />
                        </button>

                        {/* Maintenance quick toggle */}
                        <button
                          onClick={() => handleQuickMaintenanceToggle(vehicle)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            vehicle.status === 'maintenance'
                              ? 'text-orange-400 hover:bg-orange-950/40'
                              : 'text-neutral-400 hover:text-orange-400 hover:bg-neutral-800'
                          }`}
                          title={
                            vehicle.status === 'maintenance'
                              ? 'Complete Maintenance'
                              : 'Send to Maintenance'
                          }
                        >
                          <Wrench size={16} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteConfirm(vehicle)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Delete Vehicle"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vehicle Form Modal */}
      <VehicleModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingVehicle(null);
        }}
        onSubmit={handleFormSubmit}
        vehicle={editingVehicle}
      />

      {/* Vehicle Details Modal */}
      <VehicleDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setDetailsVehicle(null);
        }}
        vehicle={detailsVehicle}
        onEdit={(v) => {
          setEditingVehicle(v);
          setIsFormOpen(true);
        }}
        onUpdateStatus={updateStatus}
        onBookNow={handleBookNow}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
      />
    </div>
  );
};

export default Vehicles;

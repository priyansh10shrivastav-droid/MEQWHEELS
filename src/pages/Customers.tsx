import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCustomers } from '../hooks/useCustomers';
import { Customer, CustomerFormData } from '../types';
import { CustomerModal } from '../components/customers/CustomerModal';
import { CustomerDetailsModal } from '../components/customers/CustomerDetailsModal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { StatusBadge } from '../components/shared/StatusBadge';
import { SearchBar } from '../components/shared/SearchBar';
import { EmptyState } from '../components/shared/EmptyState';
import { Button } from '../components/ui/Button';
import { formatDate, getInitials } from '../lib/utils';
import {
  UserPlus,
  Users,
  CheckCircle2,
  Clock,
  Archive,
  Eye,
  Edit2,
  RotateCcw,
  Trash2,
  Phone,
  Mail,
} from 'lucide-react';

export const Customers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    customers,
    loading,
    createCustomer,
    updateCustomer,
    archiveCustomer,
    restoreCustomer,
    deleteCustomer,
  } = useCustomers();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'rejected' | 'archived'>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [detailsCustomer, setDetailsCustomer] = useState<Customer | null>(null);
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

  // Check URL query parameters for ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setEditingCustomer(null);
      setIsFormOpen(true);
      // clean up query param without refreshing
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Computed metrics
  const totalCount = customers.length;
  const verifiedCount = customers.filter((c) => c.verificationStatus === 'verified' && !c.isArchived).length;
  const pendingCount = customers.filter((c) => c.verificationStatus === 'pending' && !c.isArchived).length;
  const archivedCount = customers.filter((c) => c.isArchived).length;

  // Filtered & Searched customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Status filter
      if (statusFilter === 'archived') {
        if (!customer.isArchived) return false;
      } else {
        if (customer.isArchived) return false;
        if (statusFilter !== 'all' && customer.verificationStatus !== statusFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          customer.name.toLowerCase().includes(q) ||
          customer.phone.toLowerCase().includes(q) ||
          (customer.alternatePhone && customer.alternatePhone.toLowerCase().includes(q)) ||
          (customer.email && customer.email.toLowerCase().includes(q)) ||
          customer.address.toLowerCase().includes(q) ||
          customer.id.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [customers, statusFilter, searchQuery]);

  const handleFormSubmit = async (data: CustomerFormData) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, data);
    } else {
      await createCustomer(data);
    }
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  const handleArchiveConfirm = (customer: Customer) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Archive Customer',
      message: `Are you sure you want to archive ${customer.name}? They will be hidden from active customer lists.`,
      confirmLabel: 'Archive',
      variant: 'danger',
      onConfirm: async () => {
        await archiveCustomer(customer.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleRestoreConfirm = (customer: Customer) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Customer',
      message: `Restore ${customer.name} to active customers?`,
      confirmLabel: 'Restore',
      variant: 'primary',
      onConfirm: async () => {
        await restoreCustomer(customer.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDeleteConfirm = (customer: Customer) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Customer Permanently',
      message: `Are you sure you want to delete ${customer.name}? This action cannot be undone.`,
      confirmLabel: 'Delete Forever',
      variant: 'danger',
      onConfirm: async () => {
        await deleteCustomer(customer.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleBookNow = (customerId: string) => {
    navigate(`/bookings?action=new&customerId=${customerId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Management</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage your registered riders, verification statuses, and rental history.
          </p>
        </div>
        <Button
          icon={<UserPlus size={18} />}
          onClick={() => {
            setEditingCustomer(null);
            setIsFormOpen(true);
          }}
        >
          Add Customer
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Total Registered</span>
            <Users size={16} className="text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalCount}</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Verified Riders</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{verifiedCount}</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Pending Verification</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{pendingCount}</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Archived</span>
            <Archive size={16} className="text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-400 mt-2">{archivedCount}</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, phone, email, or ID..."
          className="w-full md:w-96"
        />

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              { id: 'all', label: 'All Active' },
              { id: 'verified', label: 'Verified' },
              { id: 'pending', label: 'Pending' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'archived', label: 'Archived' },
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

      {/* Customers Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={<Users size={32} />}
            title={searchQuery ? 'No customers match your search' : 'No customers found'}
            description={
              searchQuery
                ? 'Try adjusting your search criteria or filter options.'
                : 'Get started by adding your first customer to the system.'
            }
            action={
              !searchQuery && (
                <Button
                  size="sm"
                  icon={<UserPlus size={16} />}
                  onClick={() => {
                    setEditingCustomer(null);
                    setIsFormOpen(true);
                  }}
                >
                  Add Customer
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/90 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Address</th>
                  <th className="px-4 py-3.5">Joined</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-neutral-800/25 transition-colors group"
                  >
                    {/* Customer Name & ID */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1c1c1c] text-sm font-semibold text-neutral-300 border border-neutral-800">
                          {getInitials(customer.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                            {customer.name}
                          </div>
                          <div className="text-xs font-mono text-neutral-500">{customer.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center gap-1.5 text-neutral-300">
                        <Phone size={13} className="text-neutral-500 shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                        <span className="text-neutral-500 text-[11px]">Alt:</span>
                        <span>{customer.alternatePhone || customer.email || '—'}</span>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="px-4 py-4 text-sm text-neutral-400 max-w-xs truncate">
                      {customer.address}
                    </td>

                    {/* Joined Date */}
                    <td className="px-4 py-4 text-sm text-neutral-400">
                      {formatDate(customer.registrationDate)}
                    </td>

                    {/* Verification Status */}
                    <td className="px-4 py-4">
                      <StatusBadge status={customer.verificationStatus} type="verification" />
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details */}
                        <button
                          onClick={() => {
                            setDetailsCustomer(customer);
                            setIsDetailsOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="View Profile & History"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingCustomer(customer);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 size={16} />
                        </button>

                        {/* Archive / Restore */}
                        {customer.isArchived ? (
                          <button
                            onClick={() => handleRestoreConfirm(customer)}
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-colors"
                            title="Restore Customer"
                          >
                            <RotateCcw size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchiveConfirm(customer)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                            title="Archive Customer"
                          >
                            <Archive size={16} />
                          </button>
                        )}

                        {/* Delete permanently */}
                        <button
                          onClick={() => handleDeleteConfirm(customer)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Delete Permanently"
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

      {/* Customer Form Modal */}
      <CustomerModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleFormSubmit}
        customer={editingCustomer}
      />

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setDetailsCustomer(null);
        }}
        customer={detailsCustomer}
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

export default Customers;

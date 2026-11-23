import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Booking, BookingFormData, Customer, Vehicle, BookingStatus, CustomerFormData, BookingVehicleItem } from '../../types';
import { bookingService } from '../../services/bookingService';
import { customerService } from '../../services/customerService';
import { Modal } from '../ui/Modal';
import { Input, Select, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { CustomerModal } from '../customers/CustomerModal';
import { calculateDuration, formatCurrency, cn, compressImage } from '../../lib/utils';
import { AlertCircle, Calendar, Clock, CreditCard, ShieldCheck, UserPlus, Camera, FileText, Trash2, Eye, Plus, Bike } from 'lucide-react';

const bookingSchema = z
  .object({
    id: z.string().optional(),
    customerId: z.string().optional(),
    pickupDate: z.string().min(1, 'Pickup date is required'),
    pickupTime: z.string().min(1, 'Pickup time is required'),
    returnDate: z.string().min(1, 'Return date is required'),
    returnTime: z.string().min(1, 'Return time is required'),
    rentalAmount: z.number().min(0, 'Rental amount must be non-negative'),
    securityDeposit: z.number().min(0, 'Security deposit must be non-negative'),
    advancePayment: z.number().min(0, 'Advance payment must be non-negative'),
    status: z.enum(['confirmed', 'active', 'completed', 'cancelled', 'pending']),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.pickupDate || !data.returnDate) return true;
      return new Date(data.returnDate) >= new Date(data.pickupDate);
    },
    {
      message: 'Return date cannot be earlier than pickup date',
      path: ['returnDate'],
    },
  )
  .refine(
    (data) => {
      return data.advancePayment <= data.rentalAmount;
    },
    {
      message: 'Advance payment cannot exceed the total rental amount',
      path: ['advancePayment'],
    },
  );

type FormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookingFormData) => Promise<void>;
  booking?: Booking | null;
  customers: Customer[];
  vehicles: Vehicle[];
  initialCustomerId?: string;
  onCreateCustomer?: (data: CustomerFormData) => Promise<Customer>;
  onCustomerCreated?: () => Promise<void>;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  booking,
  customers,
  vehicles,
  initialCustomerId,
  onCreateCustomer,
  onCustomerCreated,
}) => {
  const [overlapError, setOverlapError] = useState<string | null>(null);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<{ vehicleId: string; odometerReading: number }[]>([]);

  const [newCustomerData, setNewCustomerData] = useState({
    id: '',
    name: '',
    phone: '',
    alternatePhone: '',
    address: '',
  });

  const [newCustomerErrors, setNewCustomerErrors] = useState<{
    id?: string;
    name?: string;
    phone?: string;
    alternatePhone?: string;
    address?: string;
  }>({});

  // Filter out maintenance and inactive vehicles (unless editing existing booking for that vehicle)
  const bookableVehicles = useMemo(() => {
    return vehicles.filter(
      (v) =>
        (v.status !== 'maintenance' && v.status !== 'inactive') ||
        (booking && (booking.vehicles?.some((bv) => bv.vehicleId === v.id) || booking.vehicleId === v.id)),
    );
  }, [vehicles, booking]);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      id: '',
      customerId: initialCustomerId || '',
      pickupDate: todayStr,
      pickupTime: '10:00',
      returnDate: tomorrowStr,
      returnTime: '10:00',
      rentalAmount: 0,
      securityDeposit: 1000,
      advancePayment: 0,
      status: 'confirmed',
      notes: '',
    },
  });

  const pickupDate = watch('pickupDate');
  const returnDate = watch('returnDate');
  const rentalAmount = watch('rentalAmount') || 0;
  const advancePayment = watch('advancePayment') || 0;

  // Dynamic duration calculation
  const durationDays = useMemo(() => {
    return calculateDuration(pickupDate, returnDate);
  }, [pickupDate, returnDate]);

  // Remaining balance calculation
  const remainingBalance = Math.max(0, rentalAmount - advancePayment);

  // Helper to recalculate rental amount and security deposit based on vehicles and duration
  const recalculateAmounts = (
    slots: { vehicleId: string; odometerReading: number }[],
    days: number,
  ) => {
    let totalDailyRent = 0;
    let totalDeposit = 0;
    for (const slot of slots) {
      if (slot.vehicleId) {
        const v = vehicles.find((item) => item.id === slot.vehicleId);
        if (v) {
          totalDailyRent += v.rentalPrice;
          totalDeposit += v.securityDeposit;
        }
      }
    }
    const calcRent = totalDailyRent * Math.max(1, days);
    setValue('rentalAmount', calcRent);
    setValue('securityDeposit', totalDeposit);
  };

  // Initialize or reset form
  useEffect(() => {
    setOverlapError(null);
    setVehicleError(null);
    setCustomerMode('existing');
    setNewCustomerData({
      id: '',
      name: '',
      phone: '',
      alternatePhone: '',
      address: '',
    });
    setNewCustomerErrors({});

    if (booking) {
      const existingImages = booking.images || [
        ...(booking.drivingLicensePhoto ? [booking.drivingLicensePhoto] : []),
        ...(booking.rentalAgreementPhoto ? [booking.rentalAgreementPhoto] : []),
      ];
      setImages(existingImages);

      if (booking.vehicles && booking.vehicles.length > 0) {
        setSelectedVehicles(
          booking.vehicles.map((bv) => ({
            vehicleId: bv.vehicleId,
            odometerReading: bv.odometerReading ?? 0,
          })),
        );
      } else if (booking.vehicleId) {
        setSelectedVehicles([
          {
            vehicleId: booking.vehicleId,
            odometerReading: booking.odometerReading ?? 0,
          },
        ]);
      } else {
        setSelectedVehicles([{ vehicleId: '', odometerReading: 0 }]);
      }

      reset({
        id: booking.id,
        customerId: booking.customerId,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        returnDate: booking.returnDate,
        returnTime: booking.returnTime,
        rentalAmount: booking.rentalAmount,
        securityDeposit: booking.securityDeposit,
        advancePayment: booking.advancePayment,
        status: booking.status,
        notes: booking.notes || '',
      });
    } else {
      setImages([]);
      const defaultVehicleId = bookableVehicles[0]?.id ?? '';
      const initialSlots = defaultVehicleId
        ? [{ vehicleId: defaultVehicleId, odometerReading: 0 }]
        : [{ vehicleId: '', odometerReading: 0 }];
      setSelectedVehicles(initialSlots);

      const defaultDaily = bookableVehicles[0]?.rentalPrice || 500;
      const defaultDeposit = bookableVehicles[0]?.securityDeposit || 1000;
      reset({
        id: '',
        customerId: initialCustomerId || (customers[0]?.id ?? ''),
        pickupDate: todayStr,
        pickupTime: '10:00',
        returnDate: tomorrowStr,
        returnTime: '10:00',
        rentalAmount: defaultDaily * 1,
        securityDeposit: defaultDeposit,
        advancePayment: 0,
        status: 'confirmed',
        notes: '',
      });
    }
  }, [booking, reset, isOpen, initialCustomerId, bookableVehicles, customers]);

  const handleDateChange = () => {
    setOverlapError(null);
    if (!booking) {
      setTimeout(() => {
        recalculateAmounts(selectedVehicles, durationDays);
      }, 50);
    }
  };

  const handleSlotVehicleChange = (index: number, newVehicleId: string) => {
    setOverlapError(null);
    setVehicleError(null);
    const updated = [...selectedVehicles];
    updated[index] = { ...updated[index], vehicleId: newVehicleId };
    setSelectedVehicles(updated);
    if (!booking) {
      recalculateAmounts(updated, durationDays);
    }
  };

  const handleSlotOdometerChange = (index: number, reading: number) => {
    const updated = [...selectedVehicles];
    updated[index] = { ...updated[index], odometerReading: Math.max(0, reading) };
    setSelectedVehicles(updated);
  };

  const handleAddSlot = () => {
    setOverlapError(null);
    setVehicleError(null);
    const existingIds = new Set(selectedVehicles.map((s) => s.vehicleId));
    const available = bookableVehicles.find((v) => !existingIds.has(v.id));
    const newVehicleId = available ? available.id : (bookableVehicles[0]?.id || '');
    const updated = [...selectedVehicles, { vehicleId: newVehicleId, odometerReading: 0 }];
    setSelectedVehicles(updated);
    if (!booking) {
      recalculateAmounts(updated, durationDays);
    }
  };

  const handleRemoveSlot = (index: number) => {
    if (selectedVehicles.length <= 1) return;
    setOverlapError(null);
    setVehicleError(null);
    const updated = selectedVehicles.filter((_, i) => i !== index);
    setSelectedVehicles(updated);
    if (!booking) {
      recalculateAmounts(updated, durationDays);
    }
  };

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const fileList = Array.from(files);
      const compressedList = await Promise.all(fileList.map((file) => compressImage(file)));
      setImages((prev) => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Failed to process image(s)', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleModalCustomerCreated = async (customerFormData: CustomerFormData) => {
    const createFn = onCreateCustomer || customerService.create;
    const created = await createFn(customerFormData);
    if (onCustomerCreated) {
      await onCustomerCreated();
    }
    if (created) {
      setValue('customerId', created.id);
      setCustomerMode('existing');
    }
  };

  const onFormSubmit = async (data: FormValues) => {
    setOverlapError(null);
    setVehicleError(null);
    let finalCustomerId = data.customerId;

    if (customerMode === 'new') {
      const errs: typeof newCustomerErrors = {};
      if (newCustomerData.name.trim().length < 2) {
        errs.name = 'Full name must be at least 2 characters';
      }
      if (newCustomerData.phone.trim().length < 10) {
        errs.phone = 'Phone must be at least 10 digits';
      }
      if (newCustomerData.alternatePhone.trim().length < 10) {
        errs.alternatePhone = 'Emergency contact / alternate phone must be at least 10 digits';
      }
      if (newCustomerData.address.trim().length < 3) {
        errs.address = 'Address is required (at least 3 characters)';
      }

      if (Object.keys(errs).length > 0) {
        setNewCustomerErrors(errs);
        return;
      }

      try {
        const createFn = onCreateCustomer || customerService.create;
        const createdCustomer = await createFn({
          id: newCustomerData.id.trim() || undefined,
          name: newCustomerData.name.trim(),
          phone: newCustomerData.phone.trim(),
          alternatePhone: newCustomerData.alternatePhone.trim(),
          address: newCustomerData.address.trim(),
          verificationStatus: 'verified',
          notes: 'Registered during booking creation',
        });

        if (onCustomerCreated) {
          await onCustomerCreated();
        }

        finalCustomerId = createdCustomer.id;
        setValue('customerId', createdCustomer.id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create customer';
        setOverlapError(msg);
        return;
      }
    } else {
      if (!finalCustomerId) {
        setOverlapError('Please select a customer or switch to "+ New Customer"');
        return;
      }
    }

    // Vehicle validation
    if (selectedVehicles.length === 0) {
      setVehicleError('Please add at least one vehicle to the booking.');
      return;
    }
    for (let i = 0; i < selectedVehicles.length; i++) {
      if (!selectedVehicles[i].vehicleId) {
        setVehicleError(`Please select a vehicle for Vehicle #${i + 1}`);
        return;
      }
    }
    const chosenIds = selectedVehicles.map((s) => s.vehicleId);
    if (new Set(chosenIds).size !== chosenIds.length) {
      setVehicleError('Each vehicle can only be selected once per booking. Please remove duplicate vehicle selections.');
      return;
    }

    try {
      // Validate overlap for all vehicles
      for (const slot of selectedVehicles) {
        const hasOverlap = await bookingService.checkOverlap(
          slot.vehicleId,
          data.pickupDate,
          data.returnDate,
          booking ? booking.id : undefined,
        );

        if (hasOverlap) {
          const vObj = vehicles.find((v) => v.id === slot.vehicleId);
          const vName = vObj ? `${vObj.brand} ${vObj.model} (${vObj.registrationNumber})` : slot.vehicleId;
          setOverlapError(`Vehicle ${vName} has an existing active or confirmed booking during these dates. Please choose different dates or another vehicle.`);
          return;
        }
      }

      const vehicleItems: BookingVehicleItem[] = selectedVehicles.map((slot) => {
        const vObj = vehicles.find((v) => v.id === slot.vehicleId);
        return {
          vehicleId: slot.vehicleId,
          vehicleName: vObj ? `${vObj.brand} ${vObj.model}` : slot.vehicleId,
          odometerReading: Number(slot.odometerReading) || 0,
          rentalPrice: vObj?.rentalPrice,
          securityDeposit: vObj?.securityDeposit,
        };
      });

      await onSubmit({
        id: data.id?.trim() || undefined,
        customerId: finalCustomerId,
        vehicleId: vehicleItems[0]?.vehicleId || '',
        vehicles: vehicleItems,
        odometerReading: vehicleItems[0]?.odometerReading || 0,
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
        returnDate: data.returnDate,
        returnTime: data.returnTime,
        rentalAmount: Number(data.rentalAmount),
        securityDeposit: Number(data.securityDeposit),
        advancePayment: Number(data.advancePayment),
        status: data.status as BookingStatus,
        notes: data.notes || '',
        images,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking creation failed';
      setOverlapError(msg);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={booking ? `Edit Booking (${booking.id})` : 'Create New Booking'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          {overlapError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-semibold text-red-200">Attention</p>
                <p className="text-xs text-red-300/90 mt-0.5">{overlapError}</p>
              </div>
            </div>
          )}

          {/* Custom Booking ID (New Booking Only) */}
          {!booking && (
            <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                    <FileText size={14} className="text-emerald-400" />
                    <span>Booking ID</span>
                    <span className="text-[11px] text-neutral-500 font-normal">(Optional)</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Enter your custom Booking ID (e.g. BK-101) or leave blank to auto-generate.
                  </p>
                </div>
                <div className="w-full sm:w-60 shrink-0">
                  <Input
                    placeholder="e.g. BK-101 (optional)"
                    className="font-mono uppercase text-xs"
                    {...register('id')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Customer Selection / Creation */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <span className="text-sm font-semibold text-white">Customer Details</span>
                <p className="text-xs text-neutral-400">
                  Select an existing customer or create a new one directly with this booking.
                </p>
              </div>
              {!booking && (
                <div className="flex items-center gap-1 bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-700/60 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('existing');
                      setOverlapError(null);
                    }}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                      customerMode === 'existing'
                        ? 'bg-neutral-700 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white',
                    )}
                  >
                    Existing Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('new');
                      setOverlapError(null);
                    }}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
                      customerMode === 'new'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-emerald-400 hover:bg-emerald-950/40',
                    )}
                  >
                    <UserPlus size={13} />
                    <span>+ New Customer</span>
                  </button>
                </div>
              )}
            </div>

            {customerMode === 'existing' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-neutral-300">
                    Customer *
                  </label>
                  {!booking && (
                    <button
                      type="button"
                      onClick={() => setIsNewCustomerModalOpen(true)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <UserPlus size={12} />
                      <span>+ New Customer</span>
                    </button>
                  )}
                </div>
                <select
                  value={watch('customerId')}
                  onChange={(e) => {
                    if (e.target.value === '__CREATE_NEW__') {
                      setCustomerMode('new');
                    } else {
                      setValue('customerId', e.target.value);
                      setOverlapError(null);
                    }
                  }}
                  className={cn(
                    'w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition-colors',
                    errors.customerId && 'border-red-500 focus:border-red-500 focus:ring-red-500/40',
                  )}
                >
                  <option value="">Select customer...</option>
                  {!booking && (
                    <option value="__CREATE_NEW__" className="text-emerald-400 font-semibold bg-neutral-900">
                      ➕ + Add New Customer...
                    </option>
                  )}
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - {c.id}
                    </option>
                  ))}
                </select>
                {errors.customerId && (
                  <p className="text-xs text-red-400">{errors.customerId.message}</p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                  <div className="flex items-center gap-2">
                    <UserPlus size={15} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      New Customer Registration
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomerModalOpen(true)}
                    className="text-xs text-neutral-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
                  >
                    Open in full modal
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Customer ID"
                    placeholder="e.g. CU-101 (optional)"
                    className="font-mono uppercase text-xs"
                    value={newCustomerData.id}
                    onChange={(e) =>
                      setNewCustomerData((prev) => ({ ...prev, id: e.target.value }))
                    }
                    helperText="Leave blank to auto-generate"
                  />
                  <Input
                    label="Full Name *"
                    placeholder="e.g. Rahul Sharma"
                    value={newCustomerData.name}
                    onChange={(e) => {
                      setNewCustomerData((prev) => ({ ...prev, name: e.target.value }));
                      if (newCustomerErrors.name) setNewCustomerErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    error={newCustomerErrors.name}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Phone Number *"
                    placeholder="e.g. 9876543210"
                    value={newCustomerData.phone}
                    onChange={(e) => {
                      setNewCustomerData((prev) => ({ ...prev, phone: e.target.value }));
                      if (newCustomerErrors.phone) setNewCustomerErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    error={newCustomerErrors.phone}
                  />
                  <Input
                    label="Emergency Contact / Alternate Phone *"
                    placeholder="e.g. 9876543211 (Parent / Friend)"
                    value={newCustomerData.alternatePhone}
                    onChange={(e) => {
                      setNewCustomerData((prev) => ({ ...prev, alternatePhone: e.target.value }));
                      if (newCustomerErrors.alternatePhone) setNewCustomerErrors((prev) => ({ ...prev, alternatePhone: undefined }));
                    }}
                    error={newCustomerErrors.alternatePhone}
                  />
                </div>

                <Input
                  label="Address *"
                  placeholder="e.g. 42, Indiranagar, Bengaluru"
                  value={newCustomerData.address}
                  onChange={(e) => {
                    setNewCustomerData((prev) => ({ ...prev, address: e.target.value }));
                    if (newCustomerErrors.address) setNewCustomerErrors((prev) => ({ ...prev, address: undefined }));
                  }}
                  error={newCustomerErrors.address}
                />
              </div>
            )}
          </div>

          {/* Vehicles Booked Section */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Bike size={16} className="text-emerald-400" />
                  <span>Vehicles Booked</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                    {selectedVehicles.length} {selectedVehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Book 1, 2, 3, or more vehicles together for a customer or group.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                icon={<Plus size={14} />}
                onClick={handleAddSlot}
                className="border-dashed border-emerald-700/60 hover:bg-emerald-950/40 text-emerald-400 hover:text-emerald-300 shrink-0 self-start sm:self-auto"
              >
                + Add Vehicle
              </Button>
            </div>

            {vehicleError && (
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{vehicleError}</span>
              </div>
            )}

            <div className="space-y-3">
              {selectedVehicles.map((slot, index) => {
                const currentVehicle = vehicles.find((v) => v.id === slot.vehicleId);
                return (
                  <div
                    key={index}
                    className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/80 space-y-3 transition-colors hover:border-neutral-700/80"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                          {index + 1}
                        </span>
                        <span className="text-xs font-semibold text-neutral-200">
                          Vehicle #{index + 1}
                        </span>
                        {currentVehicle && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800/80 text-emerald-400 border border-neutral-700/50">
                            {formatCurrency(currentVehicle.rentalPrice)}/day • Deposit: {formatCurrency(currentVehicle.securityDeposit)}
                          </span>
                        )}
                      </div>

                      {selectedVehicles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(index)}
                          className="p-1 text-neutral-400 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                          title="Remove this vehicle"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-neutral-300">
                          Select Vehicle *
                        </label>
                        <select
                          value={slot.vehicleId}
                          onChange={(e) => handleSlotVehicleChange(index, e.target.value)}
                          className="w-full rounded-lg border border-neutral-700 bg-neutral-800/60 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition-colors"
                        >
                          <option value="">Choose a vehicle...</option>
                          {bookableVehicles.map((v) => {
                            const isSelectedElsewhere = selectedVehicles.some(
                              (other, oIdx) => oIdx !== index && other.vehicleId === v.id,
                            );
                            return (
                              <option
                                key={v.id}
                                value={v.id}
                                disabled={isSelectedElsewhere}
                                className={isSelectedElsewhere ? 'text-neutral-500' : ''}
                              >
                                {v.brand} {v.model} ({v.registrationNumber}) — {formatCurrency(v.rentalPrice)}/day
                                {isSelectedElsewhere ? ' (Already selected)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <Input
                          label="Odometer Reading (KM) *"
                          type="number"
                          placeholder="e.g. 14250"
                          value={slot.odometerReading || ''}
                          onChange={(e) => handleSlotOdometerChange(index, Number(e.target.value))}
                          helperText="Vehicle KM reading at booking time"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddSlot}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus size={14} />
                <span>+ Add Another Vehicle (e.g. 2, 3, 4 vehicles)</span>
              </button>
            </div>
          </div>

          {/* Pickup and Return Schedule */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Calendar size={16} className="text-emerald-400" />
                Rental Schedule
              </div>
              <div className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Duration: {durationDays} day{durationDays !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pickup */}
              <div className="space-y-3">
                <Input
                  label="Pickup Date *"
                  type="date"
                  {...register('pickupDate', { onChange: handleDateChange })}
                  error={errors.pickupDate?.message}
                />
                <Input
                  label="Pickup Time *"
                  type="time"
                  {...register('pickupTime')}
                  error={errors.pickupTime?.message}
                />
              </div>

              {/* Return */}
              <div className="space-y-3">
                <Input
                  label="Return Date *"
                  type="date"
                  {...register('returnDate', { onChange: handleDateChange })}
                  error={errors.returnDate?.message}
                />
                <Input
                  label="Return Time *"
                  type="time"
                  {...register('returnTime')}
                  error={errors.returnTime?.message}
                />
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <CreditCard size={16} className="text-emerald-400" />
              Pricing & Payments
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Rental Amount (₹) *"
                type="number"
                {...register('rentalAmount', { valueAsNumber: true })}
                error={errors.rentalAmount?.message}
              />

              <Input
                label="Security Deposit (₹) *"
                type="number"
                {...register('securityDeposit', { valueAsNumber: true })}
                error={errors.securityDeposit?.message}
              />

              <Input
                label="Advance Payment (₹) *"
                type="number"
                {...register('advancePayment', { valueAsNumber: true })}
                error={errors.advancePayment?.message}
              />
            </div>

            {/* Balance summary bar */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-sm">
              <span className="text-neutral-400">Remaining Balance Due:</span>
              <span
                className={`font-bold font-mono text-base ${
                  remainingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {formatCurrency(remainingBalance)}
              </span>
            </div>
          </div>

          {/* Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Booking Status *"
              options={[
                { value: 'confirmed', label: 'Confirmed (Reserved)' },
                { value: 'active', label: 'Active (On Rent)' },
                { value: 'completed', label: 'Completed (Returned)' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'pending', label: 'Pending Payment / Inquiry' },
              ]}
              {...register('status')}
              error={errors.status?.message}
            />

            <div className="sm:col-span-2">
              <Input
                label="Booking Notes / Helmets / Accessories"
                placeholder="e.g. 2 Helmets provided, ID card deposited..."
                {...register('notes')}
                error={errors.notes?.message}
              />
            </div>
          </div>

          {/* Photos & Documents Section */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Camera size={16} className="text-emerald-400" />
                  Photos & Documents
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Attach any documents or pictures (e.g. driving license, signed agreement, customer ID, vehicle photos).
                </p>
              </div>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm shrink-0">
                <Plus size={14} />
                <span>Add Image</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddImages}
                  className="hidden"
                />
              </label>
            </div>

            {images.length === 0 ? (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-700 hover:border-emerald-500/70 rounded-xl bg-neutral-900/40 hover:bg-neutral-800/40 cursor-pointer transition-all text-center group">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                  <Camera size={20} />
                </div>
                <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  Add Image
                </span>
                <span className="text-xs text-neutral-400 mt-1">
                  Click to upload pictures (add whatever amount of photos you need)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddImages}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden border border-neutral-800 bg-black h-28 flex items-center justify-center"
                  >
                    <img
                      src={img}
                      alt={`Attached photo ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />

                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/70 text-neutral-300 backdrop-blur-sm">
                      #{idx + 1}
                    </span>

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: img,
                            title: `Image #${idx + 1}`,
                          })
                        }
                        className="p-1.5 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                        title="View Full Size"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 rounded-lg bg-red-950/80 text-red-400 hover:bg-red-900 transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <label className="flex flex-col items-center justify-center h-28 border border-dashed border-neutral-700 hover:border-emerald-500/70 rounded-lg bg-neutral-900/40 hover:bg-neutral-800/50 cursor-pointer transition-all text-neutral-400 hover:text-emerald-400 text-center group">
                  <Plus size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold mt-1">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddImages}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {booking ? 'Save Changes' : 'Confirm & Create Booking'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stacked Customer Modal */}
      <CustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onSubmit={handleModalCustomerCreated}
        zIndex="z-[60]"
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewImage(null)}
          title={previewImage.title}
          size="lg"
          zIndex="z-[70]"
        >
          <div className="flex flex-col items-center justify-center p-2 space-y-4">
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-2xl border border-neutral-800"
            />
            <div className="flex justify-end w-full pt-2 border-t border-neutral-800">
              <Button size="sm" variant="ghost" onClick={() => setPreviewImage(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

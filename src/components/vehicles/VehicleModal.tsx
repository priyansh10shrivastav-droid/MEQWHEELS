import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Vehicle, VehicleFormData, VehicleCategory, VehicleStatus } from '../../types';
import { VEHICLE_CATEGORIES } from '../../lib/constants';
import { Modal } from '../ui/Modal';
import { Input, Select, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';

const vehicleSchema = z.object({
  registrationNumber: z
    .string()
    .min(5, 'Registration number is too short')
    .transform((val) => val.trim().toUpperCase()),
  brand: z.string().min(2, 'Brand must be at least 2 characters'),
  model: z.string().min(2, 'Model must be at least 2 characters'),
  category: z.enum(['Scooter', 'Motorcycle', 'Sport', 'Cruiser', 'Electric']),
  rentalPrice: z.number().min(100, 'Daily rental price must be at least ₹100'),
  securityDeposit: z.number().min(0, 'Security deposit must be non-negative'),
  status: z.enum(['available', 'reserved', 'rented', 'maintenance', 'inactive']),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof vehicleSchema>;

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  vehicle?: Vehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vehicle,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registrationNumber: '',
      brand: '',
      model: '',
      category: 'Scooter',
      rentalPrice: 500,
      securityDeposit: 1000,
      status: 'available',
      notes: '',
    },
  });

  useEffect(() => {
    if (vehicle) {
      reset({
        registrationNumber: vehicle.registrationNumber,
        brand: vehicle.brand,
        model: vehicle.model,
        category: vehicle.category,
        rentalPrice: vehicle.rentalPrice,
        securityDeposit: vehicle.securityDeposit,
        status: vehicle.status,
        notes: vehicle.notes || '',
      });
    } else {
      reset({
        registrationNumber: '',
        brand: '',
        model: '',
        category: 'Scooter',
        rentalPrice: 500,
        securityDeposit: 1000,
        status: 'available',
        notes: '',
      });
    }
  }, [vehicle, reset, isOpen]);

  const onFormSubmit = async (data: FormValues) => {
    await onSubmit({
      ...data,
      notes: data.notes || '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? `Edit Vehicle (${vehicle.registrationNumber})` : 'Add New Vehicle'}
      size="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Registration Number *"
            placeholder="e.g. KA-01-EQ-1001"
            className="uppercase font-mono"
            {...register('registrationNumber')}
            error={errors.registrationNumber?.message}
          />

          <Select
            label="Category *"
            options={VEHICLE_CATEGORIES.map((cat) => ({
              value: cat,
              label: cat,
            }))}
            {...register('category')}
            error={errors.category?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Brand / Make *"
            placeholder="e.g. Honda, Royal Enfield"
            {...register('brand')}
            error={errors.brand?.message}
          />

          <Input
            label="Model *"
            placeholder="e.g. Activa 6G, Classic 350"
            {...register('model')}
            error={errors.model?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Daily Rental Price (₹) *"
            type="number"
            placeholder="e.g. 500"
            {...register('rentalPrice', { valueAsNumber: true })}
            error={errors.rentalPrice?.message}
          />

          <Input
            label="Security Deposit (₹) *"
            type="number"
            placeholder="e.g. 1000"
            {...register('securityDeposit', { valueAsNumber: true })}
            error={errors.securityDeposit?.message}
          />
        </div>

        <Select
          label="Initial Status *"
          options={[
            { value: 'available', label: 'Available for Rent' },
            { value: 'reserved', label: 'Reserved' },
            { value: 'rented', label: 'Currently Rented' },
            { value: 'maintenance', label: 'In Maintenance / Servicing' },
            { value: 'inactive', label: 'Inactive / Out of Service' },
          ]}
          {...register('status')}
          error={errors.status?.message}
        />

        <Textarea
          label="Notes / Maintenance Log"
          placeholder="Service records, tyre condition, insurance renewal date, helmet availability..."
          {...register('notes')}
          error={errors.notes?.message}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {vehicle ? 'Update Vehicle' : 'Add Vehicle to Fleet'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

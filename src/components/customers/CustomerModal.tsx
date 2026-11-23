import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Customer, CustomerFormData } from '../../types';
import { Modal } from '../ui/Modal';
import { Input, Select, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';

const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  alternatePhone: z
    .string()
    .min(10, 'Emergency contact / alternate phone must be at least 10 digits'),
  address: z.string().min(3, 'Address is required'),
  verificationStatus: z.enum(['verified', 'pending', 'rejected']),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof customerSchema>;

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => Promise<Customer | void>;
  customer?: Customer | null;
  zIndex?: string;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customer,
  zIndex,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      id: '',
      name: '',
      phone: '',
      alternatePhone: '',
      address: '',
      verificationStatus: 'verified',
      notes: '',
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        alternatePhone: customer.alternatePhone || customer.email || '',
        address: customer.address,
        verificationStatus: customer.verificationStatus,
        notes: customer.notes || '',
      });
    } else {
      reset({
        id: '',
        name: '',
        phone: '',
        alternatePhone: '',
        address: '',
        verificationStatus: 'verified',
        notes: '',
      });
    }
  }, [customer, reset, isOpen]);

  const onFormSubmit = async (data: FormValues) => {
    try {
      await onSubmit({
        ...data,
        id: data.id?.trim() ? data.id.trim() : undefined,
        notes: data.notes || '',
      });
      onClose();
    } catch {
      // Keep modal open so the user can fix any error (e.g. duplicate ID)
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Edit Customer' : 'Add New Customer'}
      size="md"
      zIndex={zIndex}
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Input
          label="Customer ID"
          placeholder="e.g. CU-101 (leave blank to auto-generate)"
          className="font-mono uppercase"
          disabled={Boolean(customer)}
          helperText={
            customer
              ? 'Customer ID cannot be changed once assigned'
              : 'Optional custom ID. If left empty, an ID will be generated automatically.'
          }
          {...register('id')}
          error={errors.id?.message}
        />

        <Input
          label="Full Name *"
          placeholder="e.g. Rahul Sharma"
          {...register('name')}
          error={errors.name?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number *"
            placeholder="e.g. 9876543210"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <Input
            label="Emergency Contact / Alternate Phone *"
            placeholder="e.g. 9876543211 (Parent / Friend)"
            {...register('alternatePhone')}
            error={errors.alternatePhone?.message}
          />
        </div>

        <Input
          label="Address *"
          placeholder="e.g. 42, Indiranagar, Bengaluru"
          {...register('address')}
          error={errors.address?.message}
        />

        <Select
          label="Verification Status *"
          options={[
            { value: 'verified', label: 'Verified' },
            { value: 'pending', label: 'Pending Verification' },
            { value: 'rejected', label: 'Rejected' },
          ]}
          {...register('verificationStatus')}
          error={errors.verificationStatus?.message}
        />

        <Textarea
          label="Notes / Documents"
          placeholder="Driving license details, ID proofs, preferences..."
          {...register('notes')}
          error={errors.notes?.message}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {customer ? 'Update Customer' : 'Add Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

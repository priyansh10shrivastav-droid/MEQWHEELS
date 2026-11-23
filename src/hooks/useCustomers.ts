import { useState, useEffect, useCallback } from 'react';
import { Customer, CustomerFormData } from '../types';
import { customerService } from '../services/customerService';
import toast from 'react-hot-toast';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await customerService.getAll();
      setCustomers(data);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const createCustomer = async (data: CustomerFormData) => {
    try {
      const created = await customerService.create(data);
      toast.success(`Customer ${created.name} added successfully`);
      await fetchCustomers();
      return created;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create customer';
      toast.error(msg);
      throw err;
    }
  };

  const updateCustomer = async (id: string, data: Partial<CustomerFormData>) => {
    try {
      const updated = await customerService.update(id, data);
      toast.success('Customer updated successfully');
      await fetchCustomers();
      return updated;
    } catch {
      toast.error('Failed to update customer');
      throw new Error('Update customer failed');
    }
  };

  const archiveCustomer = async (id: string) => {
    try {
      await customerService.archive(id);
      toast.success('Customer archived');
      await fetchCustomers();
    } catch {
      toast.error('Failed to archive customer');
    }
  };

  const restoreCustomer = async (id: string) => {
    try {
      await customerService.restore(id);
      toast.success('Customer restored');
      await fetchCustomers();
    } catch {
      toast.error('Failed to restore customer');
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await customerService.delete(id);
      toast.success('Customer deleted');
      await fetchCustomers();
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  return {
    customers,
    loading,
    refresh: fetchCustomers,
    createCustomer,
    updateCustomer,
    archiveCustomer,
    restoreCustomer,
    deleteCustomer,
  };
}

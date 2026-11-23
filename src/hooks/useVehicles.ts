import { useState, useEffect, useCallback } from 'react';
import { Vehicle, VehicleFormData } from '../types';
import { vehicleService } from '../services/vehicleService';
import toast from 'react-hot-toast';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getAll();
      setVehicles(data);
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const createVehicle = async (data: VehicleFormData) => {
    try {
      const created = await vehicleService.create(data);
      toast.success(`Vehicle ${created.brand} ${created.model} added!`);
      await fetchVehicles();
      return created;
    } catch {
      toast.error('Failed to create vehicle');
      throw new Error('Create vehicle failed');
    }
  };

  const updateVehicle = async (id: string, data: Partial<VehicleFormData>) => {
    try {
      const updated = await vehicleService.update(id, data);
      toast.success('Vehicle updated');
      await fetchVehicles();
      return updated;
    } catch {
      toast.error('Failed to update vehicle');
      throw new Error('Update vehicle failed');
    }
  };

  const updateStatus = async (id: string, status: Vehicle['status']) => {
    try {
      const updated = await vehicleService.updateStatus(id, status);
      toast.success(`Vehicle status changed to ${status}`);
      await fetchVehicles();
      return updated;
    } catch {
      toast.error('Failed to update status');
      throw new Error('Update status failed');
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      await vehicleService.delete(id);
      toast.success('Vehicle deleted successfully');
      await fetchVehicles();
    } catch {
      toast.error('Failed to delete vehicle');
    }
  };

  return {
    vehicles,
    loading,
    refresh: fetchVehicles,
    createVehicle,
    updateVehicle,
    updateStatus,
    deleteVehicle,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { Booking, BookingFormData } from '../types';
import { bookingService } from '../services/bookingService';
import toast from 'react-hot-toast';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAll();
      setBookings(data);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = async (data: BookingFormData) => {
    try {
      const created = await bookingService.create(data);
      toast.success(`Booking ${created.id} confirmed!`);
      await fetchBookings();
      return created;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create booking';
      toast.error(message);
      throw err;
    }
  };

  const updateBooking = async (id: string, data: Partial<BookingFormData>) => {
    try {
      const updated = await bookingService.update(id, data);
      toast.success('Booking updated successfully');
      await fetchBookings();
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update booking';
      toast.error(message);
      throw err;
    }
  };

  const cancelBooking = async (id: string) => {
    try {
      await bookingService.cancel(id);
      toast.success('Booking cancelled');
      await fetchBookings();
    } catch {
      toast.error('Failed to cancel booking');
    }
  };

  return {
    bookings,
    loading,
    refresh: fetchBookings,
    createBooking,
    updateBooking,
    cancelBooking,
  };
}

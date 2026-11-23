import { format, differenceInDays, parseISO, isAfter, isBefore, isEqual, startOfDay } from 'date-fns';

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}${random}`.toUpperCase();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'dd MMM yyyy');
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string, timeString?: string): string {
  if (!dateString) return '';
  try {
    const formatted = format(parseISO(dateString), 'dd MMM yyyy');
    return timeString ? `${formatted}, ${timeString}` : formatted;
  } catch {
    return dateString;
  }
}

export function calculateDuration(pickupDate: string, returnDate: string): number {
  if (!pickupDate || !returnDate) return 0;
  try {
    const days = differenceInDays(parseISO(returnDate), parseISO(pickupDate));
    return Math.max(days, 1);
  } catch {
    return 0;
  }
}

export function isDateOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const a1 = startOfDay(parseISO(startA));
  const a2 = startOfDay(parseISO(endA));
  const b1 = startOfDay(parseISO(startB));
  const b2 = startOfDay(parseISO(endB));

  return (isBefore(a1, b2) || isEqual(a1, b2)) && (isAfter(a2, b1) || isEqual(a2, b1));
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function cn(...classes: unknown[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.75,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(event.target?.result as string);
    };
    reader.onerror = (error) => reject(error);
  });
}

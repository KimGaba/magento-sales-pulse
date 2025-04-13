
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

// Format currency values
export const formatCurrency = (value: number, currency = 'DKK'): string => {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Format percentage values
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Format dates for display
export const formatDate = (date: string | Date, formatString = 'PPP'): string => {
  return format(new Date(date), formatString, { locale: da });
};

// Format month name
export const formatMonth = (date: string | Date): string => {
  return format(new Date(date), 'MMMM yyyy', { locale: da });
};

// Format day name
export const formatDay = (date: string | Date): string => {
  return format(new Date(date), 'EEEE', { locale: da });
};

// Format time
export const formatTime = (date: string | Date): string => {
  return format(new Date(date), 'HH:mm', { locale: da });
};

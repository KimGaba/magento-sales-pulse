
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, isAfter } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { fetchAvailableDataMonths } from '@/services/salesService';

type DateFilter = {
  fromDate: string;
  toDate: string;
  displayText: string;
};

export function useSalesFilters(storeIds: string[] = []) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Fetch available months data for highlighting in calendar
  const { 
    data: availableMonths = [], 
    isLoading: isLoadingMonths,
    error: monthsError
  } = useQuery({
    queryKey: ['availableMonths', storeIds],
    queryFn: () => fetchAvailableDataMonths(storeIds),
  });

  // Generate date filter values
  const dateFilter: DateFilter = date ? {
    fromDate: format(startOfMonth(date), 'yyyy-MM-dd'),
    toDate: format(endOfMonth(date), 'yyyy-MM-dd'),
    displayText: format(date, 'MMMM yyyy')
  } : {
    fromDate: '',
    toDate: '',
    displayText: 'Vælg måned'
  };

  // Identify which dates have data
  const hasDataForMonth = (day: Date) => {
    return availableMonths.some(availMonth => {
      const monthNum = parseInt(availMonth.month);
      const yearNum = availMonth.year;
      if (!isNaN(monthNum) && !isNaN(yearNum)) {
        const availMonthDate = new Date(yearNum, monthNum - 1);
        return availMonthDate.getMonth() === day.getMonth() && 
               availMonthDate.getFullYear() === day.getFullYear();
      }
      return false;
    });
  };

  // Set a default date if none is selected yet
  useEffect(() => {
    if (!date && availableMonths.length > 0) {
      // Find the most recent month with data
      const sortedMonths = [...availableMonths].sort((a, b) => {
        const dateA = new Date(a.year, parseInt(a.month) - 1);
        const dateB = new Date(b.year, parseInt(b.month) - 1);
        return isAfter(dateB, dateA) ? 1 : -1;
      });
      
      if (sortedMonths.length > 0) {
        const latestMonth = sortedMonths[0];
        setDate(new Date(latestMonth.year, parseInt(latestMonth.month) - 1));
      } else {
        setDate(new Date());
      }
    }
  }, [availableMonths, date]);

  return {
    date,
    setDate,
    dateFilter,
    availableMonths,
    isLoadingMonths,
    monthsError,
    hasDataForMonth
  };
}

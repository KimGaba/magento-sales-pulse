
import { useState, useEffect } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useFilter } from '@/context/FilterContext';

type TimeFilter = '7d' | '30d' | '1y' | 'all';

export function useTrendsFilters() {
  const { selectedStoreIds, customerGroup, orderStatuses } = useFilter();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('1y');

  // Generate date range based on the selected time filter
  const getDateRange = () => {
    const now = new Date();
    
    switch (timeFilter) {
      case '7d':
        return {
          fromDate: format(subMonths(now, 1), 'yyyy-MM-dd'),
          toDate: format(now, 'yyyy-MM-dd'),
          displayText: '7 dage'
        };
      case '30d':
        return {
          fromDate: format(subMonths(now, 3), 'yyyy-MM-dd'),
          toDate: format(now, 'yyyy-MM-dd'),
          displayText: '30 dage'
        };
      case '1y':
        return {
          fromDate: format(subMonths(now, 12), 'yyyy-MM-dd'),
          toDate: format(now, 'yyyy-MM-dd'),
          displayText: '1 år'
        };
      case 'all':
      default:
        return {
          fromDate: format(subMonths(now, 36), 'yyyy-MM-dd'),
          toDate: format(now, 'yyyy-MM-dd'),
          displayText: 'Alle'
        };
    }
  };

  const dateRange = getDateRange();

  return {
    timeFilter,
    setTimeFilter,
    dateRange,
    selectedStoreIds,
    customerGroup,
    orderStatuses
  };
}

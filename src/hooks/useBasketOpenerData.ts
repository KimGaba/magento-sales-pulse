
import { useState, useEffect, useCallback } from 'react';
import { useFilter } from '@/context/FilterContext';
import { addMonths, format } from 'date-fns';
import { fetchBasketOpenerProducts, BasketOpenerProduct } from '@/services/transactionService';
import { getStoresForUser } from '@/services/storeService';
import { useAuth } from '@/context/AuthContext';

export const useBasketOpenerData = (selectedMonths: string) => {
  const [products, setProducts] = useState<BasketOpenerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { storeView, customerGroup, orderStatuses } = useFilter();
  const { user } = useAuth();
  
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Calculate date range from selected months
      const now = new Date();
      const monthsAgo = addMonths(now, -parseInt(selectedMonths));
      const fromDate = format(monthsAgo, 'yyyy-MM-dd');
      const toDate = format(now, 'yyyy-MM-dd');
      
      // Convert selected order statuses
      const selectedStatuses = Object.entries(orderStatuses)
        .filter(([_, selected]) => selected)
        .map(([status]) => status);
      
      // If no statuses are selected, don't load data
      if (selectedStatuses.length === 0) {
        setProducts([]);
        return;
      }
      
      // Get stores the user has access to
      let storeIds: string[] = [];
      if (user) {
        try {
          const userStores = await getStoresForUser(user.id);
          storeIds = userStores.map(store => store.id);
        } catch (error) {
          console.error('Error getting stores for user:', error);
          // Continue with empty storeIds
        }
      }
      
      // If there are no stores, return empty data
      if (storeIds.length === 0) {
        setProducts([]);
        return;
      }
      
      // Get the opener products
      const data = await fetchBasketOpenerProducts(
        fromDate, 
        toDate, 
        storeIds,
        storeView !== 'alle' ? storeView : undefined,
        customerGroup !== 'alle' ? customerGroup : undefined,
        selectedStatuses
      );
      
      setProducts(data);
    } catch (err) {
      console.error('Error fetching basket opener data:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonths, storeView, customerGroup, orderStatuses, user]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleRetry = () => {
    fetchData();
  };
  
  return { products, isLoading, error, handleRetry };
};

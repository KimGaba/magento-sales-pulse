
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { fetchBasketOpenerProducts, BasketOpenerProduct } from '@/services/transactionService';
import { toast } from '@/hooks/use-toast';
import { useFilter } from '@/context/FilterContext';

export const useBasketOpenerData = (selectedMonths: string) => {
  // Get store filter from FilterContext
  const { storeView } = useFilter();
  
  // Calculate dates based on selected period
  const today = new Date();
  const fromDate = format(subMonths(today, parseInt(selectedMonths)), 'yyyy-MM-dd');
  const toDate = format(today, 'yyyy-MM-dd');

  // Convert storeView to store IDs for filtering
  // Using the test store ID we added in our SQL script
  const storeIds = storeView === 'alle' 
    ? [] // Empty array means all stores
    : ['22222222-2222-2222-2222-222222222222']; // Use our test store ID

  // Query for basket opener products
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['basket-openers', fromDate, toDate, storeView],
    queryFn: async () => {
      try {
        console.log(`Fetching basket opener products from ${fromDate} to ${toDate} with store filter: ${storeIds.length ? storeIds.join(', ') : 'all stores'}`);
        const result = await fetchBasketOpenerProducts(fromDate, toDate, storeIds);
        console.log(`Fetched ${result.length} basket opener products`);
        return result;
      } catch (fetchError) {
        console.error('Error in basket opener products query:', fetchError);
        toast({
          title: "Error loading data",
          description: "Failed to load basket opener data. Please try again.",
          variant: "destructive"
        });
        return [];
      }
    },
    retry: 1,
  });

  // Ensure we always have an array of products
  const products: BasketOpenerProduct[] = data || [];
  
  const handleRetry = () => {
    refetch();
  };

  return {
    products,
    isLoading,
    error,
    handleRetry
  };
};

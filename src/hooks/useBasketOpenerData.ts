
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { fetchBasketOpenerProducts, BasketOpenerProduct } from '@/services/transactionService';
import { toast } from '@/hooks/use-toast';
import { useFilter } from '@/context/FilterContext';

export const useBasketOpenerData = (selectedMonths: string) => {
  // Get store filter and customer group from FilterContext
  const { storeView, customerGroup } = useFilter();
  
  // Calculate dates based on selected period
  const today = new Date();
  const fromDate = format(subMonths(today, parseInt(selectedMonths)), 'yyyy-MM-dd');
  const toDate = format(today, 'yyyy-MM-dd');

  // Get store ID mapping from store views
  // This would come from a mapping service in a real app
  // For now we're using our test store ID
  const getStoreIdFromView = (view: string): string => {
    const storeMapping: Record<string, string> = {
      'dk': '22222222-2222-2222-2222-222222222222',
      'se': '22222222-2222-2222-2222-222222222222', // Same ID for testing
      'no': '22222222-2222-2222-2222-222222222222', // Same ID for testing
      'fi': '22222222-2222-2222-2222-222222222222'  // Same ID for testing
    };
    
    return storeMapping[view] || '';
  };
  
  // Convert storeView to store IDs for filtering
  const storeIds = storeView === 'alle' 
    ? [] // Empty array means all stores
    : [getStoreIdFromView(storeView)];

  console.log(`Selected store view: ${storeView}, store IDs: ${storeIds.join(',') || 'all'}`);
  console.log(`Selected customer group: ${customerGroup}`);
  
  // Query for basket opener products
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['basket-openers', fromDate, toDate, storeView, customerGroup],
    queryFn: async () => {
      try {
        console.log(`Fetching basket opener products from ${fromDate} to ${toDate} with store filter: ${storeIds.length ? storeIds.join(', ') : 'all stores'}`);
        const result = await fetchBasketOpenerProducts(fromDate, toDate, storeIds, customerGroup);
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

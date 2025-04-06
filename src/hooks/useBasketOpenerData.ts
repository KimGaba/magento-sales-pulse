
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { fetchBasketOpenerProducts, BasketOpenerProduct } from '@/services/transactionService';
import { toast } from '@/hooks/use-toast';

export const useBasketOpenerData = (selectedMonths: string) => {
  // Calculate dates based on selected period
  const today = new Date();
  const fromDate = format(subMonths(today, parseInt(selectedMonths)), 'yyyy-MM-dd');
  const toDate = format(today, 'yyyy-MM-dd');

  // Query for basket opener products
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['basket-openers', fromDate, toDate],
    queryFn: async () => {
      try {
        console.log(`Fetching basket opener products from ${fromDate} to ${toDate}`);
        const result = await fetchBasketOpenerProducts(fromDate, toDate);
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

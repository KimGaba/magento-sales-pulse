
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { fetchTransactionData } from '@/services/transactionService';
import { calculateRepeatPurchaseRate, calculateMonthlyRepeatRates, Transaction as CalcTransaction } from '@/utils/repeatPurchaseCalculator';
import { Transaction } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export const useRepeatPurchaseData = (selectedMonths: string) => {
  // Calculate dates for the long-term data (24 months)
  const today = new Date();
  const twoYearsAgo = format(subMonths(today, 24), 'yyyy-MM-dd');
  const fromDate = format(subMonths(today, parseInt(selectedMonths)), 'yyyy-MM-dd');
  const toDate = format(today, 'yyyy-MM-dd');

  // Main query for all transaction data (we'll use this for the trend chart)
  const { data: allTransactionsData, isLoading: isAllDataLoading, error: allDataError } = useQuery({
    queryKey: ['all-transactions', twoYearsAgo, toDate],
    queryFn: async () => {
      try {
        console.log(`Fetching all transactions from ${twoYearsAgo} to ${toDate} for trend chart`);
        const result = await fetchTransactionData(twoYearsAgo, toDate);
        console.log(`Fetched ${result.length} transactions for trend data`);
        
        // Ensure transactions have email data (extract from metadata if available)
        return result.map(transaction => {
          // Create a typed safe transaction object
          const typedTransaction: Transaction = {
            ...transaction,
            metadata: transaction.metadata as Record<string, any> || {}
          };
          
          // Check if we have customer email info in metadata
          if (typedTransaction.metadata && 
              typeof typedTransaction.metadata === 'object' && 
              typedTransaction.metadata !== null) {
            const metadata = typedTransaction.metadata as Record<string, any>;
            if (metadata.customer_email) {
              return {
                ...typedTransaction,
                email: metadata.customer_email
              };
            }
          }
          
          // Check if email might be in customer_id field (some systems store email as ID)
          if (typedTransaction.customer_id && typeof typedTransaction.customer_id === 'string' && typedTransaction.customer_id.includes('@')) {
            return {
              ...typedTransaction,
              email: typedTransaction.customer_id
            };
          }
          
          return typedTransaction;
        }) as Transaction[];
      } catch (fetchError) {
        console.error('Error in all transactions query:', fetchError);
        toast({
          title: "Error loading data",
          description: "Failed to load all transaction data. Please try again.",
          variant: "destructive"
        });
        return [] as Transaction[];
      }
    },
    retry: 1,
  });

  // Query for selected period data (for current view)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions', fromDate, toDate],
    queryFn: async () => {
      try {
        console.log(`Fetching transactions from ${fromDate} to ${toDate} for current period`);
        const result = await fetchTransactionData(fromDate, toDate);
        console.log(`Fetched ${result.length} transactions for current period`);
        
        // Ensure transactions have email data (extract from metadata if available)
        return result.map(transaction => {
          // Create a typed safe transaction object
          const typedTransaction: Transaction = {
            ...transaction,
            metadata: transaction.metadata as Record<string, any> || {}
          };
          
          // Check if we have customer email info in metadata
          if (typedTransaction.metadata && 
              typeof typedTransaction.metadata === 'object' && 
              typedTransaction.metadata !== null) {
            const metadata = typedTransaction.metadata as Record<string, any>;
            if (metadata.customer_email) {
              return {
                ...typedTransaction,
                email: metadata.customer_email
              };
            }
          }
          
          // Check if email might be in customer_id field (some systems store email as ID)
          if (typedTransaction.customer_id && typeof typedTransaction.customer_id === 'string' && typedTransaction.customer_id.includes('@')) {
            return {
              ...typedTransaction,
              email: typedTransaction.customer_id
            };
          }
          
          return typedTransaction;
        }) as Transaction[];
      } catch (fetchError) {
        console.error('Error in transaction query:', fetchError);
        toast({
          title: "Error loading data",
          description: "Failed to load transaction data. Please try again.",
          variant: "destructive"
        });
        return [] as Transaction[];
      }
    },
    retry: 1, // Only retry once to avoid spamming the server with failed requests
  });

  // Ensure we always have an array of transactions
  const transactions = data || [] as Transaction[];
  const allTransactions = allTransactionsData || [] as Transaction[];
  
  // Calculate current period data
  const currentPeriodData = calculateRepeatPurchaseRate(
    transactions as unknown as CalcTransaction[], // Type casting to match the calculator's expected type
    parseInt(selectedMonths)
  );
  
  // Calculate monthly trend data
  const monthlyTrendData = calculateMonthlyRepeatRates(allTransactions as unknown as CalcTransaction[], 12);
  
  // Log calculated data for debugging
  console.log("Monthly trend data calculated:", monthlyTrendData);
  console.log("Current period data calculated:", currentPeriodData);

  const handleRetry = () => {
    refetch();
  };

  return {
    currentPeriodData,
    monthlyTrendData,
    isLoading,
    error,
    isAllDataLoading,
    allDataError,
    handleRetry,
    transactions
  };
};

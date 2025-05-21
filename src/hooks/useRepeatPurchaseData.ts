
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { fetchTransactionData } from '@/services/transactionService';
import { calculateRepeatPurchaseRate, calculateMonthlyRepeatRates } from '@/utils/repeatPurchaseCalculator';
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
          // Make sure we have the required Transaction fields
          const basicTransaction: Transaction = {
            id: transaction.id,
            store_id: transaction.store_id,
            transaction_date: transaction.transaction_date,
            amount: transaction.amount,
            created_at: transaction.created_at,
            product_id: transaction.product_id || null,
            customer_id: transaction.customer_id || null,
            external_id: transaction.external_id || null,
            metadata: transaction.metadata || {},
            email: transaction.email
          };
          
          // Check if we have customer email info in metadata
          if (transaction.metadata && 
              typeof transaction.metadata === 'object' && 
              transaction.metadata !== null) {
            const metadata = transaction.metadata as Record<string, any>;
            if (metadata.customer_email) {
              return {
                ...basicTransaction,
                email: metadata.customer_email
              };
            }
          }
          
          // Check if email might be in customer_id field (some systems store email as ID)
          if (transaction.customer_id && typeof transaction.customer_id === 'string' && transaction.customer_id.includes('@')) {
            return {
              ...basicTransaction,
              email: transaction.customer_id
            };
          }
          
          return basicTransaction;
        });
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
          // Make sure we have the required Transaction fields
          const basicTransaction: Transaction = {
            id: transaction.id,
            store_id: transaction.store_id,
            transaction_date: transaction.transaction_date,
            amount: transaction.amount,
            created_at: transaction.created_at,
            product_id: transaction.product_id || null,
            customer_id: transaction.customer_id || null,
            external_id: transaction.external_id || null,
            metadata: transaction.metadata || {},
            email: transaction.email
          };
          
          // Check if we have customer email info in metadata
          if (transaction.metadata && 
              typeof transaction.metadata === 'object' && 
              transaction.metadata !== null) {
            const metadata = transaction.metadata as Record<string, any>;
            if (metadata.customer_email) {
              return {
                ...basicTransaction,
                email: metadata.customer_email
              };
            }
          }
          
          // Check if email might be in customer_id field (some systems store email as ID)
          if (transaction.customer_id && typeof transaction.customer_id === 'string' && transaction.customer_id.includes('@')) {
            return {
              ...basicTransaction,
              email: transaction.customer_id
            };
          }
          
          return basicTransaction;
        });
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
    transactions, // Type should be fixed now
    parseInt(selectedMonths)
  );
  
  // Calculate monthly trend data
  const monthlyTrendData = calculateMonthlyRepeatRates(allTransactions, 12);
  
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

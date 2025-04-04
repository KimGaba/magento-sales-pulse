
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Transaction } from '@/utils/repeatPurchaseCalculator';
import { fetchTransactionData } from './transactionService';
import { format, parseISO } from 'date-fns';

/**
 * Fetches daily sales data from transactions
 */
export const fetchDailySalesData = async (
  fromDate: string, 
  toDate: string,
  storeIds: string[] = []
) => {
  try {
    console.log(`Fetching daily sales from ${fromDate} to ${toDate} for stores:`, storeIds);
    
    // Fetch transaction data using the same service as repeat purchase report
    const transactions = await fetchTransactionData(fromDate, toDate, storeIds);
    
    if (!transactions || transactions.length === 0) {
      return [];
    }
    
    // Group transactions by date to create daily sales data
    const salesByDate = transactions.reduce((acc, transaction) => {
      // Extract just the date part (YYYY-MM-DD)
      const date = format(parseISO(transaction.transaction_date), 'yyyy-MM-dd');
      
      if (!acc[date]) {
        acc[date] = {
          date: date,
          total_sales: 0,
          order_count: 0,
          store_id: transaction.store_id
        };
      }
      
      acc[date].total_sales += transaction.amount;
      acc[date].order_count += 1;
      
      return acc;
    }, {} as Record<string, {
      date: string;
      total_sales: number;
      order_count: number;
      store_id: string;
    }>);
    
    const dailySalesData = Object.values(salesByDate);
    console.log(`Calculated ${dailySalesData.length} daily sales records from transactions`);
    
    return dailySalesData;
  } catch (error) {
    console.error('Error fetching daily sales data:', error);
    toast({
      title: "Error fetching daily sales data",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive"
    });
    return [];
  }
};

/**
 * Fetches months that have sales data available
 * Returns an array of dates (first day of each month that has data)
 */
export const fetchAvailableDataMonths = async (storeIds: string[] = []) => {
  try {
    console.log('Fetching available data months for stores:', storeIds);
    
    // Use the transactionService to get all transactions
    // We'll just get the past 24 months to keep the query small
    const fromDate = format(new Date(new Date().setMonth(new Date().getMonth() - 24)), 'yyyy-MM-dd');
    const toDate = format(new Date(), 'yyyy-MM-dd');
    
    const transactions = await fetchTransactionData(fromDate, toDate, storeIds);
    
    if (!transactions || transactions.length === 0) {
      return [];
    }
    
    // Process the dates to get unique months (first day of each month)
    const uniqueMonths = new Set<string>();
    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      uniqueMonths.add(monthKey);
    });
    
    // Convert to array of Date objects (first day of each month)
    const monthsWithData = Array.from(uniqueMonths).map(monthKey => {
      const [year, month] = monthKey.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    }).sort((a, b) => a.getTime() - b.getTime());
    
    console.log(`Found ${monthsWithData.length} months with data`);
    return monthsWithData;
  } catch (error) {
    console.error('Error fetching available data months:', error);
    toast({
      title: "Error fetching available months",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive"
    });
    return [];
  }
};

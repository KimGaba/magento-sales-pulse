
// Type definitions
export type RepeatPurchaseData = {
  period: number; // Number of months
  repeatCustomers: number;
  totalCustomers: number;
  repeatRate: number;
  loyalCustomers?: number;  // Customers with 3+ purchases
  topCustomers: {
    email: string;
    purchases: number;
    totalSpent: number;
    lastPurchase: string;
    averageOrderValue?: number;
    firstPurchase?: string;
  }[];
};

// Define a type for transaction data
export interface Transaction {
  customer_id?: string | null;
  email?: string | null;  // Added email field for improved identification
  amount: number;
  transaction_date: string;
  [key: string]: any; // For any other properties
}

export const calculateRepeatPurchaseRate = (
  transactions: Transaction[] | undefined,
  months: number
): RepeatPurchaseData => {
  if (!transactions || transactions.length === 0) {
    return {
      period: months,
      repeatCustomers: 0,
      totalCustomers: 0,
      repeatRate: 0,
      loyalCustomers: 0,
      topCustomers: []
    };
  }

  // Group transactions by customer - preferring email over customer_id for identification
  const customerPurchases = transactions.reduce((acc, transaction) => {
    // Use email first, then customer_id, then 'unknown' as fallback
    const customerId = transaction.email || transaction.customer_id || 'unknown';
    
    if (!acc[customerId]) {
      acc[customerId] = {
        purchases: 0,
        totalSpent: 0,
        lastPurchase: '',
        firstPurchase: '',
        transactions: [],
        averageOrderValue: 0
      };
    }
    
    acc[customerId].purchases += 1;
    acc[customerId].totalSpent += transaction.amount;
    
    // Track purchase dates
    const txDate = new Date(transaction.transaction_date);
    
    // Update last purchase date
    if (!acc[customerId].lastPurchase || txDate > new Date(acc[customerId].lastPurchase)) {
      acc[customerId].lastPurchase = transaction.transaction_date;
    }
    
    // Update first purchase date
    if (!acc[customerId].firstPurchase || txDate < new Date(acc[customerId].firstPurchase)) {
      acc[customerId].firstPurchase = transaction.transaction_date;
    }
    
    acc[customerId].transactions.push(transaction);
    
    // Calculate average order value
    acc[customerId].averageOrderValue = acc[customerId].totalSpent / acc[customerId].purchases;
    
    return acc;
  }, {} as Record<string, {
    purchases: number;
    totalSpent: number;
    lastPurchase: string;
    firstPurchase: string;
    transactions: Transaction[];
    averageOrderValue: number;
  }>);
  
  // Count customers by category
  const allCustomerStats = Object.values(customerPurchases);
  const repeatCustomers = allCustomerStats.filter(customer => customer.purchases > 1);
  const loyalCustomers = allCustomerStats.filter(customer => customer.purchases >= 3);
  
  // Calculate repeat rate
  const repeatRate = allCustomerStats.length > 0 ? (repeatCustomers.length / allCustomerStats.length) * 100 : 0;
  
  // Get top returning customers (sorted by purchase count)
  const topCustomers = Object.entries(customerPurchases)
    .map(([customerId, data]) => {
      return {
        email: customerId === 'unknown' ? 'Guest Customer' : customerId,
        purchases: data.purchases,
        totalSpent: data.totalSpent,
        lastPurchase: data.lastPurchase,
        firstPurchase: data.firstPurchase,
        averageOrderValue: data.averageOrderValue
      };
    })
    .filter(customer => customer.purchases > 1)
    .sort((a, b) => b.purchases - a.purchases)
    .slice(0, 10); // Show top 10 customers
  
  return {
    period: months,
    repeatCustomers: repeatCustomers.length,
    totalCustomers: allCustomerStats.length,
    repeatRate,
    loyalCustomers: loyalCustomers.length,
    topCustomers
  };
};

// Function to calculate monthly repeat purchase rates
import { format } from 'date-fns';

export const calculateMonthlyRepeatRates = (
  transactions: Transaction[] | undefined,
  numberOfMonths: number = 12
): { month: string; displayMonth: string; repeatRate: number }[] => {
  if (!transactions || transactions.length === 0) {
    console.log("No transactions available for monthly rates calculation");
    return [];
  }

  // Sort transactions by date (oldest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  // Get date range
  const oldestDate = new Date(sortedTransactions[0].transaction_date);
  const newestDate = new Date(sortedTransactions[sortedTransactions.length - 1].transaction_date);
  
  console.log("Oldest transaction date:", oldestDate);
  console.log("Newest transaction date:", newestDate);

  // Determine how many months we can show (minimum of 3 months of data needed)
  const monthsAvailable = Math.floor(
    (newestDate.getTime() - oldestDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );
  
  console.log("Months available in data:", monthsAvailable);
  
  if (monthsAvailable < 3) {
    console.log("Not enough months of data available (need at least 3)");
    return [];
  }

  // Calculate how many months to show in the chart (max 24 months)
  const monthsToShow = Math.min(24, monthsAvailable);
  const results = [];

  // For each month, calculate the repeat purchase rate for the preceding 12 months
  for (let i = 0; i < monthsToShow; i++) {
    const endDate = new Date(newestDate);
    endDate.setMonth(endDate.getMonth() - i);
    
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - numberOfMonths);

    // Filter transactions for this 12-month period
    const periodTransactions = sortedTransactions.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate >= startDate && txDate <= endDate;
    });

    if (periodTransactions.length > 0) {
      // Group by customer to calculate repeat purchase rate - using email as identifier when available
      const customerPurchases: Record<string, number> = {};
      
      periodTransactions.forEach(tx => {
        const customerId = tx.email || tx.customer_id || 'unknown';
        customerPurchases[customerId] = (customerPurchases[customerId] || 0) + 1;
      });
      
      const totalCustomers = Object.keys(customerPurchases).length;
      const repeatCustomers = Object.values(customerPurchases).filter(count => count > 1).length;
      const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
      
      // Format the month for display
      const monthISO = format(endDate, 'yyyy-MM');
      const displayMonth = format(endDate, 'MMM yyyy');
      
      results.push({
        month: monthISO,
        displayMonth,
        repeatRate
      });
    }
  }

  // Sort by date (oldest first)
  return results.reverse();
};

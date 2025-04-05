
// Type definitions
export type RepeatPurchaseData = {
  period: number; // Number of months
  repeatCustomers: number;
  totalCustomers: number;
  repeatRate: number;
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
  customer_id: string | null;
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
      topCustomers: []
    };
  }

  // Group transactions by customer
  const customerPurchases = transactions.reduce((acc, transaction) => {
    const customerId = transaction.customer_id || 'unknown';
    if (!acc[customerId]) {
      acc[customerId] = {
        purchases: 0,
        totalSpent: 0,
        lastPurchase: '',
        firstPurchase: '',
        transactions: []
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
    
    return acc;
  }, {} as Record<string, {
    purchases: number;
    totalSpent: number;
    lastPurchase: string;
    firstPurchase: string;
    transactions: Transaction[];
  }>);
  
  // Count total unique customers and repeat customers
  const totalCustomers = Object.keys(customerPurchases).length;
  const repeatCustomers = Object.values(customerPurchases).filter(
    customer => customer.purchases > 1
  ).length;
  
  // Calculate repeat rate
  const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
  
  // Get top returning customers (sorted by purchase count)
  const topCustomers = Object.entries(customerPurchases)
    .map(([customerId, data]) => {
      // Calculate average order value
      const averageOrderValue = data.totalSpent / data.purchases;
      
      return {
        email: customerId === 'unknown' ? 'Guest Customer' : customerId,
        purchases: data.purchases,
        totalSpent: data.totalSpent,
        lastPurchase: data.lastPurchase,
        firstPurchase: data.firstPurchase,
        averageOrderValue
      };
    })
    .filter(customer => customer.purchases > 1)
    .sort((a, b) => b.purchases - a.purchases)
    .slice(0, 10); // Increasing from 5 to 10 top customers
  
  return {
    period: months,
    repeatCustomers,
    totalCustomers,
    repeatRate,
    topCustomers
  };
};

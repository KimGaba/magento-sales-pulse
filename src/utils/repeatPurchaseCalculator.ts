
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
  }[];
};

export const calculateRepeatPurchaseRate = (
  transactions: any[] | undefined,
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
        transactions: []
      };
    }
    
    acc[customerId].purchases += 1;
    acc[customerId].totalSpent += transaction.amount;
    
    // Track last purchase date
    const txDate = new Date(transaction.transaction_date);
    if (!acc[customerId].lastPurchase || txDate > new Date(acc[customerId].lastPurchase)) {
      acc[customerId].lastPurchase = transaction.transaction_date;
    }
    
    acc[customerId].transactions.push(transaction);
    
    return acc;
  }, {} as Record<string, {
    purchases: number;
    totalSpent: number;
    lastPurchase: string;
    transactions: any[];
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
    .map(([customerId, data]) => ({
      email: customerId === 'unknown' ? 'Guest Customer' : customerId,
      purchases: data.purchases,
      totalSpent: data.totalSpent,
      lastPurchase: data.lastPurchase
    }))
    .filter(customer => customer.purchases > 1)
    .sort((a, b) => b.purchases - a.purchases)
    .slice(0, 5);
  
  return {
    period: months,
    repeatCustomers,
    totalCustomers,
    repeatRate,
    topCustomers
  };
};

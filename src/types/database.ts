
// If this file doesn't exist, we'll create it to define the Transaction type

export interface Transaction {
  id: string;
  store_id: string;
  transaction_date: string;
  amount: number;
  created_at: string;
  product_id: string | null;
  customer_id: string | null;
  external_id: string | null;
  metadata: Record<string, any>;
  email: string; // Add this field to support email lookups
  customer_name: string | null;
}

// Add other database types as needed here

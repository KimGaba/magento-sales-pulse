
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
  metadata: any; // Using 'any' type to support all JSON types
  email: string; // Required for email lookups
  customer_name: string | null;
}

// Define the TestResult interface that multiple files are looking for
export interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
}

// Define the Profile interface that multiple files are looking for
export interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  invoice_address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  timezone: string | null;
  tier: string;
  created_at: string;
  updated_at: string;
}

// Define SyncProgress for transactionService and related components
// Added the missing properties: skipped_orders and warning_message
export interface SyncProgress {
  id: string;
  store_id: string;
  connection_id: string;
  current_page: number;
  total_pages: number | null;
  orders_processed: number;
  total_orders: number | null;
  status: 'in_progress' | 'completed' | 'error' | 'failed';
  started_at: string;
  updated_at: string;
  error_message?: string;
  skipped_orders?: number;
  warning_message?: string;
  notes?: string;
}

// Add other database types as needed here


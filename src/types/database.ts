
export type TestResult = {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: string;
};

export type Transaction = {
  id: string;
  store_id: string;
  amount: number;
  transaction_date: string;
  customer_id?: string | null;
  external_id?: string | null;
  created_at: string;
  product_id?: string | null;
};

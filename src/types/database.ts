
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
  metadata?: {
    customer_email?: string;
    store_view?: string;
    customer_group?: string;
    status?: string;
    items_count?: number;
    payment_method?: string;
    shipping_method?: string;
    customer_name?: string;
    [key: string]: any;
  };
  email?: string;
};

export type Profile = {
  id: string;
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  invoice_address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  timezone?: string | null;
  tier?: string;
  created_at: string;
  updated_at: string;
};

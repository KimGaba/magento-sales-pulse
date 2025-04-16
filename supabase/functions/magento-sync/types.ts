
export interface MagentoConnection {
  id: string;
  user_id: string;
  store_id: string | null;
  created_at: string;
  updated_at: string;
  store_url: string;
  store_name: string;
  access_token: string;
  status: string;
}

export interface SyncProgress {
  id: string;
  store_id: string;
  connection_id: string;
  current_page: number;
  total_pages?: number;
  orders_processed: number;
  total_orders?: number;
  started_at: string;
  updated_at: string;
  status: string;
  error_message?: string;
  notes?: string;
}

export interface Store {
  id: string;
  name: string;
  url?: string;
  created_at: string;
  updated_at: string;
  last_sync_date?: string;
}

export interface Product {
  id: string;
  store_id: string;
  external_id: string;
  name: string;
  sku?: string;
  description?: string;
  price?: number;
  in_stock: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  store_id: string;
  external_id: string;
  transaction_date: string;
  amount: number;
  customer_id?: string;
  customer_name?: string;
  product_id?: string;
  items: number;
  metadata?: any;
  created_at: string;
}

export interface SyncResult {
  success: boolean;
  message?: string;
  error?: string;
  stats?: {
    ordersCount?: number;
    processedCount?: number;
    skippedCount?: number;
    errorCount?: number;
    productsCount?: number;
  };
}

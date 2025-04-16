
// Common types for the Magento integration

export interface MagentoConnection {
  id: string;
  user_id: string;
  store_id: string;
  store_url: string;
  store_name: string;
  access_token: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface MagentoStoreView {
  id: string;
  connection_id: string;
  website_id: string;
  website_name?: string;
  store_id: string;
  store_name?: string;
  store_view_code?: string;
  store_view_name?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id?: string;
  external_id: string;
  store_id: string;
  name: string;
  sku?: string;
  description?: string;
  price?: number;
  image_url?: string;
  in_stock?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id?: string;
  external_id: string;
  store_id: string;
  customer_id?: string;
  customer_name?: string;
  transaction_date: string;
  amount: number;
  items?: any[];
  metadata?: any;
  created_at?: string;
}

export interface Customer {
  id?: string;
  external_id: string;
  store_id: string;
  name?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SyncProgress {
  id?: string;
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

export interface SyncHistory {
  id?: string;
  store_id: string;
  orders_synced: number;
  products_synced: number;
  sync_date: string;
  status: string;
  error_message?: string;
}

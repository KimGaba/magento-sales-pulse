
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
  total_pages: number | null;
  orders_processed: number;
  total_orders: number | null;
  started_at: string;
  updated_at: string;
  status: string;
  error_message: string | null;
  notes: string | null;
}

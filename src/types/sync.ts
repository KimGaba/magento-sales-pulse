
export interface SyncHistoryItem {
  id: string;
  timestamp: Date;
  status: 'success' | 'error';
  itemsSynced: number;
  duration: number;
  trigger: 'manual' | 'scheduled';
}

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

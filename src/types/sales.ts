
export interface DailySales {
  id: string;
  store_id: string;
  date: string;
  total_sales: number;
  order_count: number;
  average_order_value: number | null;
  created_at: string;
  updated_at: string;
}

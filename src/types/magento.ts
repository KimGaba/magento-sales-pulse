
export interface MagentoConnection {
  id: string;
  user_id: string;
  store_id?: string;
  store_url: string;
  store_name: string;
  access_token: string;
  status: string;
  created_at: string;
  updated_at: string;
  order_statuses: string[];
}

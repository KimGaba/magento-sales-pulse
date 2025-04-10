export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          name: string;
          url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      magento_connections: {
        Row: {
          id: string;
          user_id: string;
          store_id: string | null;
          created_at: string;
          updated_at: string;
          access_token: string;
          status: string;
          store_url: string;
          store_name: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          store_id?: string | null;
          created_at?: string;
          updated_at?: string;
          access_token: string;
          status?: string;
          store_url: string;
          store_name: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          store_id?: string | null;
          created_at?: string;
          updated_at?: string;
          access_token?: string;
          status?: string;
          store_url?: string;
          store_name?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          store_id: string;
          external_id: string;
          transaction_date: string;
          customer_id: string;
          amount: number;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          external_id: string;
          transaction_date: string;
          customer_id: string;
          amount: number;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          external_id?: string;
          transaction_date?: string;
          customer_id?: string;
          amount?: number;
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      daily_sales: {
        Row: {
          id: string;
          store_id: string;
          date: string;
          total_sales: number;
          order_count: number;
          average_order_value: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          date: string;
          total_sales: number;
          order_count: number;
          average_order_value: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          date?: string;
          total_sales?: number;
          order_count?: number;
          average_order_value?: number;
          updated_at?: string;
        };
      };
    };
  };
}

export interface MagentoConnection {
  id: string;
  user_id: string;
  store_id?: string;
  created_at: string;
  updated_at: string;
  access_token: string;
  status: string;
  store_url: string;
  store_name: string;
}

export interface Store {
  id: string;
  name: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

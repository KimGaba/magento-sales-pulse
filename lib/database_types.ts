
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
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
          created_at: string;
          id: string;
          store_id: string;
          transaction_date: string;
          amount: number;
          product_id: string | null;
          external_id: string | null;
          customer_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          store_id: string;
          transaction_date?: string;
          amount: number;
          product_id?: string | null;
          external_id?: string | null;
          customer_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          store_id?: string;
          transaction_date?: string;
          amount?: number;
          product_id?: string | null;
          external_id?: string | null;
          customer_id?: string | null;
        };
      };
      daily_sales: {
        Row: {
          store_id: string;
          date: string;
          total_sales: number;
          order_count: number;
          average_order_value: number | null;
          created_at: string;
          updated_at: string;
          id: string;
        };
        Insert: {
          store_id: string;
          date: string;
          total_sales?: number;
          order_count?: number;
          average_order_value?: number | null;
          created_at?: string;
          updated_at?: string;
          id?: string;
        };
        Update: {
          store_id?: string;
          date?: string;
          total_sales?: number;
          order_count?: number;
          average_order_value?: number | null;
          created_at?: string;
          updated_at?: string;
          id?: string;
        };
      };
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
      magento_store_views: {
        Row: {
          connection_id: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          store_id: string;
          store_name: string | null;
          store_view_code: string | null;
          store_view_name: string | null;
          updated_at: string | null;
          website_id: string;
          website_name: string | null;
        };
        Insert: {
          connection_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          store_id: string;
          store_name?: string | null;
          store_view_code?: string | null;
          store_view_name?: string | null;
          updated_at?: string | null;
          website_id: string;
          website_name?: string | null;
        };
        Update: {
          connection_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          store_id?: string;
          store_name?: string | null;
          store_view_code?: string | null;
          store_view_name?: string | null;
          updated_at?: string | null;
          website_id?: string;
          website_name?: string | null;
        };
      };
      profiles: {
        Row: {
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
        };
        Insert: {
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          invoice_address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          country?: string | null;
          timezone?: string | null;
          tier?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      check_table_exists: {
        Args: { table_name: string };
        Returns: boolean;
      };
      delete_store_data: {
        Args: { target_store_id: string };
        Returns: undefined;
      };
      get_basket_opener_products: {
        Args: { 
          start_date: string; 
          end_date: string; 
          store_filter?: string[] 
        };
        Returns: {
          product_id: string;
          product_name: string;
          opener_count: number;
          total_appearances: number;
          opener_score: number;
        }[];
      };
      user_has_store_access: {
        Args: { store_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}

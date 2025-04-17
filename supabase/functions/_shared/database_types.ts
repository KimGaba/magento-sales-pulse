
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      magento_connections: {
        Row: {
          id: string
          user_id: string
          store_id: string | null
          created_at: string
          updated_at: string
          store_url: string
          store_name: string
          access_token: string
          status: string
        }
        Insert: {
          id?: string
          user_id: string
          store_id?: string | null
          created_at?: string
          updated_at?: string
          store_url: string
          store_name: string
          access_token: string
          status?: string
        }
        Update: {
          id?: string
          user_id?: string
          store_id?: string | null
          created_at?: string
          updated_at?: string
          store_url?: string
          store_name?: string
          access_token?: string
          status?: string
        }
      }
      magento_store_views: {
        Row: {
          id: string
          connection_id: string | null
          website_id: string
          website_name: string | null
          store_id: string
          store_name: string | null
          store_view_code: string | null
          store_view_name: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          connection_id?: string | null
          website_id: string
          website_name?: string | null
          store_id: string
          store_name?: string | null
          store_view_code?: string | null
          store_view_name?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          connection_id?: string | null
          website_id?: string
          website_name?: string | null
          store_id?: string
          store_name?: string | null
          store_view_code?: string | null
          store_view_name?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      stores: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          last_sync_date: string | null
          name: string
          url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          last_sync_date?: string | null
          name: string
          url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          last_sync_date?: string | null
          name?: string
          url?: string | null
        }
      }
      sync_progress: {
        Row: {
          id: string
          store_id: string
          connection_id: string
          current_page: number
          total_pages: number | null
          orders_processed: number
          total_orders: number | null
          started_at: string
          updated_at: string
          status: string
          error_message: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          store_id: string
          connection_id: string
          current_page?: number
          total_pages?: number | null
          orders_processed?: number
          total_orders?: number | null
          started_at?: string
          updated_at?: string
          status: string
          error_message?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          connection_id?: string
          current_page?: number
          total_pages?: number | null
          orders_processed?: number
          total_orders?: number | null
          started_at?: string
          updated_at?: string
          status?: string
          error_message?: string | null
          notes?: string | null
        }
      }
      sync_history: {
        Row: {
          id: string
          store_id: string
          orders_synced: number
          products_synced: number
          sync_date: string
          status: string
          error_message: string | null
        }
        Insert: {
          id?: string
          store_id: string
          orders_synced: number
          products_synced: number
          sync_date?: string
          status: string
          error_message?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          orders_synced?: number
          products_synced?: number
          sync_date?: string
          status?: string
          error_message?: string | null
        }
      }
    }
    Functions: {
      delete_store_data: {
        Args: {
          target_store_id: string
        }
        Returns: undefined
      }
      get_last_sync_date: {
        Args: {
          store_id_param: string
          data_type_param: string
        }
        Returns: string
      }
      update_last_sync_date: {
        Args: {
          store_id_param: string
          data_type_param: string
          sync_date: string
        }
        Returns: undefined
      }
    }
  }
}

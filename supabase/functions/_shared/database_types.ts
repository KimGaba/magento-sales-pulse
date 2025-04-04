
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
      daily_sales: {
        Row: {
          average_order_value: number | null
          created_at: string
          date: string
          id: string
          order_count: number
          store_id: string
          total_sales: number
          updated_at: string
        }
        Insert: {
          average_order_value?: number | null
          created_at?: string
          date: string
          id?: string
          order_count?: number
          store_id: string
          total_sales?: number
          updated_at?: string
        }
        Update: {
          average_order_value?: number | null
          created_at?: string
          date?: string
          id?: string
          order_count?: number
          store_id?: string
          total_sales?: number
          updated_at?: string
        }
      }
      magento_connections: {
        Row: {
          access_token: string
          created_at: string
          id: string
          status: string
          store_id: string | null
          store_name: string
          store_url: string
          updated_at: string
          user_id: string
          order_statuses: string[]
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          status?: string
          store_id?: string | null
          store_name: string
          store_url: string
          updated_at?: string
          user_id: string
          order_statuses?: string[]
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          status?: string
          store_id?: string | null
          store_name?: string
          store_url?: string
          updated_at?: string
          user_id?: string
          order_statuses?: string[]
        }
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          name: string
          price: number | null
          sku: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name: string
          price?: number | null
          sku?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name?: string
          price?: number | null
          sku?: string | null
          store_id?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          url?: string | null
        }
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          external_id: string | null
          id: string
          product_id: string | null
          store_id: string
          transaction_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id?: string | null
          external_id?: string | null
          id?: string
          product_id?: string | null
          store_id: string
          transaction_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          external_id?: string | null
          id?: string
          product_id?: string | null
          store_id?: string
          transaction_date?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

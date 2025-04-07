
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


// Types for Magento statistics data

export interface MagentoOrder {
  id: string;
  order_id: string;
  increment_id: string; // The visible order number like #10024
  customer_id: string | null;
  customer_email: string;
  customer_name: string;
  status: string;
  grand_total: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  store_view: string; // e.g. 'dk', 'se', 'no', 'fi'
  customer_group: string; // e.g. 'retail', 'wholesale', 'vip'
  created_at: string;
  updated_at: string;
}

export interface MagentoProduct {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  price: number;
  special_price: number | null;
  qty: number;
  status: string; // 'enabled' or 'disabled'
  visibility: string;
  type: string; // 'simple', 'configurable', etc.
  store_view: string; // e.g. 'dk', 'se', 'no', 'fi'
  image_url: string | null; // Product image URL
  created_at: string;
  updated_at: string;
}

export interface MagentoSalesStatistic {
  id: string;
  date: string;
  revenue: number;
  orders_count: number;
  average_order_value: number;
  conversion_rate: number;
  store_view: string; // e.g. 'dk', 'se', 'no', 'fi'
  customer_group: string; // e.g. 'retail', 'wholesale', 'vip'
}

export interface MagentoProductSale {
  id: string;
  date: string;
  product_id: string;
  sku: string;
  name: string;
  qty_sold: number;
  revenue: number;
  store_view: string;
  customer_group: string;
  image_url: string | null; // Product image URL
}

export type StoreView = 'alle' | 'dk' | 'se' | 'no' | 'fi';
export type CustomerGroup = 'alle' | 'retail' | 'wholesale' | 'vip';

export interface MagentoConnection {
  id: string;
  user_id: string;
  store_id: string | null;
  store_name: string;
  store_url: string;
  access_token: string;
  status: string;
  order_statuses: string[];
  created_at: string;
  updated_at: string;
}

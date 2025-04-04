
import { createClient } from '@supabase/supabase-js';
import { 
  MagentoOrder, 
  MagentoProduct, 
  MagentoSalesStatistic, 
  MagentoProductSale,
  StoreView,
  CustomerGroup
} from '../types/magento';

// Initialize Supabase client with fallback to prevent runtime errors
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Orders
export const getOrders = async (storeView: StoreView, customerGroup: CustomerGroup, limit = 100) => {
  let query = supabase.from('magento_orders').select('*').order('created_at', { ascending: false }).limit(limit);
  
  if (storeView !== 'alle') {
    query = query.eq('store_view', storeView);
  }
  
  if (customerGroup !== 'alle') {
    query = query.eq('customer_group', customerGroup);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as MagentoOrder[];
};

export const getOrderById = async (orderId: string) => {
  const { data, error } = await supabase
    .from('magento_orders')
    .select('*')
    .eq('id', orderId)
    .single();
  
  if (error) throw error;
  return data as MagentoOrder;
};

// Products
export const getProducts = async (storeView: StoreView, limit = 100) => {
  let query = supabase.from('magento_products').select('*').limit(limit);
  
  if (storeView !== 'alle') {
    query = query.eq('store_view', storeView);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as MagentoProduct[];
};

// Sales Statistics
export const getSalesStatistics = async (
  storeView: StoreView, 
  customerGroup: CustomerGroup, 
  startDate: string, 
  endDate: string
) => {
  let query = supabase
    .from('magento_sales_statistics')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);
  
  if (storeView !== 'alle') {
    query = query.eq('store_view', storeView);
  }
  
  if (customerGroup !== 'alle') {
    query = query.eq('customer_group', customerGroup);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as MagentoSalesStatistic[];
};

// Product Sales
export const getProductSales = async (
  storeView: StoreView, 
  customerGroup: CustomerGroup, 
  startDate: string, 
  endDate: string
) => {
  let query = supabase
    .from('magento_product_sales')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);
  
  if (storeView !== 'alle') {
    query = query.eq('store_view', storeView);
  }
  
  if (customerGroup !== 'alle') {
    query = query.eq('customer_group', customerGroup);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as MagentoProductSale[];
};


import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];

/**
 * Fetches all transaction data for the given date range
 */
export const fetchTransactionData = async (
  fromDate: string, 
  toDate: string,
  storeIds: string[] = []
) => {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate)
      .order('transaction_date', { ascending: false });
    
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    throw error;
  }
};

/**
 * Fetches all product data
 */
export const fetchProductData = async (storeIds: string[] = []) => {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching product data:', error);
    throw error;
  }
};

/**
 * Fetches all store data
 */
export const fetchStoreData = async () => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching store data:', error);
    throw error;
  }
};

/**
 * Fetches daily sales data
 */
export const fetchDailySalesData = async (
  fromDate: string, 
  toDate: string,
  storeIds: string[] = []
) => {
  try {
    let query = supabase
      .from('daily_sales')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date');
    
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching daily sales data:', error);
    throw error;
  }
};

/**
 * Adds a Magento store connection
 */
export const addMagentoConnection = async (
  userId: string,
  storeUrl: string,
  accessToken: string,
  storeName: string
) => {
  try {
    const { data, error } = await supabase
      .from('magento_connections')
      .insert([
        {
          user_id: userId,
          store_url: storeUrl,
          access_token: accessToken,
          store_name: storeName,
          status: 'active'
        }
      ])
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding Magento connection:', error);
    throw error;
  }
};


import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { MagentoConnection } from '@/types/magento';

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
    console.log(`Fetching transactions from ${fromDate} to ${toDate} for stores:`, storeIds);
    
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
    
    if (error) {
      console.error('Error fetching transaction data:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} transactions`);
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
    console.log('Fetching products for stores:', storeIds);
    
    let query = supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching product data:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} products`);
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
    console.log('Fetching stores');
    
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching store data:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} stores`);
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
    console.log(`Fetching daily sales from ${fromDate} to ${toDate} for stores:`, storeIds);
    
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
    
    if (error) {
      console.error('Error fetching daily sales data:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} daily sales records`);
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
  storeName: string,
  orderStatuses: string[] = ["processing", "complete"]
) => {
  try {
    console.log(`Adding Magento connection for user ${userId} to store ${storeName}`);
    
    const { data, error } = await supabase
      .from('magento_connections')
      .insert([
        {
          user_id: userId,
          store_url: storeUrl,
          access_token: accessToken,
          store_name: storeName,
          status: 'active',
          order_statuses: orderStatuses
        }
      ])
      .select();
    
    if (error) {
      console.error('Error adding Magento connection:', error);
      throw error;
    }
    
    console.log('Successfully added Magento connection:', data);
    return data;
  } catch (error) {
    console.error('Error adding Magento connection:', error);
    throw error;
  }
};

/**
 * Fetches user profile data
 */
export const fetchUserProfile = async (userId: string) => {
  try {
    console.log(`Fetching profile for user ${userId}`);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
    
    console.log('Fetched user profile:', data);
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Updates user profile data
 */
export const updateUserProfile = async (
  userId: string, 
  updates: { display_name?: string; avatar_url?: string }
) => {
  try {
    console.log(`Updating profile for user ${userId}:`, updates);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();
    
    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
    
    console.log('Successfully updated user profile:', data);
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Manually triggers synchronization for Magento stores
 */
export const triggerMagentoSync = async () => {
  try {
    console.log('Manually triggering Magento synchronization');
    
    const { data, error } = await supabase.functions.invoke('magento-sync', {
      body: { trigger: 'manual' }
    });
    
    if (error) {
      console.error('Error triggering Magento sync:', error);
      throw error;
    }
    
    console.log('Magento sync triggered successfully:', data);
    return data;
  } catch (error) {
    console.error('Error triggering Magento sync:', error);
    throw error;
  }
};

/**
 * Fetches magento connections for a user
 */
export const fetchMagentoConnections = async (userId: string): Promise<MagentoConnection[]> => {
  try {
    console.log(`Fetching Magento connections for user ${userId}`);
    
    const { data, error } = await supabase
      .from('magento_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching Magento connections:', error);
      throw error;
    }
    
    // Make sure each connection has order_statuses, even if it's empty
    const connectionsWithStatuses = data?.map(connection => ({
      ...connection,
      order_statuses: connection.order_statuses || []
    })) as MagentoConnection[];
    
    console.log(`Fetched ${connectionsWithStatuses?.length || 0} Magento connections`);
    return connectionsWithStatuses || [];
  } catch (error) {
    console.error('Error fetching Magento connections:', error);
    throw error;
  }
};

/**
 * Updates a Magento store connection
 */
export const updateMagentoConnection = async (
  connectionId: string,
  updates: {
    store_url?: string;
    access_token?: string;
    store_name?: string;
    status?: string;
    order_statuses?: string[];
  }
) => {
  try {
    console.log(`Updating Magento connection ${connectionId}:`, updates);
    
    const { data, error } = await supabase
      .from('magento_connections')
      .update(updates)
      .eq('id', connectionId)
      .select();
    
    if (error) {
      console.error('Error updating Magento connection:', error);
      throw error;
    }
    
    console.log('Successfully updated Magento connection:', data);
    return data;
  } catch (error) {
    console.error('Error updating Magento connection:', error);
    throw error;
  }
};

/**
 * Fetches product data with image URLs
 */
export const fetchProductsWithImages = async (storeIds: string[] = []) => {
  try {
    console.log('Fetching products with images for stores:', storeIds);
    
    let query = supabase
      .from('products')
      .select('*')
      .not('image_url', 'is', null)  // Only get products with images
      .order('name');
    
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching products with images:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} products with images`);
    return data || [];
  } catch (error) {
    console.error('Error fetching products with images:', error);
    throw error;
  }
};

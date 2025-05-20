
import { supabase } from '@/integrations/railway/client';

/**
 * Fetches all product data
 */
export const fetchProductData = async (storeIds: string[] = []) => {
  try {
    console.log('Fetching products for stores:', storeIds);
    
    let query = supabase
      .from('products')
      .select('id, name, price, description, image_url, in_stock, sku, external_id, created_at, updated_at, store_id');
    
    if (storeIds && storeIds.length > 0) {
      query = query.in('store_id', storeIds);
    }
    
    const { data, error } = await query.order('name');
    
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
 * Fetches product data with image URLs
 */
export const fetchProductsWithImages = async (storeIds: string[] = []) => {
  try {
    console.log('Fetching products with images for stores:', storeIds);
    
    let query = supabase
      .from('products')
      .select('id, name, price, description, image_url, in_stock, sku, external_id, created_at, updated_at, store_id')
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

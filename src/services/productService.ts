
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches all product data
 */
export const fetchProductData = async (storeIds: string[] = []) => {
  try {
    console.log('Fetching products for stores:', storeIds);
    
    let query = supabase
      .from('products')
      .select('id, name, price, description, image_url, in_stock, products.store_id, external_id, sku, created_at, updated_at')
      .order('name');
    
    if (storeIds && storeIds.length > 0) {
      query = query.in('products.store_id', storeIds);
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
 * Fetches product data with image URLs
 */
export const fetchProductsWithImages = async (storeIds: string[] = []) => {
  try {
    console.log('Fetching products with images for stores:', storeIds);
    
    let query = supabase
      .from('products')
      .select('id, name, price, description, image_url, in_stock, products.store_id, external_id, sku, created_at, updated_at')
      .not('image_url', 'is', null)  // Only get products with images
      .order('name');
    
    if (storeIds && storeIds.length > 0) {
      query = query.in('products.store_id', storeIds);
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

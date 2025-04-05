
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches all product data
 */
export const fetchProductData = async (storeIds: string[] = []) => {
  try {
    console.log('Fetching products for stores:', storeIds);
    
    let query = supabase
      .from('products')
      .select('products.id, products.name, products.price, products.description, products.image_url, products.in_stock, products.sku, products.external_id, products.created_at, products.updated_at, products.store_id');
    
    if (storeIds && storeIds.length > 0) {
      query = query.in('products.store_id', storeIds);
    }
    
    const { data, error } = await query.order('products.name');
    
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
      .select('products.id, products.name, products.price, products.description, products.image_url, products.in_stock, products.sku, products.external_id, products.created_at, products.updated_at, products.store_id')
      .not('products.image_url', 'is', null)  // Only get products with images
      .order('products.name');
    
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

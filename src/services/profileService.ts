
import { supabase } from '@/integrations/supabase/client';

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

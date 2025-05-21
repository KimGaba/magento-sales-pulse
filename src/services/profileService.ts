
import { supabase } from '@/integrations/railway/client';
import { Profile } from '@/types/database';

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
    return data as Profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Export getProfile as an alias of fetchUserProfile for backward compatibility
export const getProfile = fetchUserProfile;

/**
 * Updates user profile data
 */
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<Profile>
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
    return data[0] as Profile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Checks if user is an admin
 * Note: Since we don't have a role field in profiles, we'll check for specific user IDs
 * or other properties that might indicate admin status
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    // Instead of using admin API, we'll check the user's profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    // Check if tier field exists and has admin value
    if (data && typeof data.tier === 'string') {
      return data.tier === 'admin';
    }
    
    // Alternative approach: hardcode admin user IDs if needed
    // const adminUserIds = ['specific-user-id-1', 'specific-user-id-2'];
    // return adminUserIds.includes(userId);
    
    // Default to false if no admin indicators found
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

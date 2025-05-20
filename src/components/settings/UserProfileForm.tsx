
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/railway/client';
import { fetchUserProfile, updateUserProfile } from '@/services/profileService';
import ProfileInfoCard from '@/components/settings/ProfileInfoCard';
import InvoiceInfoCard from '@/components/settings/InvoiceInfoCard';
import { Profile } from '@/types/database';

interface UserProfileFormProps {
  user: User | null;
  onLogout: () => void;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ user, onLogout }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    invoiceAddress: '',
    city: '',
    postalCode: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Initialize form with user data
      setFormData({
        displayName: user.user_metadata?.name || '',
        email: user.email || '',
        invoiceAddress: user.user_metadata?.invoice_address || '',
        city: user.user_metadata?.city || '',
        postalCode: user.user_metadata?.postal_code || '',
        country: user.user_metadata?.country || ''
      });

      // Fetch profile data from Supabase
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profileData = await fetchUserProfile(user.id);
      
      if (profileData) {
        setFormData(prevState => ({
          ...prevState,
          displayName: profileData.display_name || prevState.displayName,
          invoiceAddress: profileData.invoice_address || prevState.invoiceAddress,
          city: profileData.city || prevState.city,
          postalCode: profileData.postal_code || prevState.postalCode,
          country: profileData.country || prevState.country
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Update user metadata in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: formData.displayName,
          invoice_address: formData.invoiceAddress,
          city: formData.city,
          postal_code: formData.postalCode,
          country: formData.country
        }
      });

      if (updateError) throw updateError;

      // Update profile data
      const profileData: Partial<Profile> = {
        display_name: formData.displayName,
        invoice_address: formData.invoiceAddress,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country
      };

      await updateUserProfile(user.id, profileData);
      
      toast.success("Settings saved successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(`Error saving settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ProfileInfoCard 
        displayName={formData.displayName}
        email={formData.email}
        onChange={handleChange}
        loading={loading}
      />

      <InvoiceInfoCard 
        invoiceAddress={formData.invoiceAddress}
        city={formData.city}
        postalCode={formData.postalCode}
        country={formData.country}
        onChange={handleChange}
        onLogout={onLogout}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </form>
  );
};

export default UserProfileForm;

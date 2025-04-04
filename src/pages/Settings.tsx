
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SettingsHeader from '@/components/settings/SettingsHeader';
import ProfileInfoCard from '@/components/settings/ProfileInfoCard';
import InvoiceInfoCard from '@/components/settings/InvoiceInfoCard';

const Settings = () => {
  const { user, logout } = useAuth();
  const { translations } = useLanguage();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    invoiceAddress: '',
    city: '',
    postalCode: '',
    country: ''
  });

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

      // Fetch profile data from Supabase if exists
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (data && !error) {
            // Cast the data as any to access the new fields without TypeScript errors
            const profileData = data as any;
            
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
        }
      };

      fetchProfile();
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    try {
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

      // Try to update or insert profile data if profiles table exists
      try {
        // Cast using type assertion to bypass TypeScript checking
        const profileData = {
          id: user?.id,
          display_name: formData.displayName,
          invoice_address: formData.invoiceAddress,
          city: formData.city,
          postal_code: formData.postalCode,
          country: formData.country
        } as any;

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData);

        if (profileError && !profileError.message.includes('does not exist')) {
          throw profileError;
        }
      } catch (profileError) {
        // Silently fail if profiles table doesn't exist
        console.log("Profiles table might not exist:", profileError);
      }

      toast.success(translations.settings?.saved || "Settings saved successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(`${translations.settings?.error || "Error saving settings"}: ${error.message}`);
    }
  };

  return (
    <div className="container max-w-3xl py-6">
      <SettingsHeader user={user} />

      <form onSubmit={handleSubmit}>
        <ProfileInfoCard 
          displayName={formData.displayName}
          email={formData.email}
          onChange={handleChange}
        />

        <InvoiceInfoCard 
          invoiceAddress={formData.invoiceAddress}
          city={formData.city}
          postalCode={formData.postalCode}
          country={formData.country}
          onChange={handleChange}
          onLogout={logout}
          onSubmit={handleSubmit}
        />
      </form>
    </div>
  );
};

export default Settings;

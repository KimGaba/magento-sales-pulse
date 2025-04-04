
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SettingsHeader from '@/components/settings/SettingsHeader';
import ProfileInfoCard from '@/components/settings/ProfileInfoCard';
import InvoiceInfoCard from '@/components/settings/InvoiceInfoCard';
import { fetchMagentoConnections } from '@/services/supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

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

  const [connections, setConnections] = useState<any[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [connectionOrderStatuses, setConnectionOrderStatuses] = useState<Record<string, Record<string, boolean>>>({});
  
  const allOrderStatuses = [
    "pending",
    "processing",
    "complete",
    "closed",
    "canceled",
    "holded"
  ];
  
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
      loadMagentoConnections();
    }
  }, [user]);

  const loadMagentoConnections = async () => {
    if (!user) return;
    
    setLoadingConnections(true);
    try {
      const connectionsData = await fetchMagentoConnections(user.id);
      setConnections(connectionsData);
      
      // Initialize connection order statuses
      const statusesObj = {};
      connectionsData.forEach(connection => {
        const currentStatuses = connection.order_statuses || [];
        statusesObj[connection.id] = {};
        
        allOrderStatuses.forEach(status => {
          statusesObj[connection.id][status] = currentStatuses.includes(status);
        });
      });
      
      setConnectionOrderStatuses(statusesObj);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Der opstod en fejl ved indlæsning af dine forbindelser.");
    } finally {
      setLoadingConnections(false);
    }
  };

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
  
  const handleStatusChange = (connectionId: string, status: string, checked: boolean) => {
    setConnectionOrderStatuses(prev => ({
      ...prev,
      [connectionId]: {
        ...prev[connectionId],
        [status]: checked
      }
    }));
  };
  
  const saveConnectionSettings = async (connectionId: string) => {
    const selectedStatuses = Object.entries(connectionOrderStatuses[connectionId] || {})
      .filter(([_, isSelected]) => isSelected)
      .map(([status]) => status);
      
    try {
      const { error } = await supabase
        .from('magento_connections')
        .update({ order_statuses: selectedStatuses })
        .eq('id', connectionId);
        
      if (error) throw error;
      
      toast.success("Ordre-statusindstillinger gemt");
      
      // Reload connections to get updated data
      await loadMagentoConnections();
    } catch (error) {
      console.error("Error saving connection settings:", error);
      toast.error("Fejl ved gemning af indstillinger");
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
      
      {connections.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Magento forbindelser</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {connections.map(connection => (
                <div key={connection.id} className="space-y-4 pb-4 border-b last:border-b-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{connection.store_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      connection.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {connection.status === 'active' ? 'Aktiv' : 'Afventer'}
                    </span>
                  </div>
                  
                  <div>
                    <Label className="text-sm mb-2 block">Ordre-statuser der skal synkroniseres</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {allOrderStatuses.map(status => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`${connection.id}-${status}`}
                            checked={connectionOrderStatuses[connection.id]?.[status] || false}
                            onCheckedChange={(checked) => 
                              handleStatusChange(connection.id, status, !!checked)
                            }
                          />
                          <label 
                            htmlFor={`${connection.id}-${status}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed 
                              peer-disabled:opacity-70 capitalize"
                          >
                            {status}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    size="sm"
                    onClick={() => saveConnectionSettings(connection.id)}
                  >
                    Gem indstillinger
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;

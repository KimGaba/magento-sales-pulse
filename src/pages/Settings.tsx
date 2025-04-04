
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LogOut, Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, logout } = useAuth();
  const { translations } = useLanguage();
  const navigate = useNavigate();
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      toast.success("Settings saved successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(`Error saving settings: ${error.message}`);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user || !user.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="container max-w-3xl py-6">
      <div className="mb-8 flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleBack} 
          className="mr-2"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-16 w-16">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
            <CardDescription>
              Your billing information for invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceAddress">Address</Label>
              <Input
                id="invoiceAddress"
                name="invoiceAddress"
                value={formData.invoiceAddress}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              {translations.common?.logOut || "Log Out"}
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default Settings;

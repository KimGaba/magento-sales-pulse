
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoIcon, Save } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Profile } from '@/types/database';
import { fetchUserProfile } from '@/services/profileService';

interface TimezoneSettingsProps {
  user: User | null;
}

// List of common timezones
const timezones = [
  { value: 'Europe/Copenhagen', label: 'København (Europe/Copenhagen)' },
  { value: 'Europe/London', label: 'London (Europe/London)' },
  { value: 'Europe/Paris', label: 'Paris (Europe/Paris)' },
  { value: 'Europe/Berlin', label: 'Berlin (Europe/Berlin)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (Europe/Stockholm)' },
  { value: 'Europe/Oslo', label: 'Oslo (Europe/Oslo)' },
  { value: 'America/New_York', label: 'New York (America/New_York)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (America/Los_Angeles)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (Asia/Tokyo)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (Asia/Shanghai)' },
  { value: 'Australia/Sydney', label: 'Sydney (Australia/Sydney)' },
];

const TimezoneSettings: React.FC<TimezoneSettingsProps> = ({ user }) => {
  const [timezone, setTimezone] = useState('Europe/Copenhagen');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      // Get the user's timezone from user metadata
      const userTimezone = user.user_metadata?.timezone as string;
      if (userTimezone) {
        setTimezone(userTimezone);
      }
      // Also load from profiles table if available
      loadUserTimezone();
    }
  }, [user]);

  const loadUserTimezone = async () => {
    if (!user) return;
    
    try {
      const profile = await fetchUserProfile(user.id);
      
      if (profile && profile.timezone) {
        setTimezone(profile.timezone);
      }
    } catch (error) {
      console.error('Error loading user timezone:', error);
    }
  };

  const saveTimezone = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { timezone }
      });

      if (updateError) throw updateError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ timezone })
        .eq('id', user.id);
        
      if (profileError) {
        throw profileError;
      }

      toast.success("Tidszone indstillinger gemt");
    } catch (error: any) {
      console.error("Error saving timezone:", error);
      toast.error(`Fejl ved opdatering af tidszone: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          Tidszone Indstillinger
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="ml-2 h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Vælg din tidszone for at se alle datoer og tidspunkter i dit lokale tidsformat.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Vælg din foretrukne tidszone for app'en
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Tidszone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Vælg tidszone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-2">
              Nuværende tid i {timezone}: {new Date().toLocaleTimeString('da-DK', { timeZone: timezone })}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          type="button" 
          onClick={saveTimezone} 
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span>
              Gemmer...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Gem tidszone
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TimezoneSettings;

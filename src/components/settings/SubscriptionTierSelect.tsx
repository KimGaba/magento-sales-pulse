
import React, { useState } from 'react';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { ChevronDown, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { updateUserProfile } from '@/services/profileService';
import { Profile } from '@/types/database';

// Define subscription tiers with display names and durations
const subscriptionTiers = {
  free: { label: 'Free (3 måneder)', duration: '3 months' },
  small: { label: 'Small Business (1 år)', duration: '1 year' },
  medium: { label: 'Medium Business (2 år)', duration: '2 years' },
  big: { label: 'Big Business (5 år)', duration: '5 years' }
};

type SubscriptionTierSelectProps = {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  onTierChange?: (tier: string) => void;
};

const SubscriptionTierSelect: React.FC<SubscriptionTierSelectProps> = ({ 
  user, 
  profile, 
  isAdmin,
  onTierChange 
}) => {
  const [currentTier, setCurrentTier] = useState<string>(profile?.tier || 'free');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleTierChange = async (newTier: string) => {
    if (!user || !isAdmin) return;
    
    try {
      setIsUpdating(true);
      
      await updateUserProfile(profile?.id || user.id, {
        tier: newTier
      });
      
      setCurrentTier(newTier);
      if (onTierChange) onTierChange(newTier);
      
      toast.success(`Subscription tier updated to ${subscriptionTiers[newTier as keyof typeof subscriptionTiers].label}`);
    } catch (error) {
      console.error('Error updating subscription tier:', error);
      toast.error('Failed to update subscription tier');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAdmin) {
    // For non-admin users, just show their current tier without the ability to change it
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Subscription Tier
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Info className="h-4 w-4" />
                    <span className="sr-only">What is this?</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your current subscription plan determines available features and data retention period.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>Your current subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-secondary p-3 rounded-md">
            {profile?.tier ? subscriptionTiers[profile.tier as keyof typeof subscriptionTiers]?.label : 'Free (3 måneder)'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Subscription Tier
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Info className="h-4 w-4" />
                  <span className="sr-only">Subscription information</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>The subscription tier determines available features and data retention period.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>Select the user's subscription tier</CardDescription>
      </CardHeader>
      <CardContent>
        <Select 
          value={currentTier} 
          onValueChange={handleTierChange}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a tier" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(subscriptionTiers).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default SubscriptionTierSelect;


import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import UserProfileForm from '@/components/settings/UserProfileForm';
import MagentoConnectionSettings from '@/components/settings/MagentoConnectionSettings';
import TimezoneSettings from '@/components/settings/TimezoneSettings';
import SubscriptionTierSelect from '@/components/settings/SubscriptionTierSelect';
import { fetchUserProfile, isUserAdmin } from '@/services/profileService';
import { Profile } from '@/types/database';

const Settings = () => {
  const { user, logout } = useAuth();
  const { translations } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      loadProfileData();
      checkAdminStatus();
    }
  }, [user]);
  
  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profileData = await fetchUserProfile(user.id);
      setProfile(profileData);
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const adminStatus = await isUserAdmin(user.id);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };
  
  return (
    <div className="container max-w-3xl py-6">
      <SettingsHeader user={user} />
      
      <UserProfileForm user={user} onLogout={logout} />
      
      <SubscriptionTierSelect 
        user={user} 
        profile={profile}
        isAdmin={isAdmin}
        onTierChange={() => {}}
      />
      
      <TimezoneSettings user={user} />
      
      {user && <MagentoConnectionSettings userId={user.id} />}
    </div>
  );
};

export default Settings;

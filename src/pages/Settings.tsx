
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import UserProfileForm from '@/components/settings/UserProfileForm';
import MagentoConnectionSettings from '@/components/settings/MagentoConnectionSettings';
import TimezoneSettings from '@/components/settings/TimezoneSettings';

const Settings = () => {
  const { user, logout } = useAuth();
  const { translations } = useLanguage();
  
  return (
    <div className="container max-w-3xl py-6">
      <SettingsHeader user={user} />
      
      <UserProfileForm user={user} onLogout={logout} />
      
      <TimezoneSettings user={user} />
      
      {user && <MagentoConnectionSettings userId={user.id} />}
    </div>
  );
};

export default Settings;


import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { User } from '@supabase/supabase-js';

interface SettingsHeaderProps {
  user: User | null;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({ user }) => {
  const navigate = useNavigate();
  const { translations } = useLanguage();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user || !user.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center gap-4">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleBack} 
        className="mr-2 h-9 w-9 md:h-10 md:w-10"
        aria-label={translations.settings?.backButton || "Back"}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 md:h-16 md:w-16">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg md:text-xl">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{translations.settings?.title || "Account Settings"}</h1>
          <p className="text-muted-foreground text-sm md:text-base">{translations.settings?.subtitle || "Manage your account information"}</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsHeader;

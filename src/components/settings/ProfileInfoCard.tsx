
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';

interface ProfileInfoCardProps {
  displayName: string;
  email: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({ 
  displayName, 
  email, 
  onChange 
}) => {
  const { translations } = useLanguage();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{translations.settings?.profileInfo || "Profile Information"}</CardTitle>
        <CardDescription>
          {translations.settings?.profileDesc || "Update your personal information"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">{translations.settings?.name || "Display Name"}</Label>
            <Input
              id="displayName"
              name="displayName"
              value={displayName}
              onChange={onChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{translations.settings?.email || "Email"}</Label>
            <Input
              id="email"
              name="email"
              value={email}
              disabled
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileInfoCard;

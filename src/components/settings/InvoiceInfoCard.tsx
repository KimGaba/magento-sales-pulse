
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogOut, Save } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface InvoiceInfoCardProps {
  invoiceAddress: string;
  city: string;
  postalCode: string;
  country: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
  onSubmit: () => void;
}

const InvoiceInfoCard: React.FC<InvoiceInfoCardProps> = ({ 
  invoiceAddress, 
  city, 
  postalCode, 
  country, 
  onChange, 
  onLogout,
  onSubmit
}) => {
  const { translations } = useLanguage();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{translations.settings?.invoiceInfo || "Invoice Information"}</CardTitle>
        <CardDescription>
          {translations.settings?.invoiceDesc || "Your billing information for invoices"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invoiceAddress">{translations.settings?.address || "Address"}</Label>
          <Input
            id="invoiceAddress"
            name="invoiceAddress"
            value={invoiceAddress}
            onChange={onChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">{translations.settings?.city || "City"}</Label>
            <Input
              id="city"
              name="city"
              value={city}
              onChange={onChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">{translations.settings?.postalCode || "Postal Code"}</Label>
            <Input
              id="postalCode"
              name="postalCode"
              value={postalCode}
              onChange={onChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">{translations.settings?.country || "Country"}</Label>
            <Input
              id="country"
              name="country"
              value={country}
              onChange={onChange}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" type="button" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {translations.settings?.logOutButton || translations.common?.logOut || "Log Out"}
        </Button>
        <Button type="button" onClick={onSubmit}>
          <Save className="mr-2 h-4 w-4" />
          {translations.settings?.save || "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InvoiceInfoCard;

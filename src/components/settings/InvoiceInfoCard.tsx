
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogOut, Save } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InvoiceInfoCardProps {
  invoiceAddress: string;
  city: string;
  postalCode: string;
  country: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
  onSubmit: () => void;
  loading?: boolean; // Add the loading prop to the interface
}

const InvoiceInfoCard: React.FC<InvoiceInfoCardProps> = ({ 
  invoiceAddress, 
  city, 
  postalCode, 
  country, 
  onChange, 
  onLogout,
  onSubmit,
  loading = false // Set a default value of false
}) => {
  const { translations } = useLanguage();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    onLogout();
    setShowLogoutConfirm(false);
  };

  return (
    <>
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
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">{translations.settings?.city || "City"}</Label>
              <Input
                id="city"
                name="city"
                value={city}
                onChange={onChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">{translations.settings?.postalCode || "Postal Code"}</Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={postalCode}
                onChange={onChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{translations.settings?.country || "Country"}</Label>
              <Input
                id="country"
                name="country"
                value={country}
                onChange={onChange}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-3">
          <Button variant="outline" type="button" onClick={handleLogoutClick} className="w-full sm:w-auto" disabled={loading}>
            <LogOut className="mr-2 h-4 w-4" />
            {translations.settings?.logOutButton || translations.common?.logOut || "Log Out"}
          </Button>
          <Button type="button" onClick={onSubmit} className="w-full sm:w-auto" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {translations.settings?.save || "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {translations.settings?.logoutConfirmTitle || "Confirm Logout"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {translations.settings?.logoutConfirmMessage || "Are you sure you want to log out? Any unsaved changes will be lost."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="mt-2 sm:mt-0">
              {translations.common?.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogout}>
              {translations.common?.confirm || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InvoiceInfoCard;

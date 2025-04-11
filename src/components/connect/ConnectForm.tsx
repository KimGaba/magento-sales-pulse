
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { MagentoConnection } from '@/services/magentoService';

interface ConnectFormProps {
  onConnect: (connection: Omit<MagentoConnection, 'id' | 'created_at' | 'updated_at'>) => void;
  connecting: boolean;
}

const ConnectForm: React.FC<ConnectFormProps> = ({ onConnect, connecting }) => {
  const [storeUrl, setStoreUrl] = useState('');
  const [storeName, setStoreName] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [storeId, setStoreId] = useState('');

  const handleStoreUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreUrl(e.target.value);
  };

  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreName(e.target.value);
  };

  const handleAccessTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessToken(e.target.value);
  };

  const handleStoreIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreId(e.target.value);
  };

  const handleSubmit = () => {
    if (!storeUrl || !storeName || !accessToken || !storeId) {
      return;
    }

    const newConnection: Omit<MagentoConnection, 'id' | 'created_at' | 'updated_at'> = {
      user_id: '', // This will be set in the parent component
      store_id: storeId,
      store_url: storeUrl,
      store_name: storeName,
      access_token: accessToken,
      status: 'pending'
    };

    onConnect(newConnection);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forbind din Magento butik</CardTitle>
        <CardDescription>
          Indtast dine Magento butiksoplysninger for at oprette forbindelse.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="storeId">Store ID</Label>
          <Input 
            id="storeId" 
            value={storeId} 
            onChange={handleStoreIdChange} 
            placeholder="Dit unikke butiks-id" 
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="storeUrl">Butiks URL</Label>
          <Input
            id="storeUrl"
            placeholder="https://din-butik.dk"
            type="url"
            value={storeUrl}
            onChange={handleStoreUrlChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="storeName">Butiksnavn</Label>
          <Input
            id="storeName"
            placeholder="Navnet på din butik"
            type="text"
            value={storeName}
            onChange={handleStoreNameChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="accessToken">Adgangstoken</Label>
          <Input
            id="accessToken"
            placeholder="Dit Magento adgangstoken"
            type="password"
            value={accessToken}
            onChange={handleAccessTokenChange}
          />
        </div>
        <Button disabled={connecting} onClick={handleSubmit}>
          {connecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opretter forbindelse...
            </>
          ) : (
            "Opret forbindelse"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConnectForm;

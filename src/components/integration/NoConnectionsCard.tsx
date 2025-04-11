
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';

const NoConnectionsCard: React.FC = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Aktuel status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Ingen Magento butikker forbundet</p>
          <Button variant="outline" onClick={() => window.location.href = "/connect"}>
            Forbind en butik
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NoConnectionsCard;

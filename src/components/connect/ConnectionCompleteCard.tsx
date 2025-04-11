
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';

interface ConnectionCompleteCardProps {
  onGoToDashboard: () => void;
}

const ConnectionCompleteCard: React.FC<ConnectionCompleteCardProps> = ({ onGoToDashboard }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Butikken er forbundet!</CardTitle>
        <CardDescription>
          Din Magento butik er nu forbundet og synkroniseret.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="mb-4">
          Du er nu klar til at udforske dine data.
        </p>
        <Button onClick={onGoToDashboard}>Gå til instrumentpanelet</Button>
      </CardContent>
    </Card>
  );
};

export default ConnectionCompleteCard;

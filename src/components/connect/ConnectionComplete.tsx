
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface ConnectionCompleteProps {
  onReset: () => void;
}

const ConnectionComplete: React.FC<ConnectionCompleteProps> = ({ onReset }) => {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <CardTitle>Forbindelse fuldført!</CardTitle>
        <CardDescription>
          Din Magento-butik er nu forbundet med Sales Pulse
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p>
          Alle dine data er blevet synkroniseret, og du kan nu begynde at bruge
          din salgsoversigt.
        </p>
        
        <div className="mt-6 border rounded-lg p-4 bg-blue-50">
          <h3 className="font-semibold">Næste skridt:</h3>
          <ul className="text-sm mt-2 space-y-1 text-left list-disc list-inside">
            <li>Udforsk dit dashboard</li>
            <li>Undersøg dine bedst sælgende produkter</li>
            <li>Analyser dine daglige salgsmønstre</li>
            <li>Opdag trends og indsigter</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline"
          onClick={onReset}
        >
          Forbind flere butikker
        </Button>
        <Button 
          className="bg-magento-600 hover:bg-magento-700"
          onClick={() => window.location.href = '/dashboard'}
        >
          Gå til dashboard
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConnectionComplete;

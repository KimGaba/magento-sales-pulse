
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const EdgeFunctionUnavailable = () => {
  return (
    <Card className="my-6 border-amber-300">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center p-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Edge Function Utilgængelig</h3>
          <p className="text-gray-500 mb-2">
            Kunne ikke forbinde til Supabase Edge Functions.
          </p>
          <p className="text-gray-500 text-sm">
            Dette kan ske i udviklingsmiljøer eller ved netværksproblemer. Prøv igen senere eller kontakt support.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EdgeFunctionUnavailable;

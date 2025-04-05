
import React from 'react';
import { TestResult } from '@/types/database';
import { AlertCircle, CheckCircle, Clock, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TestCardProps {
  result: TestResult;
}

const TestCard = ({ result }: TestCardProps) => {
  const [showDetails, setShowDetails] = React.useState(false);
  
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };
  
  return (
    <div className="p-4 border rounded-md shadow-sm bg-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{result.name}</h3>
        {result.status === 'pending' && (
          <div className="flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
            <Clock className="w-3 h-3 mr-1" />
            <span>Running</span>
          </div>
        )}
        {result.status === 'success' && (
          <div className="flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span>Success</span>
          </div>
        )}
        {result.status === 'error' && (
          <div className="flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
            <AlertCircle className="w-3 h-3 mr-1" />
            <span>Error</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-2">{result.message}</p>
      
      {result.details && (
        <>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleDetails} 
            className="mb-2 text-xs"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          
          {showDetails && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">{result.details}</pre>
            </div>
          )}
        </>
      )}
      
      {result.status === 'error' && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded-md">
          <div className="flex">
            <HelpCircle className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <strong>Troubleshooting:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Try temporarily disabling RLS in your Supabase dashboard</li>
                <li>Check if your project is active</li>
                <li>Verify that the credentials are correct</li>
                <li>Check if the required tables exist</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCard;


import React from 'react';
import { TestResult } from '@/types/database';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface TestCardProps {
  result: TestResult;
}

const TestCard = ({ result }: TestCardProps) => {
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
      <p className="text-sm text-gray-600">{result.message}</p>
      {result.details && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{result.details}</pre>
        </div>
      )}
    </div>
  );
};

export default TestCard;

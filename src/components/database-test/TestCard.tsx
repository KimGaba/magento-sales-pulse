
import React from 'react';
import { TestResult } from '@/types/database';

interface TestCardProps {
  result: TestResult;
}

const TestCard = ({ result }: TestCardProps) => {
  return (
    <div className="p-4 border rounded-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{result.name}</h3>
        {result.status === 'pending' && (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Running</span>
        )}
        {result.status === 'success' && (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Success</span>
        )}
        {result.status === 'error' && (
          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Error</span>
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

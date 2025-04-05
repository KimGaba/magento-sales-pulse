
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingErrorContentProps {
  isLoading: boolean;
  error: any;
  handleRetry: () => void;
  noDataMessage: string;
}

const LoadingErrorContent: React.FC<LoadingErrorContentProps> = ({
  isLoading,
  error,
  handleRetry,
  noDataMessage
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 md:p-6">
        <div className="text-red-500 mb-4">
          {error instanceof Error ? error.message : "An error occurred while fetching data"}
        </div>
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="text-center p-4 md:p-6 text-gray-500">
      {noDataMessage}
    </div>
  );
};

export default LoadingErrorContent;

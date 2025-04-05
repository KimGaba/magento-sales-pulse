
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TestCard from './TestCard';
import { TestResult } from '@/types/database';

interface TestResultsListProps {
  results: TestResult[];
}

const TestResultsList = ({ results }: TestResultsListProps) => {
  if (results.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Results</CardTitle>
        <CardDescription>Results from database connection tests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result, index) => (
            <TestCard key={index} result={result} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestResultsList;

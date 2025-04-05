
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TestResult } from '@/types/database';

interface TestRunnerProps {
  isRunning: boolean;
  onRunAllTests: () => void;
  onCheckTableExistence: () => void;
  supabaseInfo: string;
}

const TestRunner = ({ isRunning, onRunAllTests, onCheckTableExistence, supabaseInfo }: TestRunnerProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Test Options</CardTitle>
        <CardDescription>Check if your database connection is working properly</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">This will run several tests against your Supabase database to verify connectivity and access to the transactions table.</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRunAllTests} disabled={isRunning}>
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          <Button 
            onClick={onCheckTableExistence} 
            disabled={isRunning}
            variant="outline"
          >
            Check Table Existence
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestRunner;

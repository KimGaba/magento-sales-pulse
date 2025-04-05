
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useDatabaseTests } from '@/hooks/database-tests/useDatabaseTests';
import TestRunner from '@/components/database-test/TestRunner';
import TestResultsList from '@/components/database-test/TestResultsList';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

const DatabaseTest = () => {
  const { 
    results, 
    isRunning, 
    supabaseInfo, 
    runAllTests, 
    testTableExistence 
  } = useDatabaseTests();

  useEffect(() => {
    // Check for error results and show a toast if there are any
    const errorResults = results.filter(r => r.status === 'error');
    if (errorResults.length > 0) {
      toast({
        title: "Database Connection Issues",
        description: "There are errors with your database connection. Try temporarily disabling RLS or creating a new Supabase project.",
        variant: "destructive"
      });
    }
  }, [results]);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Database Connection Tests</h1>
        <p className="text-gray-500">Run tests to check Supabase database connectivity</p>
        {supabaseInfo && (
          <p className="text-sm text-blue-600 mt-2">{supabaseInfo}</p>
        )}
      </div>
      
      <TestRunner 
        isRunning={isRunning}
        onRunAllTests={runAllTests}
        onCheckTableExistence={testTableExistence}
        supabaseInfo={supabaseInfo}
      />
      
      <TestResultsList results={results} />
      <Toaster />
    </Layout>
  );
};

export default DatabaseTest;


import React from 'react';
import Layout from '@/components/layout/Layout';
import { useDatabaseTests } from '@/hooks/database-tests/useDatabaseTests';
import TestRunner from '@/components/database-test/TestRunner';
import TestResultsList from '@/components/database-test/TestResultsList';

const DatabaseTest = () => {
  const { 
    results, 
    isRunning, 
    supabaseInfo, 
    runAllTests, 
    testTableExistence 
  } = useDatabaseTests();

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
    </Layout>
  );
};

export default DatabaseTest;

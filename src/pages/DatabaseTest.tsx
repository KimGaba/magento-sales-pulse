
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { testDatabaseConnection, getTransactionCount, fetchTransactionData } from '@/services/transactionService';

type TestResult = {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
};

const DatabaseTest = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    // Basic connection test
    await runBasicConnectionTest();
    
    // Transaction count test
    await runTransactionCountTest();
    
    // Fetch transactions test
    await runFetchTransactionsTest();
    
    setIsRunning(false);
  };

  const runBasicConnectionTest = async () => {
    try {
      setResults(prev => [...prev, { 
        name: 'Database Connection Test', 
        status: 'pending', 
        message: 'Testing basic connection...' 
      }]);
      
      const success = await testDatabaseConnection();
      
      setResults(prev => prev.map(r => 
        r.name === 'Database Connection Test' 
          ? { 
              name: 'Database Connection Test', 
              status: success ? 'success' : 'error', 
              message: success 
                ? 'Successfully connected to Supabase' 
                : 'Failed to connect to Supabase'
            }
          : r
      ));
    } catch (error) {
      setResults(prev => prev.map(r => 
        r.name === 'Database Connection Test' 
          ? { 
              name: 'Database Connection Test', 
              status: 'error', 
              message: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          : r
      ));
    }
  };

  const runTransactionCountTest = async () => {
    try {
      setResults(prev => [...prev, { 
        name: 'Transaction Count Test', 
        status: 'pending', 
        message: 'Counting transactions...' 
      }]);
      
      const count = await getTransactionCount();
      
      setResults(prev => prev.map(r => 
        r.name === 'Transaction Count Test' 
          ? { 
              name: 'Transaction Count Test', 
              status: 'success', 
              message: `Found ${count} transactions`
            }
          : r
      ));
    } catch (error) {
      setResults(prev => prev.map(r => 
        r.name === 'Transaction Count Test' 
          ? { 
              name: 'Transaction Count Test', 
              status: 'error', 
              message: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          : r
      ));
    }
  };

  const runFetchTransactionsTest = async () => {
    try {
      setResults(prev => [...prev, { 
        name: 'Fetch Transactions Test', 
        status: 'pending', 
        message: 'Fetching transactions...' 
      }]);
      
      // Fetch transactions from the last 2 years
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      
      const fromDate = twoYearsAgo.toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];
      
      const transactions = await fetchTransactionData(fromDate, toDate);
      
      setResults(prev => prev.map(r => 
        r.name === 'Fetch Transactions Test' 
          ? { 
              name: 'Fetch Transactions Test', 
              status: 'success', 
              message: `Retrieved ${transactions.length} transactions`
            }
          : r
      ));
    } catch (error) {
      setResults(prev => prev.map(r => 
        r.name === 'Fetch Transactions Test' 
          ? { 
              name: 'Fetch Transactions Test', 
              status: 'error', 
              message: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          : r
      ));
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Database Connection Tests</h1>
        <p className="text-gray-500">Run tests to check Supabase database connectivity</p>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Options</CardTitle>
          <CardDescription>Check if your database connection is working properly</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This will run several tests against your Supabase database to verify connectivity and access to the transactions table.</p>
          <Button onClick={runAllTests} disabled={isRunning}>
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </CardContent>
      </Card>
      
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Results from database connection tests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="p-4 border rounded-md">
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
};

export default DatabaseTest;


import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { testDatabaseConnection, getTransactionCount, fetchTransactionData } from '@/services/transactionService';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type TestResult = {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: string;
};

const DatabaseTest = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [supabaseInfo, setSupabaseInfo] = useState<string>('');

  // Get Supabase configuration info to verify it's correctly set up
  useEffect(() => {
    // Use the URL from the client config file which is publicly accessible
    const url = "https://vlkcnndgtarduplyedyp.supabase.co";
    setSupabaseInfo(`Connected to: ${url}`);
  }, []);

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    // Test Supabase raw query - most direct test possible
    await runRawQueryTest();
    
    // Basic connection test
    await runBasicConnectionTest();
    
    // Transaction count test
    await runTransactionCountTest();
    
    // Fetch transactions test
    await runFetchTransactionsTest();
    
    setIsRunning(false);
  };

  const runRawQueryTest = async () => {
    try {
      setResults(prev => [...prev, { 
        name: 'Raw Supabase Query Test', 
        status: 'pending', 
        message: 'Testing raw query capability...' 
      }]);
      
      console.log('Executing raw Supabase query...');
      
      // Most basic query possible to test connection
      const { data, error, status, statusText } = await supabase
        .from('transactions')
        .select('count(*)', { count: 'exact', head: true });
      
      console.log('Raw query response:', { data, error, status, statusText });
      
      if (error) {
        setResults(prev => prev.map(r => 
          r.name === 'Raw Supabase Query Test' 
            ? { 
                name: 'Raw Supabase Query Test', 
                status: 'error', 
                message: `Error: ${error.message}`,
                details: `Code: ${error.code}, Status: ${status}, Detail: ${JSON.stringify(error.details || {})}`
              }
            : r
        ));
      } else {
        setResults(prev => prev.map(r => 
          r.name === 'Raw Supabase Query Test' 
            ? { 
                name: 'Raw Supabase Query Test', 
                status: 'success', 
                message: 'Raw query successful',
                details: `Status: ${status}, Response: ${JSON.stringify(data)}`
              }
            : r
        ));
      }
    } catch (error) {
      console.error('Exception in raw query test:', error);
      setResults(prev => prev.map(r => 
        r.name === 'Raw Supabase Query Test' 
          ? { 
              name: 'Raw Supabase Query Test', 
              status: 'error', 
              message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
              details: `Stack: ${error instanceof Error ? error.stack : 'No stack trace available'}`
            }
          : r
      ));
    }
  };

  const runBasicConnectionTest = async () => {
    try {
      setResults(prev => [...prev, { 
        name: 'Database Connection Test', 
        status: 'pending', 
        message: 'Testing basic connection...' 
      }]);
      
      console.log('Testing basic database connectivity...');
      const success = await testDatabaseConnection();
      console.log('Connection test result:', success);
      
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
      console.error('Exception in connection test:', error);
      setResults(prev => prev.map(r => 
        r.name === 'Database Connection Test' 
          ? { 
              name: 'Database Connection Test', 
              status: 'error', 
              message: `Error: ${error instanceof Error ? error.message : String(error)}`,
              details: `Stack: ${error instanceof Error ? error.stack : 'No stack trace available'}`
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
      
      console.log('Running transaction count test...');
      const count = await getTransactionCount();
      console.log('Transaction count result:', count);
      
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
      console.error('Exception in transaction count test:', error);
      setResults(prev => prev.map(r => 
        r.name === 'Transaction Count Test' 
          ? { 
              name: 'Transaction Count Test', 
              status: 'error', 
              message: `Error: ${error instanceof Error ? error.message : String(error)}`,
              details: `Stack: ${error instanceof Error ? error.stack : 'No stack trace available'}`
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
      
      console.log('Running fetch transactions test...');
      
      // Fetch transactions from the last 2 years
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      
      const fromDate = twoYearsAgo.toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];
      
      console.log(`Fetching transactions from ${fromDate} to ${toDate}...`);
      const transactions = await fetchTransactionData(fromDate, toDate);
      console.log(`Retrieved ${transactions.length} transactions`);
      
      if (transactions.length > 0) {
        console.log('Sample transaction:', transactions[0]);
      }
      
      setResults(prev => prev.map(r => 
        r.name === 'Fetch Transactions Test' 
          ? { 
              name: 'Fetch Transactions Test', 
              status: 'success', 
              message: `Retrieved ${transactions.length} transactions`,
              details: transactions.length > 0 
                ? `Sample: ${JSON.stringify(transactions[0]).substring(0, 200)}...` 
                : 'No transactions found'
            }
          : r
      ));
    } catch (error) {
      console.error('Exception in fetch transactions test:', error);
      setResults(prev => prev.map(r => 
        r.name === 'Fetch Transactions Test' 
          ? { 
              name: 'Fetch Transactions Test', 
              status: 'error', 
              message: `Error: ${error instanceof Error ? error.message : String(error)}`,
              details: `Stack: ${error instanceof Error ? error.stack : 'No stack trace available'}`
            }
          : r
      ));
    }
  };

  const testTableExistence = async () => {
    try {
      setResults(prev => [...prev, { 
        name: 'Table Existence Test', 
        status: 'pending', 
        message: 'Checking if transactions table exists...' 
      }]);
      
      // Use the custom RPC function we created to check if the table exists
      const { data, error } = await supabase.rpc('check_table_exists', {
        table_name: 'transactions'
      } as any); // Use type assertion to bypass TypeScript error until types are updated
      
      console.log('Table existence check:', { data, error });
      
      if (error) {
        setResults(prev => prev.map(r => 
          r.name === 'Table Existence Test' 
            ? { 
                name: 'Table Existence Test', 
                status: 'error', 
                message: `Error checking table: ${error.message}`,
                details: `Code: ${error.code}, Details: ${JSON.stringify(error.details || {})}`
              }
            : r
        ));
      } else {
        const tableExists = data;
        setResults(prev => prev.map(r => 
          r.name === 'Table Existence Test' 
            ? { 
                name: 'Table Existence Test', 
                status: tableExists ? 'success' : 'error', 
                message: tableExists 
                  ? 'Transactions table exists' 
                  : 'Transactions table not found',
                details: `Query result: ${JSON.stringify(data)}`
              }
            : r
        ));
      }
    } catch (error) {
      console.error('Exception in table existence test:', error);
      setResults(prev => prev.map(r => 
        r.name === 'Table Existence Test' 
          ? { 
              name: 'Table Existence Test', 
              status: 'error', 
              message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
              details: `Stack: ${error instanceof Error ? error.stack : 'No stack trace available'}`
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
        {supabaseInfo && (
          <p className="text-sm text-blue-600 mt-2">{supabaseInfo}</p>
        )}
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Options</CardTitle>
          <CardDescription>Check if your database connection is working properly</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This will run several tests against your Supabase database to verify connectivity and access to the transactions table.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={runAllTests} disabled={isRunning}>
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            <Button 
              onClick={testTableExistence} 
              disabled={isRunning}
              variant="outline"
            >
              Check Table Existence
            </Button>
          </div>
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
                  {result.details && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono overflow-x-auto">
                      {result.details}
                    </div>
                  )}
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

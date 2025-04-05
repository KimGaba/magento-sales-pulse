
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestResult } from '@/types/database';
import { testDatabaseConnection, getTransactionCount, fetchTransactionData } from '@/services/transactionService';

export const useDatabaseTests = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [supabaseInfo, setSupabaseInfo] = useState<string>('');

  // Initialize Supabase info
  useState(() => {
    // Use the URL string directly instead of the protected property
    const url = "https://vlkcnndgtarduplyedyp.supabase.co";
    setSupabaseInfo(`Connected to: ${url}`);
  });

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    await runRawQueryTest();
    await runBasicConnectionTest();
    await runTransactionCountTest();
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
      
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      
      const fromDate = twoYearsAgo.toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];
      
      console.log(`Fetching transactions from ${fromDate} to ${toDate}...`);
      // Don't pass storeIds, making it optional
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
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });
      
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
        const tableExists = data !== null;
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

  return {
    results,
    isRunning,
    supabaseInfo,
    runAllTests,
    testTableExistence
  };
};

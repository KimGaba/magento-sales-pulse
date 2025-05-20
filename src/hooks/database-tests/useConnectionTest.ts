
import { useState } from 'react';
import { TestResult } from '@/types/database';
import { supabase } from '@/integrations/railway/client';
import { testDatabaseConnection } from '@/services/transactionService';

export const useConnectionTest = () => {
  const [connectionResults, setConnectionResults] = useState<TestResult[]>([]);
  const [isRunningConnection, setIsRunningConnection] = useState(false);

  const runBasicConnectionTest = async () => {
    try {
      setConnectionResults(prev => [...prev, { 
        name: 'Database Connection Test', 
        status: 'pending', 
        message: 'Testing basic connection...' 
      }]);
      
      console.log('Testing basic database connectivity...');
      const success = await testDatabaseConnection();
      console.log('Connection test result:', success);
      
      setConnectionResults(prev => prev.map(r => 
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
      setConnectionResults(prev => prev.map(r => 
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

  const runRawQueryTest = async () => {
    try {
      setConnectionResults(prev => [...prev, { 
        name: 'Raw Supabase Query Test', 
        status: 'pending', 
        message: 'Testing raw query capability...' 
      }]);
      
      console.log('Executing raw Supabase query...');
      
      // Explicitly select only the id field to avoid any ambiguity
      const { data, error, status, statusText } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true });
      
      console.log('Raw query response:', { data, error, status, statusText });
      
      if (error) {
        setConnectionResults(prev => prev.map(r => 
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
        setConnectionResults(prev => prev.map(r => 
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
      setConnectionResults(prev => prev.map(r => 
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
  
  const testTableExistence = async () => {
    try {
      setConnectionResults(prev => [...prev, { 
        name: 'Table Existence Test', 
        status: 'pending', 
        message: 'Checking if transactions table exists...' 
      }]);
      
      // Only select the id field to avoid any column ambiguity
      const { data, error } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true });
      
      console.log('Table existence check:', { data, error });
      
      if (error) {
        setConnectionResults(prev => prev.map(r => 
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
        setConnectionResults(prev => prev.map(r => 
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
      setConnectionResults(prev => prev.map(r => 
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
  
  const runConnectionTests = async () => {
    setIsRunningConnection(true);
    setConnectionResults([]);
    
    await runRawQueryTest();
    await runBasicConnectionTest();
    
    setIsRunningConnection(false);
  };
  
  return {
    connectionResults,
    isRunningConnection,
    runConnectionTests,
    testTableExistence
  };
};


import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestResult } from '@/types/database';

export const useConnectionTest = () => {
  const [connectionResults, setConnectionResults] = useState<TestResult[]>([]);
  const [isRunningConnection, setIsRunningConnection] = useState(false);

  const runRawQueryTest = async () => {
    try {
      setConnectionResults(prev => [...prev, { 
        name: 'Raw Supabase Query Test', 
        status: 'pending', 
        message: 'Testing raw query capability...' 
      }]);
      
      console.log('Executing raw Supabase query...');
      
      // Test direct query capability
      const { data, error, status, statusText } = await supabase
        .from('transactions')
        .select('transactions.id')
        .limit(1);
      
      console.log('Raw query response:', { data, error, status, statusText });
      
      if (error) {
        const errorDetails = JSON.stringify({
          message: error.message,
          code: error.code,
          status,
          details: error.details || {}
        }, null, 2);
        
        setConnectionResults(prev => prev.map(r => 
          r.name === 'Raw Supabase Query Test' 
            ? { 
                name: 'Raw Supabase Query Test', 
                status: 'error', 
                message: `Error: ${error.message}`,
                details: errorDetails
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
                details: `Status: ${status}, Data: ${JSON.stringify(data, null, 2)}`
              }
            : r
        ));
      }
    } catch (error) {
      console.error('Exception in raw query test:', error);
      const errorDetails = error instanceof Error 
        ? `${error.message}\n${error.stack || 'No stack trace'}`
        : JSON.stringify(error, null, 2);
        
      setConnectionResults(prev => prev.map(r => 
        r.name === 'Raw Supabase Query Test' 
          ? { 
              name: 'Raw Supabase Query Test', 
              status: 'error', 
              message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
              details: errorDetails
            }
          : r
      ));
    }
  };

  const runBasicConnectionTest = async () => {
    try {
      setConnectionResults(prev => [...prev, { 
        name: 'Database Connection Test', 
        status: 'pending', 
        message: 'Testing basic connection...' 
      }]);
      
      console.log('Testing basic database connectivity...');
      
      // Check if we can connect using the Supabase URL
      const supabaseURL = supabase.supabaseUrl;
      const connectionTestResult = await fetch(`${supabaseURL}/rest/v1/`);
      
      console.log('Connection test response:', {
        status: connectionTestResult.status,
        statusText: connectionTestResult.statusText,
        ok: connectionTestResult.ok
      });
      
      if (!connectionTestResult.ok) {
        setConnectionResults(prev => prev.map(r => 
          r.name === 'Database Connection Test' 
            ? { 
                name: 'Database Connection Test', 
                status: 'error', 
                message: 'Failed to connect to Supabase',
                details: `Status: ${connectionTestResult.status} ${connectionTestResult.statusText}`
              }
            : r
        ));
      } else {
        setConnectionResults(prev => prev.map(r => 
          r.name === 'Database Connection Test' 
            ? { 
                name: 'Database Connection Test', 
                status: 'success', 
                message: 'Successfully connected to Supabase',
                details: `Connected to: ${supabaseURL}`
              }
            : r
        ));
      }
    } catch (error) {
      console.error('Exception in connection test:', error);
      const errorDetails = error instanceof Error 
        ? `${error.message}\n${error.stack || 'No stack trace'}`
        : JSON.stringify(error, null, 2);
        
      setConnectionResults(prev => prev.map(r => 
        r.name === 'Database Connection Test' 
          ? { 
              name: 'Database Connection Test', 
              status: 'error', 
              message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
              details: errorDetails
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
      
      // Directly check if the table exists using a custom function
      const { data, error } = await supabase.rpc('check_table_exists', {
        table_name: 'transactions'
      });
      
      console.log('Table existence check:', { data, error });
      
      if (error) {
        const errorDetails = JSON.stringify({
          message: error.message,
          code: error.code,
          details: error.details || {}
        }, null, 2);
        
        setConnectionResults(prev => prev.map(r => 
          r.name === 'Table Existence Test' 
            ? { 
                name: 'Table Existence Test', 
                status: 'error', 
                message: `Error checking table: ${error.message}`,
                details: errorDetails
              }
            : r
        ));
      } else {
        const tableExists = data === true;
        setConnectionResults(prev => prev.map(r => 
          r.name === 'Table Existence Test' 
            ? { 
                name: 'Table Existence Test', 
                status: tableExists ? 'success' : 'error', 
                message: tableExists 
                  ? 'Transactions table exists' 
                  : 'Transactions table not found',
                details: `Result: ${JSON.stringify(data)}`
              }
            : r
        ));
      }
    } catch (error) {
      console.error('Exception in table existence test:', error);
      const errorDetails = error instanceof Error 
        ? `${error.message}\n${error.stack || 'No stack trace'}`
        : JSON.stringify(error, null, 2);
        
      setConnectionResults(prev => prev.map(r => 
        r.name === 'Table Existence Test' 
          ? { 
              name: 'Table Existence Test', 
              status: 'error', 
              message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
              details: errorDetails
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

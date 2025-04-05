
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
      
      // Use a simpler query without table prefixes to avoid parsing issues
      const { data, error, status, statusText } = await supabase
        .from('transactions')
        .select('id')
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
      
      // Using direct URL string
      const supabaseURL = "https://vlkcnndgtarduplyedyp.supabase.co";
      
      // Try a simple health check
      const { data, error } = await supabase
        .from('_http_response')
        .select('*')
        .limit(1)
        .maybeSingle();
        
      console.log('Connection test response:', { data, error });
      
      // Fallback to fetch API if the above fails
      if (error) {
        // Try a direct health check using fetch
        const response = await fetch(`${supabaseURL}/rest/v1/`);
        
        console.log('Health check response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (!response.ok) {
          setConnectionResults(prev => prev.map(r => 
            r.name === 'Database Connection Test' 
              ? { 
                  name: 'Database Connection Test', 
                  status: 'error', 
                  message: 'Failed to connect to Supabase',
                  details: `Status: ${response.status} ${response.statusText}.\nYou may need to temporarily disable RLS or create a new Supabase project.`
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
      } else {
        // First query succeeded
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
              details: `${errorDetails}\nYou may need to temporarily disable RLS or create a new Supabase project.`
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
      
      // Use a simpler query to check if the table exists
      const { data, error } = await supabase
        .from('transactions')
        .select('id')
        .limit(1);
      
      console.log('Table existence check:', { data, error });
      
      if (error) {
        // Check if the error is due to RLS or table not existing
        const isRLSIssue = error.code === 'PGRST301' || error.message.includes('permission denied');
        const isTableMissing = error.code === 'PGRST204' || error.message.includes('does not exist');
        
        let userGuidance = '';
        if (isRLSIssue) {
          userGuidance = 'This may be due to Row Level Security (RLS) policies. Consider temporarily disabling RLS for testing.';
        } else if (isTableMissing) {
          userGuidance = 'The transactions table does not exist in your database. You may need to create it.';
        } else {
          userGuidance = 'You may need to check your Supabase project settings or create a new project.';
        }
        
        const errorDetails = JSON.stringify({
          message: error.message,
          code: error.code,
          details: error.details || {},
          guidance: userGuidance
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
        const tableExists = true; // If we got here without error, table exists
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
              details: `${errorDetails}\nYou may need to temporarily disable RLS or create a new Supabase project.`
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

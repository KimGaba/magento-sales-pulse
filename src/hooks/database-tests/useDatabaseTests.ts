
import { useState, useEffect } from 'react';
import { TestResult } from '@/types/database';
import { useConnectionTest } from './useConnectionTest';
import { useTransactionTest } from './useTransactionTest';

export const useDatabaseTests = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [supabaseInfo, setSupabaseInfo] = useState<string>('');

  // Import individual test hooks
  const { 
    connectionResults,
    isRunningConnection,
    runConnectionTests,
    testTableExistence
  } = useConnectionTest();

  const {
    transactionResults,
    isRunningTransaction,
    runTransactionTests
  } = useTransactionTest();

  // Initialize Supabase info
  useEffect(() => {
    const url = "https://vlkcnndgtarduplyedyp.supabase.co";
    setSupabaseInfo(`Connected to: ${url}`);
  }, []);

  // Combine results from all test modules
  useEffect(() => {
    setResults([...connectionResults, ...transactionResults]);
  }, [connectionResults, transactionResults]);

  // Main function to run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    await runConnectionTests();
    await runTransactionTests();
    
    setIsRunning(false);
  };

  return {
    results,
    isRunning: isRunning || isRunningConnection || isRunningTransaction,
    supabaseInfo,
    runAllTests,
    testTableExistence
  };
};

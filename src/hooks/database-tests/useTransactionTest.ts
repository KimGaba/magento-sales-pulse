
import { useState } from 'react';
import { TestResult } from '@/types/database';
import { getTransactionCount, fetchTransactionData } from '@/services/transactionService';

export const useTransactionTest = () => {
  const [transactionResults, setTransactionResults] = useState<TestResult[]>([]);
  const [isRunningTransaction, setIsRunningTransaction] = useState(false);

  const runTransactionCountTest = async () => {
    try {
      setTransactionResults(prev => [...prev, { 
        name: 'Transaction Count Test', 
        status: 'pending', 
        message: 'Counting transactions...' 
      }]);
      
      console.log('Running transaction count test...');
      const count = await getTransactionCount();
      console.log('Transaction count result:', count);
      
      setTransactionResults(prev => prev.map(r => 
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
      setTransactionResults(prev => prev.map(r => 
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
      setTransactionResults(prev => [...prev, { 
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
      const transactions = await fetchTransactionData(fromDate, toDate);
      console.log(`Retrieved ${transactions.length} transactions`);
      
      if (transactions.length > 0) {
        console.log('Sample transaction:', transactions[0]);
      }
      
      setTransactionResults(prev => prev.map(r => 
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
      setTransactionResults(prev => prev.map(r => 
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

  const runTransactionTests = async () => {
    setIsRunningTransaction(true);
    setTransactionResults([]);
    
    await runTransactionCountTest();
    await runFetchTransactionsTest();
    
    setIsRunningTransaction(false);
  };

  return {
    transactionResults,
    isRunningTransaction,
    runTransactionTests
  };
};

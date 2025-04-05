
import React, { useState } from 'react';
import { format, subMonths } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { fetchTransactionData } from '@/services/transactionService';
import { Skeleton } from '@/components/ui/skeleton';
import RepeatRateCard from '@/components/repeat-purchase/RepeatRateCard';
import CustomersPieChart from '@/components/repeat-purchase/CustomersPieChart';
import TopCustomersTable from '@/components/repeat-purchase/TopCustomersTable';
import { calculateRepeatPurchaseRate } from '@/utils/repeatPurchaseCalculator';
import { Transaction } from '@/types/database';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RepeatPurchaseRate = () => {
  const { translations } = useLanguage();
  const t = translations.repeatPurchase;
  const [selectedMonths, setSelectedMonths] = useState("3");
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const today = new Date();
  const fromDate = format(subMonths(today, parseInt(selectedMonths)), 'yyyy-MM-dd');
  const toDate = format(today, 'yyyy-MM-dd');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions', fromDate, toDate],
    queryFn: async () => {
      try {
        const result = await fetchTransactionData(fromDate, toDate);
        return result;
      } catch (fetchError) {
        console.error('Error in transaction query:', fetchError);
        toast({
          title: "Error loading data",
          description: "Failed to load transaction data. Please try again.",
          variant: "destructive"
        });
        return [];
      }
    },
    retry: 1, // Only retry once to avoid spamming the server with failed requests
  });

  // Ensure we always have an array of transactions
  const transactions: Transaction[] = data || [];
  
  const currentPeriodData = calculateRepeatPurchaseRate(
    transactions as any, // Type casting here to satisfy the utility function
    parseInt(selectedMonths)
  );
  
  const pieChartData = [
    { name: t.customersWithRepeat, value: currentPeriodData.repeatCustomers },
    { name: t.totalCustomers, value: currentPeriodData.totalCustomers - currentPeriodData.repeatCustomers }
  ];
  
  const tableDescription = `${t.months3.toLowerCase().replace('sidste', '').trim()} ${t.months6.split(' ')[1].toLowerCase()}`;
  
  const handleRetry = () => {
    refetch();
  };

  // Create month options for the dropdown
  const monthOptions = [
    { value: "3", label: t.months3 },
    { value: "6", label: t.months6 },
    { value: "12", label: t.months12 },
    { value: "18", label: t.months18 },
    { value: "24", label: t.months24 },
  ];
  
  return (
    <Layout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{t.title}</h1>
        <p className="text-gray-500 text-sm md:text-base">{t.subtitle}</p>
      </div>
      
      <Card className="mb-4 md:mb-6">
        <CardHeader className="py-4 md:py-6">
          <CardTitle className="text-xl md:text-2xl">{t.description}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full max-w-xs mb-6">
            <Select value={selectedMonths} onValueChange={setSelectedMonths}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : error ? (
            <div className="text-center p-4 md:p-6">
              <div className="text-red-500 mb-4">
                {error instanceof Error ? error.message : "An error occurred while fetching data"}
              </div>
              <button 
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : transactions?.length === 0 ? (
            <div className="text-center p-4 md:p-6 text-gray-500">
              {t.noData}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-1">
                  <RepeatRateCard
                    repeatRate={currentPeriodData.repeatRate}
                    repeatCustomers={currentPeriodData.repeatCustomers}
                    totalCustomers={currentPeriodData.totalCustomers}
                    title={t.repeatRate}
                    customersWithRepeatLabel={t.customersWithRepeat}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <CustomersPieChart
                    chartData={pieChartData}
                    title={t.customersWithRepeat}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {!isLoading && !error && transactions?.length > 0 && currentPeriodData.topCustomers.length > 0 && (
        <TopCustomersTable
          customers={currentPeriodData.topCustomers}
          title={t.topReturningCustomers}
          description={tableDescription}
          labels={{
            customerEmail: t.customerEmail,
            purchaseCount: t.purchaseCount,
            totalSpent: t.totalSpent,
            lastPurchase: t.lastPurchase
          }}
        />
      )}
    </Layout>
  );
};

export default RepeatPurchaseRate;

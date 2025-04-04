
import React, { useState } from 'react';
import { format, subMonths } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { fetchTransactionData } from '@/services/transactionService';
import { Skeleton } from '@/components/ui/skeleton';
import RepeatRateCard from '@/components/repeat-purchase/RepeatRateCard';
import CustomersPieChart from '@/components/repeat-purchase/CustomersPieChart';
import TopCustomersTable from '@/components/repeat-purchase/TopCustomersTable';
import { calculateRepeatPurchaseRate, Transaction } from '@/utils/repeatPurchaseCalculator';
import { useIsMobile } from '@/hooks/use-mobile';

const RepeatPurchaseRate = () => {
  const { translations } = useLanguage();
  const t = translations.repeatPurchase;
  const [activeTab, setActiveTab] = useState("3");
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Calculate date ranges for the query
  const today = new Date();
  const fromDate = format(subMonths(today, parseInt(activeTab)), 'yyyy-MM-dd');
  const toDate = format(today, 'yyyy-MM-dd');

  // Fetch transaction data
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions', fromDate, toDate],
    queryFn: () => fetchTransactionData(fromDate, toDate),
  });

  // Calculate data for current active tab
  // Ensure we only pass valid transaction data to the calculator
  const currentPeriodData = calculateRepeatPurchaseRate(
    (transactions || []) as Transaction[], 
    parseInt(activeTab)
  );
  
  // Prepare data for pie chart
  const pieChartData = [
    { name: t.customersWithRepeat, value: currentPeriodData.repeatCustomers },
    { name: t.totalCustomers, value: currentPeriodData.totalCustomers - currentPeriodData.repeatCustomers }
  ];
  
  // Description for top customers table
  const tableDescription = `${t.months3.toLowerCase().replace('sidste', '').trim()} ${t.months6.split(' ')[1].toLowerCase()}`;
  
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
          <Tabs defaultValue="3" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 md:mb-6 w-full overflow-x-auto flex-nowrap no-scrollbar">
              <TabsTrigger className="flex-shrink-0 px-2 md:px-4" value="3">{t.months3}</TabsTrigger>
              <TabsTrigger className="flex-shrink-0 px-2 md:px-4" value="6">{t.months6}</TabsTrigger>
              <TabsTrigger className="flex-shrink-0 px-2 md:px-4" value="12">{t.months12}</TabsTrigger>
              <TabsTrigger className="flex-shrink-0 px-2 md:px-4" value="18">{t.months18}</TabsTrigger>
              <TabsTrigger className="flex-shrink-0 px-2 md:px-4" value="24">{t.months24}</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[200px] w-full" />
                </div>
              ) : error ? (
                <div className="text-center p-4 md:p-6 text-red-500">
                  {translations.common.error}: {error.message}
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
            </TabsContent>
          </Tabs>
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

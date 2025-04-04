
import React, { useState } from 'react';
import { format, subMonths } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { fetchTransactionData } from '@/services/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import RepeatRateCard from '@/components/repeat-purchase/RepeatRateCard';
import CustomersPieChart from '@/components/repeat-purchase/CustomersPieChart';
import TopCustomersTable from '@/components/repeat-purchase/TopCustomersTable';
import { calculateRepeatPurchaseRate } from '@/utils/repeatPurchaseCalculator';

const RepeatPurchaseRate = () => {
  const { translations } = useLanguage();
  const t = translations.repeatPurchase;
  const [activeTab, setActiveTab] = useState("3");
  const { user } = useAuth();
  
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
  const currentPeriodData = calculateRepeatPurchaseRate(transactions, parseInt(activeTab));
  
  // Prepare data for pie chart
  const pieChartData = [
    { name: t.customersWithRepeat, value: currentPeriodData.repeatCustomers },
    { name: t.totalCustomers, value: currentPeriodData.totalCustomers - currentPeriodData.repeatCustomers }
  ];
  
  // Description for top customers table
  const tableDescription = `${t.months3.toLowerCase().replace('sidste', '').trim()} ${t.months6.split(' ')[1].toLowerCase()}`;
  
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
        <p className="text-gray-500">{t.subtitle}</p>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t.description}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="3" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="3">{t.months3}</TabsTrigger>
              <TabsTrigger value="6">{t.months6}</TabsTrigger>
              <TabsTrigger value="12">{t.months12}</TabsTrigger>
              <TabsTrigger value="18">{t.months18}</TabsTrigger>
              <TabsTrigger value="24">{t.months24}</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[200px] w-full" />
                </div>
              ) : error ? (
                <div className="text-center p-6 text-red-500">
                  {translations.common.error}: {error.message}
                </div>
              ) : transactions?.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                  {t.noData}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <RepeatRateCard
                      repeatRate={currentPeriodData.repeatRate}
                      repeatCustomers={currentPeriodData.repeatCustomers}
                      totalCustomers={currentPeriodData.totalCustomers}
                      title={t.repeatRate}
                      customersWithRepeatLabel={t.customersWithRepeat}
                    />
                  </div>
                  
                  <div className="lg:col-span-2">
                    <CustomersPieChart
                      chartData={pieChartData}
                      title={t.customersWithRepeat}
                    />
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

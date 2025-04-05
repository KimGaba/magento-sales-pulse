
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import TopCustomersTable from '@/components/repeat-purchase/TopCustomersTable';
import RepeatPurchaseTrendChart from '@/components/repeat-purchase/RepeatPurchaseTrendChart';
import PeriodSelector from '@/components/repeat-purchase/PeriodSelector';
import LoadingErrorContent from '@/components/repeat-purchase/LoadingErrorContent';
import RepeatPurchaseOverview from '@/components/repeat-purchase/RepeatPurchaseOverview';
import { useRepeatPurchaseData } from '@/hooks/useRepeatPurchaseData';

const RepeatPurchaseRate = () => {
  const { translations } = useLanguage();
  const t = translations.repeatPurchase;
  const [selectedMonths, setSelectedMonths] = useState("3");
  const { user } = useAuth();
  
  // Use our custom hook to fetch and process data
  const {
    currentPeriodData,
    monthlyTrendData,
    isLoading,
    error,
    isAllDataLoading,
    allDataError,
    handleRetry,
    transactions
  } = useRepeatPurchaseData(selectedMonths);

  // Create month options for the dropdown
  const monthOptions = [
    { value: "3", label: t.months3 },
    { value: "6", label: t.months6 },
    { value: "12", label: t.months12 },
    { value: "18", label: t.months18 },
    { value: "24", label: t.months24 },
  ];
  
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
          <PeriodSelector
            selectedMonths={selectedMonths}
            setSelectedMonths={setSelectedMonths}
            monthOptions={monthOptions}
          />
          
          {isLoading ? (
            <LoadingErrorContent 
              isLoading={isLoading} 
              error={error} 
              handleRetry={handleRetry} 
              noDataMessage={t.noData} 
            />
          ) : error ? (
            <LoadingErrorContent 
              isLoading={isLoading} 
              error={error} 
              handleRetry={handleRetry} 
              noDataMessage={t.noData} 
            />
          ) : transactions?.length === 0 ? (
            <div className="text-center p-4 md:p-6 text-gray-500">
              {t.noData}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              <RepeatPurchaseOverview
                repeatRate={currentPeriodData.repeatRate}
                repeatCustomers={currentPeriodData.repeatCustomers}
                totalCustomers={currentPeriodData.totalCustomers}
                title={t.repeatRate}
                customersWithRepeatLabel={t.customersWithRepeat}
                totalCustomersLabel={t.totalCustomers}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {!isAllDataLoading && !allDataError && monthlyTrendData?.length > 0 && (
        <div className="mb-6">
          <RepeatPurchaseTrendChart 
            data={monthlyTrendData}
            title={t.trendChartTitle || "Genkøbsfrekvens Trend"}
            description={t.trendChartDescription || "Månedlig genkøbsfrekvens beregnet over 12 måneder periode"}
          />
        </div>
      )}
      
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

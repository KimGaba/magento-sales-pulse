
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import PeriodSelector from '@/components/repeat-purchase/PeriodSelector';
import LoadingErrorContent from '@/components/repeat-purchase/LoadingErrorContent';
import BasketOpenerTable from '@/components/basket-opener/BasketOpenerTable';
import { useBasketOpenerData } from '@/hooks/useBasketOpenerData';

const BasketOpeners = () => {
  // Get translations
  const { translations } = useLanguage();
  const t = translations.basketOpeners || {
    title: "Kurv Åbnere",
    subtitle: "Analyser hvilke produkter der oftest lægges først i kurven",
    description: "Få indsigt i hvilke produkter der oftest starter en købsrejse",
    months3: "Sidste 3 måneder",
    months6: "Sidste 6 måneder",
    months12: "Sidste 12 måneder",
    months18: "Sidste 18 måneder",
    months24: "Sidste 24 måneder",
    noData: "Ingen data fundet for den valgte periode",
    tableTitle: "Top Kurv Åbnere",
    tableDescription: "Produkter der oftest lægges først i kurven",
    productName: "Produkt",
    openerScore: "Åbner Score",
    openerCount: "Antal gange som åbner",
    totalAppearances: "Total antal forekomster"
  };
  
  const [selectedMonths, setSelectedMonths] = useState("3");
  const { user } = useAuth();
  
  // Use our custom hook to fetch and process data
  const {
    products,
    isLoading,
    error,
    handleRetry
  } = useBasketOpenerData(selectedMonths);

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
          ) : products.length === 0 ? (
            <div className="text-center p-4 md:p-6 text-gray-500">
              {t.noData}
            </div>
          ) : (
            <BasketOpenerTable
              products={products}
              title={t.tableTitle}
              description={t.tableDescription}
              labels={{
                productName: t.productName,
                openerScore: t.openerScore,
                openerCount: t.openerCount,
                totalAppearances: t.totalAppearances
              }}
            />
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default BasketOpeners;

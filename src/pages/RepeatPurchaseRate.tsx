
import React, { useState } from 'react';
import { format, subMonths } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { fetchTransactionData } from '@/services/supabase';
import { Skeleton } from '@/components/ui/skeleton';

// Type definitions
type RepeatPurchaseData = {
  period: number; // Number of months
  repeatCustomers: number;
  totalCustomers: number;
  repeatRate: number;
  topCustomers: {
    email: string;
    purchases: number;
    totalSpent: number;
    lastPurchase: string;
  }[];
};

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

  // Function to calculate repeat purchase rate
  const calculateRepeatPurchaseRate = (months: number): RepeatPurchaseData => {
    if (!transactions || transactions.length ===, 0) {
      return {
        period: months,
        repeatCustomers: 0,
        totalCustomers: 0,
        repeatRate: 0,
        topCustomers: []
      };
    }

    // Group transactions by customer
    const customerPurchases = transactions.reduce((acc, transaction) => {
      const customerId = transaction.customer_id || 'unknown';
      if (!acc[customerId]) {
        acc[customerId] = {
          purchases: 0,
          totalSpent: 0,
          lastPurchase: '',
          transactions: []
        };
      }
      
      acc[customerId].purchases += 1;
      acc[customerId].totalSpent += transaction.amount;
      
      // Track last purchase date
      const txDate = new Date(transaction.transaction_date);
      if (!acc[customerId].lastPurchase || txDate > new Date(acc[customerId].lastPurchase)) {
        acc[customerId].lastPurchase = transaction.transaction_date;
      }
      
      acc[customerId].transactions.push(transaction);
      
      return acc;
    }, {} as Record<string, {
      purchases: number;
      totalSpent: number;
      lastPurchase: string;
      transactions: any[];
    }>);
    
    // Count total unique customers and repeat customers
    const totalCustomers = Object.keys(customerPurchases).length;
    const repeatCustomers = Object.values(customerPurchases).filter(
      customer => customer.purchases > 1
    ).length;
    
    // Calculate repeat rate
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
    
    // Get top returning customers (sorted by purchase count)
    const topCustomers = Object.entries(customerPurchases)
      .map(([customerId, data]) => ({
        email: customerId === 'unknown' ? 'Guest Customer' : customerId,
        purchases: data.purchases,
        totalSpent: data.totalSpent,
        lastPurchase: data.lastPurchase
      }))
      .filter(customer => customer.purchases > 1)
      .sort((a, b) => b.purchases - a.purchases)
      .slice(0, 5);
    
    return {
      period: months,
      repeatCustomers,
      totalCustomers,
      repeatRate,
      topCustomers
    };
  };

  // Calculate data for current active tab
  const currentPeriodData = calculateRepeatPurchaseRate(parseInt(activeTab));
  
  // Prepare data for pie chart
  const pieChartData = [
    { name: t.customersWithRepeat, value: currentPeriodData.repeatCustomers },
    { name: t.totalCustomers, value: currentPeriodData.totalCustomers - currentPeriodData.repeatCustomers }
  ];
  
  const COLORS = ['#0F52BA', '#CCCCCC'];
  
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
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">{t.repeatRate}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center">
                        <div className="text-5xl font-bold text-magento-600 mb-2">
                          {currentPeriodData.repeatRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">
                          {currentPeriodData.repeatCustomers} / {currentPeriodData.totalCustomers} {t.customersWithRepeat}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">{t.customersWithRepeat}</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, '']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {!isLoading && !error && transactions?.length > 0 && currentPeriodData.topCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.topReturningCustomers}</CardTitle>
            <CardDescription>
              {t.months3.toLowerCase().replace('sidste', '').trim()} {t.months6.split(' ')[1].toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.customerEmail}</TableHead>
                  <TableHead className="text-right">{t.purchaseCount}</TableHead>
                  <TableHead className="text-right">{t.totalSpent}</TableHead>
                  <TableHead>{t.lastPurchase}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPeriodData.topCustomers.map((customer, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{customer.email}</TableCell>
                    <TableCell className="text-right">{customer.purchases}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(customer.totalSpent)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(customer.lastPurchase), 'dd/MM/yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
};

export default RepeatPurchaseRate;

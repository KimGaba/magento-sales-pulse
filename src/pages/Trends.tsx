
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, TrendingDown, BarChart } from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { fetchTrendsData, fetchCategorySalesData } from '@/services/trendsService';
import { useTrendsFilters } from '@/hooks/useTrendsFilters';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useLanguage } from '@/i18n/LanguageContext';

const Trends = () => {
  const { 
    timeFilter, 
    setTimeFilter, 
    dateRange, 
    selectedStoreIds, 
    customerGroup,
    orderStatuses 
  } = useTrendsFilters();
  
  const { translations } = useLanguage();
  
  // Fetch sales trend data
  const { 
    data: salesData = [], 
    isLoading: isLoadingSales,
    error: salesError
  } = useQuery({
    queryKey: ['trendsData', selectedStoreIds, dateRange.fromDate, dateRange.toDate, customerGroup, orderStatuses],
    queryFn: () => fetchTrendsData({
      storeIds: selectedStoreIds,
      fromDate: dateRange.fromDate,
      toDate: dateRange.toDate,
      customerGroup,
      orderStatuses
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch category sales data
  const { 
    data: categoryData = [], 
    isLoading: isLoadingCategories,
    error: categoryError
  } = useQuery({
    queryKey: ['categorySales', selectedStoreIds, dateRange.fromDate, dateRange.toDate],
    queryFn: () => fetchCategorySalesData({
      storeIds: selectedStoreIds,
      fromDate: dateRange.fromDate,
      toDate: dateRange.toDate
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Show errors as toasts
  React.useEffect(() => {
    if (salesError) {
      toast.error('Fejl ved hentning af salgsdata');
      console.error(salesError);
    }
    if (categoryError) {
      toast.error('Fejl ved hentning af kategoridata');
      console.error(categoryError);
    }
  }, [salesError, categoryError]);
  
  // Transform sales data for the chart
  const monthlySalesData = useMemo(() => {
    if (!salesData.length) return [];
    
    // Process and map the data from the API to the format needed for the chart
    // This is a placeholder - in a real app this would transform the actual API data
    return [
      { name: 'Jan', sales: 4000, orders: 160, avg: 25 },
      { name: 'Feb', sales: 3000, orders: 130, avg: 23 },
      { name: 'Mar', sales: 5000, orders: 190, avg: 26 },
      { name: 'Apr', sales: 2780, orders: 120, avg: 23 },
      { name: 'Maj', sales: 1890, orders: 80, avg: 24 },
      { name: 'Jun', sales: 2390, orders: 110, avg: 22 },
      { name: 'Jul', sales: 3490, orders: 140, avg: 25 },
      { name: 'Aug', sales: 3400, orders: 130, avg: 26 },
      { name: 'Sep', sales: 4100, orders: 150, avg: 27 },
      { name: 'Okt', sales: 4500, orders: 170, avg: 26 },
      { name: 'Nov', sales: 4700, orders: 180, avg: 26 },
      { name: 'Dec', sales: 6000, orders: 230, avg: 26 },
    ];
  }, [salesData]);
  
  // Handle time filter changes
  const handleTimeFilterChange = (filter: string) => {
    setTimeFilter(filter as any);
  };
  
  // Render loading state
  if (isLoadingSales || isLoadingCategories) {
    return (
      <Layout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Salgstrends</h1>
          <p className="text-gray-500">Indlæser data...</p>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="h-96 bg-gray-100 rounded"></CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Salgstrends</h1>
        <p className="text-gray-500">Analyse af dine salgstrends over tid</p>
      </div>
      
      <div className="flex justify-end mb-4 space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleTimeFilterChange('7d')}
          className={timeFilter === '7d' ? "bg-magento-600 text-white hover:bg-magento-700" : ""}
        >
          7 dage
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleTimeFilterChange('30d')}
          className={timeFilter === '30d' ? "bg-magento-600 text-white hover:bg-magento-700" : ""}
        >
          30 dage
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleTimeFilterChange('1y')}
          className={timeFilter === '1y' ? "bg-magento-600 text-white hover:bg-magento-700" : ""}
        >
          1 år
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleTimeFilterChange('all')}
          className={timeFilter === 'all' ? "bg-magento-600 text-white hover:bg-magento-700" : ""}
        >
          Alle
        </Button>
      </div>
      
      {/* Key Metric Trends */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Salgstrends over tid</CardTitle>
          <CardDescription>Omsætning, ordrer og gennemsnitskurv for de seneste 12 måneder</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={monthlySalesData} 
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'sales') return formatCurrency(Number(value));
                  return value;
                }} 
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="sales" 
                name="Omsætning (kr)" 
                stroke="#0F52BA" 
                strokeWidth={2} 
                dot={{ r: 3 }} 
                isAnimationActive={monthlySalesData.length < 30} // Disable animations for large datasets
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="orders" 
                name="Antal ordrer" 
                stroke="#4CAF50" 
                strokeWidth={2}
                dot={{ r: 3 }} 
                isAnimationActive={monthlySalesData.length < 30}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avg" 
                name="Gns. ordreværdi" 
                stroke="#FF9800" 
                strokeWidth={2} 
                dot={{ r: 3 }} 
                isAnimationActive={monthlySalesData.length < 30}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Additional Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Salgstrend efter kategori</CardTitle>
            <CardDescription>De bedst sælgende produktkategorier</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={categoryData} 
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F52BA" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0F52BA" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value).replace('kr.', '')}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  name="Omsætning (kr)" 
                  stroke="#0F52BA" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  isAnimationActive={categoryData.length < 30} // Disable animations for large datasets
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Vigtige metrikker</CardTitle>
            <CardDescription>Sammenlignet med forrige periode</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">OMSÆTNINGSVÆKST</p>
                    <p className="text-2xl font-bold">+12.5%</p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Opadgående trend fortsætter</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">ORDREVÆKST</p>
                    <p className="text-2xl font-bold">+5.3%</p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Stabil stigning i ordrer</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">GNS. ORDREVÆRDI</p>
                    <p className="text-2xl font-bold">-2.1%</p>
                  </div>
                  <div className="bg-red-100 p-2 rounded-full">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Lille fald i kurvestørrelse</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">KONVERTERINGSRATE</p>
                    <p className="text-2xl font-bold">+0.5%</p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Forbedret konvertering</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Salgsindsigter</CardTitle>
          <CardDescription>Automatisk genererede indsigter baseret på dine data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-magento-600 p-4 rounded">
              <h4 className="font-semibold flex items-center">
                <Activity className="h-5 w-5 mr-2 text-magento-600" />
                Omsætningsvækst
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Din omsætning er steget med 12.5% sammenlignet med forrige periode. Denne vækst er primært drevet af stigende salg i kategorien "Tøj".
              </p>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-magento-600 p-4 rounded">
              <h4 className="font-semibold flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-magento-600" />
                Sæsontrend
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Der ses en tydelig sæsonmæssig stigning i december måned, som er 27.7% højere end gennemsnittet for året. Overvej at planlægge kampagner i god tid inden denne periode.
              </p>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-magento-600 p-4 rounded">
              <h4 className="font-semibold flex items-center">
                <TrendingDown className="h-5 w-5 mr-2 text-magento-600" />
                Opmærksomhedspunkt
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Gennemsnitlig ordreværdi er faldet med 2.1%. Det kan være værd at overveje kryds- og op-salgsmuligheder for at øge den gennemsnitlige indkøbskurv.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default Trends;

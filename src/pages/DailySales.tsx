import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, TrendingUp, TrendingDown, Loader2, Info, Database } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth, isSameMonth, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchDailySalesData, fetchAvailableDataMonths, fetchTransactionCount } from '@/services/salesService';
import { useToast } from '@/hooks/use-toast';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.getDate().toString();
};

const DailySales = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  
  const fromDate = date ? format(startOfMonth(date), 'yyyy-MM-dd') : '';
  const toDate = date ? format(endOfMonth(date), 'yyyy-MM-dd') : '';

  const { data: transactionCount = 0, isLoading: isCountLoading } = useQuery({
    queryKey: ['transactionCount'],
    queryFn: () => fetchTransactionCount(),
  });

  const { data: availableMonths = [], isLoading: isLoadingMonths } = useQuery({
    queryKey: ['availableMonths'],
    queryFn: () => fetchAvailableDataMonths(),
  });

  const { data: salesData = [], isLoading, error } = useQuery({
    queryKey: ['dailySales', fromDate, toDate],
    queryFn: () => fetchDailySalesData(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  });

  const dailySalesData = React.useMemo(() => {
    if (!salesData || salesData.length === 0) return [];
    
    return salesData.map(item => ({
      day: formatDate(item.date),
      sales: item.total_sales,
      orders: item.order_count,
      date: item.date
    })).sort((a, b) => parseInt(a.day) - parseInt(b.day));
  }, [salesData]);

  const hourlyData = [
    { hour: '00-02', sales: 200, orders: 2 },
    { hour: '02-04', sales: 100, orders: 1 },
    { hour: '04-06', sales: 50, orders: 1 },
    { hour: '06-08', sales: 300, orders: 4 },
    { hour: '08-10', sales: 700, orders: 8 },
    { hour: '10-12', sales: 1200, orders: 15 },
    { hour: '12-14', sales: 1500, orders: 18 },
    { hour: '14-16', sales: 1300, orders: 16 },
    { hour: '16-18', sales: 1100, orders: 14 },
    { hour: '18-20', sales: 900, orders: 10 },
    { hour: '20-22', sales: 600, orders: 7 },
    { hour: '22-24', sales: 400, orders: 5 },
  ];

  const topPerformers = React.useMemo(() => {
    if (!dailySalesData.length) return [];
    
    const sortedData = [...dailySalesData].sort((a, b) => b.sales - a.sales).slice(0, 3);
    
    return sortedData.map(day => {
      const dayDate = new Date(day.date);
      const dayName = format(dayDate, 'EEEE');
      const formattedDate = format(dayDate, 'd. MMM');
      
      const change = "+15%"; 
      
      return {
        day: dayName,
        date: formattedDate,
        sales: day.sales,
        change
      };
    });
  }, [dailySalesData]);

  const metrics = React.useMemo(() => {
    if (!dailySalesData.length) return { avgSales: 0, avgOrders: 0, bestDay: { day: '', date: '', sales: 0 } };
    
    const totalSales = dailySalesData.reduce((sum, day) => sum + day.sales, 0);
    const totalOrders = dailySalesData.reduce((sum, day) => sum + day.orders, 0);
    const bestDay = [...dailySalesData].sort((a, b) => b.sales - a.sales)[0];
    
    return {
      avgSales: totalSales / dailySalesData.length,
      avgOrders: totalOrders / dailySalesData.length,
      bestDay: {
        day: format(new Date(bestDay.date), 'EEEE'),
        date: format(new Date(bestDay.date), 'd'),
        sales: bestDay.sales
      }
    };
  }, [dailySalesData]);

  const hasDataForMonth = (day: Date) => {
    return availableMonths.some(availMonth => isSameMonth(availMonth, day));
  };

  if (error) {
    toast({
      title: "Error fetching sales data",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive"
    });
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dagligt Salg</h1>
        <p className="text-gray-500">Detaljer om dine daglige salgsresultater</p>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">Database Check</CardTitle>
          <Database className="h-5 w-5 text-magento-600" />
        </CardHeader>
        <CardContent>
          {isCountLoading ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking database...
            </div>
          ) : (
            <div>
              <p className="text-lg">
                Total transactions in database: <span className="font-bold">{transactionCount}</span>
              </p>
              {transactionCount === 0 && (
                <p className="text-sm text-red-500 mt-2">
                  No transactions found in the database. Please check your database connection or import some data.
                </p>
              )}
              {transactionCount > 0 && (
                <p className="text-sm text-green-500 mt-2">
                  Database connection is working and transactions are available!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-[240px] pl-3 text-left font-normal"
              >
                {date ? (
                  format(date, "MMMM yyyy")
                ) : (
                  <span>Vælg måned</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                modifiers={{
                  highlighted: hasDataForMonth
                }}
                modifiersClassNames={{
                  highlighted: "bg-green-100 font-bold"
                }}
              />
            </PopoverContent>
          </Popover>
          
          <UITooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Måneder med data er fremhævet med grøn. 
                {availableMonths.length > 0 ? (
                  <>
                    <br/>Data findes for: {availableMonths.map(m => format(m, 'MMM yyyy')).join(', ')}
                  </>
                ) : 'Ingen måneder har data endnu.'}
              </p>
            </TooltipContent>
          </UITooltip>

          {isLoadingMonths && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">Eksportér data</Button>
          <Button size="sm" className="bg-magento-600 hover:bg-magento-700">Print rapport</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">DAGLIG GNS. OMSÆTNING</CardTitle>
            <CalendarIcon className="h-4 w-4 text-magento-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Indlæser...
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.avgSales.toFixed(0)} kr</div>
                <p className="text-xs flex items-center text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" /> 
                  +8.3% fra forrige måned
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">DAGLIG GNS. ORDRER</CardTitle>
            <CalendarIcon className="h-4 w-4 text-magento-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Indlæser...
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.avgOrders.toFixed(1)}</div>
                <p className="text-xs flex items-center text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" /> 
                  +4.2% fra forrige måned
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">BEDSTE DAG I MÅNEDEN</CardTitle>
            <CalendarIcon className="h-4 w-4 text-magento-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Indlæser...
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.bestDay.day} {metrics.bestDay.date}.</div>
                <p className="text-xs flex items-center text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" /> 
                  {metrics.bestDay.sales} kr i omsætning
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Daglig omsætning</CardTitle>
          <CardDescription>
            Daglig omsætning for {date ? format(date, 'MMMM yyyy') : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-magento-600" />
            </div>
          ) : dailySalesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-500">Ingen data for den valgte periode</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" label={{ value: 'Dato i måneden', position: 'bottom', offset: 0 }} />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value} kr`, 'Omsætning']} />
                <Bar dataKey="sales" fill="#0F52BA">
                  {dailySalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.sales > 1500 ? '#0F52BA' : '#8EB9FF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Salgsoversigt efter tidspunkt</CardTitle>
            <CardDescription>Omsætning fordelt over dagen</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value} kr`, 'Omsætning']} />
                <Bar dataKey="sales" fill="#0F52BA" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Bedst præsterende dage</CardTitle>
            <CardDescription>De dage med højeste omsætning i måneden</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-magento-600" />
              </div>
            ) : topPerformers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40">
                <p className="text-gray-500">Ingen data for den valgte periode</p>
              </div>
            ) : (
              <div className="space-y-6">
                {topPerformers.map((day, index) => (
                  <div key={index} className="flex items-center">
                    <div className={cn(
                      "w-2 h-12 rounded-full mr-4",
                      index === 0 ? "bg-magento-600" : index === 1 ? "bg-magento-400" : "bg-magento-300"
                    )} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-semibold">{day.day}, {day.date}</p>
                        <p className="font-bold">{day.sales} kr</p>
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-sm text-gray-500">Omsætning</p>
                        <p className="text-sm text-green-600 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" /> 
                          {day.change}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">Indsigt:</p>
                  <p className="text-sm mt-1">
                    {topPerformers.length > 0 ? 
                      `${topPerformers[0].day} og ${topPerformers[1]?.day || '?'} er dine bedste salgsdage. Overvej at øge markedsføringsindsatsen og lagerbeholdningen på disse dage for at maksimere omsætningen.` :
                      'Ingen data for at generere indsigter.'
                    }
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Daglig opsummering</CardTitle>
          <CardDescription>Detaljeret overblik over salg per dag</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-magento-600" />
            </div>
          ) : dailySalesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-gray-500">Ingen data for den valgte periode</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Dag</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Ordrer</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Omsætning</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Gns. ordreværdi</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Tendens</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySalesData.map((day, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">
                        {format(new Date(day.date), 'd. MMM')}
                      </td>
                      <td className="py-3 px-4">{day.orders}</td>
                      <td className="py-3 px-4">{day.sales} kr</td>
                      <td className="py-3 px-4">
                        {day.orders > 0 ? Math.round(day.sales / day.orders) : 0} kr
                      </td>
                      <td className="py-3 px-4">
                        {index > 0 && day.sales > dailySalesData[index - 1].sales ? (
                          <span className="flex items-center text-green-600">
                            <TrendingUp className="h-4 w-4 mr-1" /> Stigende
                          </span>
                        ) : index > 0 ? (
                          <span className="flex items-center text-red-600">
                            <TrendingDown className="h-4 w-4 mr-1" /> Faldende
                          </span>
                        ) : (
                          <span className="flex items-center text-gray-600">
                            - Baseline
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default DailySales;


import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Sample data for daily sales
const dailySalesData = [
  { day: '1', sales: 1200, orders: 15 },
  { day: '2', sales: 1500, orders: 18 },
  { day: '3', sales: 900, orders: 12 },
  { day: '4', sales: 1100, orders: 14 },
  { day: '5', sales: 2000, orders: 25 },
  { day: '6', sales: 1700, orders: 20 },
  { day: '7', sales: 800, orders: 10 },
  { day: '8', sales: 1300, orders: 17 },
  { day: '9', sales: 1600, orders: 19 },
  { day: '10', sales: 1400, orders: 16 },
  { day: '11', sales: 1800, orders: 22 },
  { day: '12', sales: 1350, orders: 15 },
  { day: '13', sales: 1250, orders: 14 },
  { day: '14', sales: 950, orders: 11 },
];

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

const topPerformers = [
  { day: "Tirsdag", date: "5. apr", sales: 2000, change: "+35%" },
  { day: "Søndag", date: "11. apr", sales: 1800, change: "+20%" },
  { day: "Fredag", date: "6. apr", sales: 1700, change: "+15%" },
];

const DailySales = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dagligt Salg</h1>
        <p className="text-gray-500">Detaljer om dine daglige salgsresultater</p>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
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
            />
          </PopoverContent>
        </Popover>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">Eksportér data</Button>
          <Button size="sm" className="bg-magento-600 hover:bg-magento-700">Print rapport</Button>
        </div>
      </div>
      
      {/* Daily Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">DAGLIG GNS. OMSÆTNING</CardTitle>
            <CalendarIcon className="h-4 w-4 text-magento-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.289 kr</div>
            <p className="text-xs flex items-center text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" /> 
              +8.3% fra forrige måned
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">DAGLIG GNS. ORDRER</CardTitle>
            <CalendarIcon className="h-4 w-4 text-magento-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15.5</div>
            <p className="text-xs flex items-center text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" /> 
              +4.2% fra forrige måned
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">BEDSTE DAG I MÅNEDEN</CardTitle>
            <CalendarIcon className="h-4 w-4 text-magento-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Tirsdag 5.</div>
            <p className="text-xs flex items-center text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" /> 
              2.000 kr i omsætning
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Daily Sales Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Daglig omsætning</CardTitle>
          <CardDescription>Daglig omsætning for april 2025</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" label={{ value: 'Dato i April', position: 'bottom', offset: 0 }} />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value} kr`, 'Omsætning']} />
              <Bar dataKey="sales" fill="#0F52BA">
                {dailySalesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.sales > 1500 ? '#0F52BA' : '#8EB9FF'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Additional Insights */}
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
                  Tirsdag og søndag er dine bedste salgsdage. Overvej at øge markedsføringsindsatsen og lagerbeholdningen på disse dage for at maksimere omsætningen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daglig opsummering</CardTitle>
          <CardDescription>Detaljeret overblik over salg per dag</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <td className="py-3 px-4 font-medium">April {day.day}</td>
                    <td className="py-3 px-4">{day.orders}</td>
                    <td className="py-3 px-4">{day.sales} kr</td>
                    <td className="py-3 px-4">{Math.round(day.sales / day.orders)} kr</td>
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
        </CardContent>
      </Card>
    </Layout>
  );
};

export default DailySales;

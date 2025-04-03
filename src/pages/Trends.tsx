
import React from 'react';
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

// Sample data for charts
const monthlySalesData = [
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

const categorySalesData = [
  { name: 'Tøj', sales: 12400 },
  { name: 'Sko', sales: 9200 },
  { name: 'Tilbehør', sales: 5600 },
  { name: 'Elektronik', sales: 4300 },
  { name: 'Hjem', sales: 3700 },
];

const Trends = () => {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Salgstrends</h1>
        <p className="text-gray-500">Analyse af dine salgstrends over tid</p>
      </div>
      
      <div className="flex justify-end mb-4 space-x-2">
        <Button variant="outline" size="sm">7 dage</Button>
        <Button variant="outline" size="sm">30 dage</Button>
        <Button variant="outline" size="sm" className="bg-magento-600 text-white hover:bg-magento-700">1 år</Button>
        <Button variant="outline" size="sm">Alle</Button>
      </div>
      
      {/* Key Metric Trends */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Salgstrends over tid</CardTitle>
          <CardDescription>Omsætning, ordrer og gennemsnitskurv for de seneste 12 måneder</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlySalesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="sales" 
                name="Omsætning (kr)" 
                stroke="#0F52BA" 
                strokeWidth={2} 
                dot={{ r: 3 }} 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="orders" 
                name="Antal ordrer" 
                stroke="#4CAF50" 
                strokeWidth={2}
                dot={{ r: 3 }} 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avg" 
                name="Gns. ordreværdi" 
                stroke="#FF9800" 
                strokeWidth={2} 
                dot={{ r: 3 }} 
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
              <AreaChart data={categorySalesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F52BA" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0F52BA" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  name="Omsætning (kr)" 
                  stroke="#0F52BA" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
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

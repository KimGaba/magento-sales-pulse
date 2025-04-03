
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, TrendingDown, BarChart, Database } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Sample data for charts
const salesData = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 5000 },
  { name: 'Apr', sales: 2780 },
  { name: 'Maj', sales: 1890 },
  { name: 'Jun', sales: 2390 },
  { name: 'Jul', sales: 3490 },
];

const productData = [
  { name: 'Product A', sales: 120 },
  { name: 'Product B', sales: 98 },
  { name: 'Product C', sales: 86 },
  { name: 'Product D', sales: 75 },
  { name: 'Product E', sales: 65 },
];

const Dashboard = () => {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-500">Velkommen til dit salgsoverblik</p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">TOTAL OMSÆTNING</CardTitle>
            <Activity className="h-4 w-4 text-magento-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142,384 kr</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> +12.5%
              </span>
              <span>sammenlignet med sidste måned</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">ANTAL ORDRER</CardTitle>
            <Database className="h-4 w-4 text-magento-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">243</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> +5.3%
              </span>
              <span>sammenlignet med sidste måned</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">GNS. ORDREVÆRDI</CardTitle>
            <BarChart className="h-4 w-4 text-magento-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">586 kr</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" /> -2.1%
              </span>
              <span>sammenlignet med sidste måned</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">KONVERTERINGSRATE</CardTitle>
            <TrendingUp className="h-4 w-4 text-magento-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.8%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> +0.5%
              </span>
              <span>sammenlignet med sidste måned</span>
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Omsætning over tid</CardTitle>
            <CardDescription>Udvikling i de seneste 7 måneder</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#0F52BA" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Bedst sælgende produkter</CardTitle>
            <CardDescription>Top 5 produkter efter salgsantal</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={productData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#0F52BA" />
              </ReBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Seneste ordrer</CardTitle>
          <CardDescription>De 5 seneste ordrer i din butik</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Ordre ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Kunde</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Dato</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Beløb</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm">#10024</td>
                  <td className="py-3 px-4 text-sm">Anders Jensen</td>
                  <td className="py-3 px-4 text-sm">3. apr 2025</td>
                  <td className="py-3 px-4 text-sm">1.245 kr</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Gennemført</span></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm">#10023</td>
                  <td className="py-3 px-4 text-sm">Maria Nielsen</td>
                  <td className="py-3 px-4 text-sm">2. apr 2025</td>
                  <td className="py-3 px-4 text-sm">860 kr</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Afsendt</span></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm">#10022</td>
                  <td className="py-3 px-4 text-sm">Lars Petersen</td>
                  <td className="py-3 px-4 text-sm">2. apr 2025</td>
                  <td className="py-3 px-4 text-sm">450 kr</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Behandles</span></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-sm">#10021</td>
                  <td className="py-3 px-4 text-sm">Sofie Hansen</td>
                  <td className="py-3 px-4 text-sm">1. apr 2025</td>
                  <td className="py-3 px-4 text-sm">1.780 kr</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Gennemført</span></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm">#10020</td>
                  <td className="py-3 px-4 text-sm">Mikkel Andersen</td>
                  <td className="py-3 px-4 text-sm">1. apr 2025</td>
                  <td className="py-3 px-4 text-sm">925 kr</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Gennemført</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default Dashboard;

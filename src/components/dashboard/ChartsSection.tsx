
import React from 'react';
import ChartCard from './ChartCard';
import { LineChart, Line, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

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

const ChartsSection: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 md:mb-8">
      <ChartCard 
        title="Omsætning over tid" 
        description="Udvikling i de seneste 7 måneder"
        height={isMobile ? "h-60" : "h-80"}
      >
        <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="sales" stroke="#0F52BA" strokeWidth={2} />
        </LineChart>
      </ChartCard>
      
      <ChartCard 
        title="Bedst sælgende produkter" 
        description="Top 5 produkter efter salgsantal"
        height={isMobile ? "h-60" : "h-80"}
      >
        <ReBarChart data={productData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="sales" fill="#0F52BA" />
        </ReBarChart>
      </ChartCard>
    </div>
  );
};

export default ChartsSection;


import React from 'react';
import MetricCard from './MetricCard';
import { Activity, Database, BarChart, TrendingUp } from 'lucide-react';

const MetricsSection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
      <MetricCard
        title="TOTAL OMSÆTNING"
        value="142,384 kr"
        percentageChange={12.5}
        icon={<Activity className="h-4 w-4" />}
      />
      
      <MetricCard
        title="ANTAL ORDRER"
        value="243"
        percentageChange={5.3}
        icon={<Database className="h-4 w-4" />}
      />
      
      <MetricCard
        title="GNS. ORDREVÆRDI"
        value="586 kr"
        percentageChange={-2.1}
        icon={<BarChart className="h-4 w-4" />}
      />
      
      <MetricCard
        title="KONVERTERINGSRATE"
        value="3.8%"
        percentageChange={0.5}
        icon={<TrendingUp className="h-4 w-4" />}
      />
    </div>
  );
};

export default MetricsSection;

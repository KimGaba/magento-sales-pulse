
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomersPieChartProps {
  chartData: Array<{
    name: string;
    value: number;
  }>;
  title: string;
}

const CustomersPieChart: React.FC<CustomersPieChartProps> = ({ chartData, title }) => {
  const COLORS = ['#0F52BA', '#CCCCCC'];
  const isMobile = useIsMobile();
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[220px] md:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={isMobile ? 60 : 80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => 
                isMobile 
                  ? `${(percent * 100).toFixed(0)}%` 
                  : `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, '']} />
            <Legend 
              layout={isMobile ? "horizontal" : "vertical"}
              verticalAlign={isMobile ? "bottom" : "middle"}
              align={isMobile ? "center" : "right"}
              wrapperStyle={isMobile ? { fontSize: '12px' } : { fontSize: '14px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CustomersPieChart;

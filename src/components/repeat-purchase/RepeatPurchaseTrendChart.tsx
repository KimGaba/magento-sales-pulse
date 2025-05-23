
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatPercentage } from '@/utils/formatters';
import { useLanguage } from '@/i18n/LanguageContext';

// Define the type for our data points
interface MonthlyRepeatRateDataPoint {
  month: string;
  displayMonth: string;
  repeatRate: number;
}

interface RepeatPurchaseTrendChartProps {
  data: MonthlyRepeatRateDataPoint[];
  title: string;
  description: string;
}

const RepeatPurchaseTrendChart: React.FC<RepeatPurchaseTrendChartProps> = ({
  data,
  title,
  description
}) => {
  const { translations } = useLanguage();
  
  // Log the received data for debugging purposes (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log("Trend chart data:", data);
  }
  
  // Memoize the chart data to avoid unnecessary recalculations
  const chartData = useMemo(() => data || [], [data]);
  
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-gray-500">{translations.repeatPurchase.noData}</p>
        </CardContent>
      </Card>
    );
  }

  // Custom tooltip component with memoization for better performance
  const CustomTooltip = React.memo(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
          <p className="font-semibold">{`${label}`}</p>
          <p className="text-magento-600">
            {translations.repeatPurchase.repeatRate}: {formatPercentage(payload[0].value)}
          </p>
          <p className="text-xs text-gray-500">
            12 måneder indtil denne måned
          </p>
        </div>
      );
    }
    return null;
  });
  
  // Ensure the component name is set for better debugging
  CustomTooltip.displayName = 'CustomTooltip';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-xl">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="displayMonth" 
              tickMargin={10}
            />
            <YAxis 
              domain={[0, 100]}
              tickFormatter={(value) => formatPercentage(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="repeatRate" 
              stroke="#C41E3A" 
              strokeWidth={2}
              name={translations.repeatPurchase.repeatRate}
              dot={{ r: 4 }}
              activeDot={{ r: 6, stroke: '#C41E3A', strokeWidth: 2 }}
              isAnimationActive={chartData.length < 30} // Disable animations for large datasets
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default React.memo(RepeatPurchaseTrendChart);

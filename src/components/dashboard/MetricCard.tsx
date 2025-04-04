
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  percentageChange: number;
  icon: React.ReactNode;
  comparisonText?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  percentageChange,
  icon,
  comparisonText = "sammenlignet med sidste måned"
}) => {
  const isPositive = percentageChange >= 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <div className="text-magento-600">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl md:text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          <span className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}{' '}
            {isPositive ? '+' : ''}{percentageChange}%
          </span>
          <span>{comparisonText}</span>
        </p>
      </CardContent>
    </Card>
  );
};

export default MetricCard;

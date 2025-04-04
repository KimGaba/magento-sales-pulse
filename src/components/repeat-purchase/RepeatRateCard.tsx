
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RepeatRateCardProps {
  repeatRate: number;
  repeatCustomers: number;
  totalCustomers: number;
  title: string;
  customersWithRepeatLabel: string;
}

const RepeatRateCard: React.FC<RepeatRateCardProps> = ({
  repeatRate,
  repeatCustomers,
  totalCustomers,
  title,
  customersWithRepeatLabel
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="text-4xl md:text-5xl font-bold text-magento-600 mb-1 md:mb-2">
          {repeatRate.toFixed(1)}%
        </div>
        <div className="text-xs md:text-sm text-gray-500 text-center">
          {repeatCustomers} / {totalCustomers} {customersWithRepeatLabel}
        </div>
      </CardContent>
    </Card>
  );
};

export default RepeatRateCard;

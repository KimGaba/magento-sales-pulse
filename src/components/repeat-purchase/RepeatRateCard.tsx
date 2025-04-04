
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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="text-5xl font-bold text-magento-600 mb-2">
          {repeatRate.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-500">
          {repeatCustomers} / {totalCustomers} {customersWithRepeatLabel}
        </div>
      </CardContent>
    </Card>
  );
};

export default RepeatRateCard;

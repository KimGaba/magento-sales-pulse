
import React from 'react';
import RepeatRateCard from '@/components/repeat-purchase/RepeatRateCard';
import CustomersPieChart from '@/components/repeat-purchase/CustomersPieChart';

interface RepeatPurchaseOverviewProps {
  repeatRate: number;
  repeatCustomers: number;
  totalCustomers: number;
  title: string;
  customersWithRepeatLabel: string;
  totalCustomersLabel: string;
}

const RepeatPurchaseOverview: React.FC<RepeatPurchaseOverviewProps> = ({
  repeatRate,
  repeatCustomers,
  totalCustomers,
  title,
  customersWithRepeatLabel,
  totalCustomersLabel
}) => {
  const pieChartData = [
    { name: customersWithRepeatLabel, value: repeatCustomers },
    { name: totalCustomersLabel, value: totalCustomers - repeatCustomers }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <div className="md:col-span-1">
        <RepeatRateCard
          repeatRate={repeatRate}
          repeatCustomers={repeatCustomers}
          totalCustomers={totalCustomers}
          title={title}
          customersWithRepeatLabel={customersWithRepeatLabel}
        />
      </div>
      
      <div className="md:col-span-2">
        <CustomersPieChart
          chartData={pieChartData}
          title={customersWithRepeatLabel}
        />
      </div>
    </div>
  );
};

export default RepeatPurchaseOverview;

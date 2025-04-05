
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PeriodSelectorProps {
  selectedMonths: string;
  setSelectedMonths: (value: string) => void;
  monthOptions: Array<{ value: string; label: string }>;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedMonths,
  setSelectedMonths,
  monthOptions
}) => {
  return (
    <div className="w-full max-w-xs mb-6">
      <Select value={selectedMonths} onValueChange={setSelectedMonths}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PeriodSelector;

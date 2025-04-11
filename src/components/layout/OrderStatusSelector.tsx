
import React, { useState, useEffect } from 'react';
import { useFilter } from '@/context/FilterContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckSquare } from 'lucide-react';
import { fetchOrderStatuses } from '@/services/magentoService';

interface OrderStatusSelectorProps {
  className?: string;
}

const OrderStatusSelector: React.FC<OrderStatusSelectorProps> = ({ className }) => {
  const { orderStatuses, setOrderStatusFilter } = useFilter();
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Load available order statuses from all connected stores
  useEffect(() => {
    const loadOrderStatuses = async () => {
      try {
        setLoading(true);
        const statuses = await fetchOrderStatuses();
        setAvailableStatuses(statuses);
        
        // Initialize with all selected if nothing is set yet
        if (Object.keys(orderStatuses).length === 0) {
          const initialStatuses = statuses.reduce((acc, status) => {
            acc[status] = true;
            return acc;
          }, {} as Record<string, boolean>);
          setSelectedStatuses(initialStatuses);
          setOrderStatusFilter(initialStatuses);
        } else {
          setSelectedStatuses(orderStatuses);
        }
      } catch (error) {
        console.error("Error loading order statuses:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrderStatuses();
  }, [setOrderStatusFilter]);

  // Handle status checkbox toggling
  const handleStatusToggle = (status: string, checked: boolean) => {
    const updatedStatuses = { ...selectedStatuses, [status]: checked };
    setSelectedStatuses(updatedStatuses);
    setOrderStatusFilter(updatedStatuses);
  };

  // Toggle all statuses at once
  const toggleAll = (checked: boolean) => {
    const updatedStatuses = availableStatuses.reduce((acc, status) => {
      acc[status] = checked;
      return acc;
    }, {} as Record<string, boolean>);
    
    setSelectedStatuses(updatedStatuses);
    setOrderStatusFilter(updatedStatuses);
  };

  // Count of selected statuses
  const selectedCount = Object.values(selectedStatuses).filter(Boolean).length;
  const allSelected = selectedCount === availableStatuses.length;
  const someSelected = selectedCount > 0 && selectedCount < availableStatuses.length;

  if (loading || availableStatuses.length === 0) {
    return null;
  }
  
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center mb-3">
            <Checkbox
              id="select-all-statuses"
              checked={allSelected}
              indeterminate={someSelected}
              onCheckedChange={(checked) => toggleAll(!!checked)}
            />
            <Label htmlFor="select-all-statuses" className="ml-2 cursor-pointer">
              Ordrestatus ({selectedCount}/{availableStatuses.length})
            </Label>
          </div>
          
          <ScrollArea className="h-[180px] pr-4">
            <div className="space-y-2">
              {availableStatuses.map((status) => (
                <div key={status} className="flex items-center">
                  <Checkbox
                    id={`status-${status}`}
                    checked={selectedStatuses[status] || false}
                    onCheckedChange={(checked) => handleStatusToggle(status, !!checked)}
                  />
                  <Label htmlFor={`status-${status}`} className="ml-2 capitalize">
                    {status}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderStatusSelector;

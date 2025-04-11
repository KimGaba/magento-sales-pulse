
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type StoreView = 'alle' | 'dk' | 'se' | 'no' | 'fi';
type CustomerGroup = 'alle' | 'retail' | 'wholesale' | 'vip';
type OrderStatusFilter = Record<string, boolean>;

interface FilterContextType {
  storeView: StoreView;
  customerGroup: CustomerGroup;
  orderStatuses: OrderStatusFilter;
  selectedStoreIds: string[];
  setStoreView: (storeView: StoreView) => void;
  setCustomerGroup: (customerGroup: CustomerGroup) => void;
  setOrderStatusFilter: (statuses: OrderStatusFilter) => void;
  setSelectedStoreIds: (storeIds: string[]) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [storeView, setStoreView] = useState<StoreView>('alle');
  const [customerGroup, setCustomerGroup] = useState<CustomerGroup>('alle');
  const [orderStatuses, setOrderStatuses] = useState<OrderStatusFilter>({});
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  // Apply filters to local storage for persistence
  useEffect(() => {
    try {
      localStorage.setItem('filter_storeView', storeView);
      localStorage.setItem('filter_customerGroup', customerGroup);
      localStorage.setItem('filter_orderStatuses', JSON.stringify(orderStatuses));
      localStorage.setItem('filter_selectedStoreIds', JSON.stringify(selectedStoreIds));
    } catch (error) {
      console.error("Error saving filters to localStorage:", error);
    }
  }, [storeView, customerGroup, orderStatuses, selectedStoreIds]);

  // Load saved filters from local storage on initial render
  useEffect(() => {
    try {
      const savedStoreView = localStorage.getItem('filter_storeView') as StoreView;
      const savedCustomerGroup = localStorage.getItem('filter_customerGroup') as CustomerGroup;
      const savedOrderStatuses = localStorage.getItem('filter_orderStatuses');
      const savedStoreIds = localStorage.getItem('filter_selectedStoreIds');

      if (savedStoreView) setStoreView(savedStoreView);
      if (savedCustomerGroup) setCustomerGroup(savedCustomerGroup);
      if (savedOrderStatuses) setOrderStatuses(JSON.parse(savedOrderStatuses));
      if (savedStoreIds) setSelectedStoreIds(JSON.parse(savedStoreIds));
    } catch (error) {
      console.error("Error loading filters from localStorage:", error);
    }
  }, []);

  const setOrderStatusFilter = (statuses: OrderStatusFilter) => {
    setOrderStatuses(statuses);
  };

  const value = {
    storeView,
    customerGroup,
    orderStatuses,
    selectedStoreIds,
    setStoreView,
    setCustomerGroup,
    setOrderStatusFilter,
    setSelectedStoreIds
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

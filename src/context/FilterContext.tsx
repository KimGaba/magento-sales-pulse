
import React, { createContext, useContext, useState, ReactNode } from 'react';

type StoreView = 'alle' | 'dk' | 'se' | 'no' | 'fi';
type CustomerGroup = 'alle' | 'retail' | 'wholesale' | 'vip';

interface FilterContextType {
  storeView: StoreView;
  customerGroup: CustomerGroup;
  setStoreView: (storeView: StoreView) => void;
  setCustomerGroup: (customerGroup: CustomerGroup) => void;
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

  const value = {
    storeView,
    customerGroup,
    setStoreView,
    setCustomerGroup,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

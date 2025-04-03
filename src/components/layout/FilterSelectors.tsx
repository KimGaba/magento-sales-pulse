
import React from 'react';
import { useFilter } from '@/context/FilterContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Globe, Users } from 'lucide-react';

const FilterSelectors = () => {
  const { storeView, customerGroup, setStoreView, setCustomerGroup } = useFilter();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Select 
          value={storeView} 
          onValueChange={(value) => setStoreView(value as any)}
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Vælg butik" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle butikker</SelectItem>
            <SelectItem value="dk">Danmark</SelectItem>
            <SelectItem value="se">Sverige</SelectItem>
            <SelectItem value="no">Norge</SelectItem>
            <SelectItem value="fi">Finland</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <Select 
          value={customerGroup}
          onValueChange={(value) => setCustomerGroup(value as any)}
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Kundegruppe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle kundegrupper</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="wholesale">Wholesale</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FilterSelectors;

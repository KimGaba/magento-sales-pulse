
import React, { useState } from 'react';
import { useFilter } from '@/context/FilterContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Filter, Globe, Users, Check } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const FilterSelectors = () => {
  const { storeView, customerGroup, setStoreView, setCustomerGroup } = useFilter();
  const { translations } = useLanguage();
  
  // Local state for the filters that will only be applied when the user clicks "Anvend filtre"
  const [localStoreView, setLocalStoreView] = useState(storeView);
  const [localCustomerGroup, setLocalCustomerGroup] = useState(customerGroup);
  const [open, setOpen] = useState(false);

  // Apply the filters and close the popover
  const handleApplyFilters = () => {
    setStoreView(localStoreView);
    setCustomerGroup(localCustomerGroup);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span>Filtre</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium mb-3">Filtreringsindstillinger</h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <label htmlFor="store-filter" className="text-sm">Butik</label>
            </div>
            <Select 
              value={localStoreView} 
              onValueChange={(value) => setLocalStoreView(value as any)}
            >
              <SelectTrigger id="store-filter" className="w-full text-xs">
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

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <label htmlFor="customer-filter" className="text-sm">Kundegruppe</label>
            </div>
            <Select 
              value={localCustomerGroup}
              onValueChange={(value) => setLocalCustomerGroup(value as any)}
            >
              <SelectTrigger id="customer-filter" className="w-full text-xs">
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
          
          <div className="flex justify-end mt-4">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={handleApplyFilters}
            >
              <Check className="mr-2 h-4 w-4" />
              Anvend filtre
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterSelectors;


import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GlobeIcon } from 'lucide-react';

const LanguageSelector = () => {
  const { locale, setLocale, translations } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <GlobeIcon className="h-4 w-4" />
          <span className="hidden md:inline ml-1">{locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-white">
        <DropdownMenuItem 
          onClick={() => setLocale('en')}
          className="flex items-center gap-2"
        >
          <img src="https://flagcdn.com/w20/gb.png" width="20" alt="English" className="mr-2" />
          {translations.languageSelector.english}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLocale('da')}
          className="flex items-center gap-2"
        >
          <img src="https://flagcdn.com/w20/dk.png" width="20" alt="Danish" className="mr-2" />
          {translations.languageSelector.danish}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;

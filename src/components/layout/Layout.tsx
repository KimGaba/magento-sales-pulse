
import React from 'react';
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavigationMenu } from './NavigationMenu';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import FilterSelectors from './FilterSelectors';
import LanguageSelector from './LanguageSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const { translations } = useLanguage();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user || !user.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r">
          <SidebarContent>
            <NavigationMenu />
          </SidebarContent>
        </Sidebar>
        <div className="flex-1">
          <header className="border-b p-4 flex justify-between items-center">
            <div className="flex items-center">
              <SidebarTrigger />
              <div className="flex items-center ml-2">
                <img 
                  src="/lovable-uploads/b987e83a-8258-4105-ad71-1cc75ec496f7.png" 
                  alt="Logo" 
                  className="h-8"
                />
              </div>
            </div>
            <FilterSelectors />
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <Link to="/settings">
                <Avatar className="cursor-pointer">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </header>
          <main className="container p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;


import React from 'react';
import { Link } from 'react-router-dom';
import { 
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem 
} from '@/components/ui/sidebar';
import { BarChart, Calendar, Database, TrendingUp, RefreshCw, Activity, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export const NavigationMenu: React.FC = () => {
  const { translations } = useLanguage();
  
  const menuItems = [
    { 
      title: translations.layout.dashboard, 
      path: '/dashboard', 
      icon: BarChart 
    },
    { 
      title: translations.layout.products, 
      path: '/products', 
      icon: Database 
    },
    { 
      title: translations.layout.trends, 
      path: '/trends', 
      icon: TrendingUp 
    },
    { 
      title: translations.layout.repeatPurchase, 
      path: '/repeat-purchase', 
      icon: RefreshCw 
    },
    { 
      title: translations.layout.basketOpeners || "Kurv Åbnere", 
      path: '/basket-openers', 
      icon: ShoppingCart 
    },
    { 
      title: translations.layout.dailySales, 
      path: '/daily-sales', 
      icon: Calendar 
    },
  ];

  return (
    <>
      <div className="p-4">
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/b987e83a-8258-4105-ad71-1cc75ec496f7.png" 
            alt="Logo" 
            className="h-10"
          />
        </div>
      </div>

      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild>
                  <Link to={item.path} className="flex items-center">
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      
      <SidebarGroup>
        <SidebarGroupLabel>Integration</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/connect" className="flex items-center">
                  <Database className="mr-2 h-4 w-4" />
                  <span>Forbind Butik</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/integration-status" className="flex items-center">
                  <Activity className="mr-2 h-4 w-4" />
                  <span>Integration Status</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      
      <SidebarGroup className="mt-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/settings" className="flex items-center text-gray-600">
                  <Database className="mr-2 h-4 w-4" />
                  <span>Indstillinger</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

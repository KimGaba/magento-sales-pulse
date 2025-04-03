
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
import { BarChart, Calendar, Database, TrendingUp } from 'lucide-react';

export const NavigationMenu: React.FC = () => {
  const menuItems = [
    { 
      title: 'Dashboard', 
      path: '/dashboard', 
      icon: BarChart 
    },
    { 
      title: 'Produkter', 
      path: '/products', 
      icon: Database 
    },
    { 
      title: 'Salgstrends', 
      path: '/trends', 
      icon: TrendingUp 
    },
    { 
      title: 'Daglig Salg', 
      path: '/daily-sales', 
      icon: Calendar 
    },
  ];

  return (
    <>
      <div className="p-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-magento-600">Sales Pulse</h1>
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
      
      <SidebarGroup className="mt-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/connect" className="flex items-center text-magento-600 font-medium">
                  <Database className="mr-2 h-4 w-4" />
                  <span>Forbind Butik</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

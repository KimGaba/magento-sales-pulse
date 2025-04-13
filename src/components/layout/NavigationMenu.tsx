
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  LayoutDashboard, 
  CalendarDays, 
  TrendingUp, 
  Repeat, 
  ShoppingCart, 
  Package, 
  Settings, 
  Link as LinkIcon,
  Database,
  LogOut
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '../ui/button';
import { fetchActiveMagentoConnections } from '@/services/magentoService';
import { Skeleton } from '../ui/skeleton';

// Menu item interface
interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  requiresConnection: boolean;
}

const NavigationMenu = () => {
  const { translations } = useLanguage();
  const { user, logout } = useAuth();
  const [hasIntegrations, setHasIntegrations] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const t = translations.navigation;

  useEffect(() => {
    async function checkIntegrations() {
      if (!user) {
        setHasIntegrations(false);
        setLoading(false);
        return;
      }
      
      try {
        const connections = await fetchActiveMagentoConnections(user.id);
        setHasIntegrations(connections.length > 0);
      } catch (error) {
        console.error("Error checking integrations:", error);
        setHasIntegrations(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkIntegrations();
  }, [user]);

  // Basic menu items (always visible)
  const basicMenuItems: MenuItem[] = [
    {
      path: '/dashboard',
      label: t.dashboard,
      icon: <LayoutDashboard className="mr-3 h-5 w-5" />,
      requiresConnection: true
    },
    {
      path: '/connect',
      label: t.connect,
      icon: <LinkIcon className="mr-3 h-5 w-5" />,
      requiresConnection: false
    },
    {
      path: '/integration-status',
      label: t.integrationStatus || 'Integration Status',
      icon: <Database className="mr-3 h-5 w-5" />,
      requiresConnection: false
    },
    {
      path: '/settings',
      label: t.settings,
      icon: <Settings className="mr-3 h-5 w-5" />,
      requiresConnection: false
    }
  ];

  // Data menu items (visible only when integrations exist)
  const dataMenuItems: MenuItem[] = [
    {
      path: '/daily-sales',
      label: t.dailySales,
      icon: <CalendarDays className="mr-3 h-5 w-5" />,
      requiresConnection: true
    },
    {
      path: '/trends',
      label: t.trends,
      icon: <TrendingUp className="mr-3 h-5 w-5" />,
      requiresConnection: true
    },
    {
      path: '/repeat-purchase-rate',
      label: t.repeatPurchaseRate,
      icon: <Repeat className="mr-3 h-5 w-5" />,
      requiresConnection: true
    },
    {
      path: '/basket-openers',
      label: t.basketOpeners,
      icon: <ShoppingCart className="mr-3 h-5 w-5" />,
      requiresConnection: true
    },
    {
      path: '/products',
      label: t.products,
      icon: <Package className="mr-3 h-5 w-5" />,
      requiresConnection: true
    }
  ];

  // Render a single menu item
  const renderMenuItem = (item: MenuItem) => {
    // Skip items that require connections if we don't have any
    if (item.requiresConnection && !hasIntegrations) {
      return null;
    }

    return (
      <NavLink 
        key={item.path}
        to={item.path} 
        className={({ isActive }) => 
          `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive 
              ? 'bg-gray-100 text-gray-900 font-semibold' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`
        }
      >
        {item.icon}
        {item.label}
      </NavLink>
    );
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <nav className="space-y-1 flex flex-col h-full">
      <div className="flex-grow">
        {/* Basic menu items */}
        {basicMenuItems.map(renderMenuItem)}
        
        {/* Data menu items - only shown when integrations exist */}
        {hasIntegrations && (
          <>
            <hr className="border-t border-gray-200 my-2" />
            {dataMenuItems.map(renderMenuItem)}
          </>
        )}
      </div>
      
      {/* Log out button at the bottom */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          {t.logout || 'Log ud'}
        </Button>
      </div>
    </nav>
  );
};

export default NavigationMenu;

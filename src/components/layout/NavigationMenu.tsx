
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
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
  Database
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { fetchActiveMagentoConnections } from '@/services/magentoService';

const NavigationMenu = () => {
  const { translations } = useLanguage();
  const { user } = useAuth();
  const [hasIntegrations, setHasIntegrations] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Always show these menu items
  const basicMenuItems = (
    <>
      <NavLink 
        to="/dashboard" 
        className={({ isActive }) => 
          `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`
        }
      >
        <LayoutDashboard className="mr-3 h-5 w-5" />
        {t.dashboard}
      </NavLink>

      <hr className="border-t border-gray-200 my-2" />
      
      <NavLink 
        to="/connect" 
        className={({ isActive }) => 
          `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`
        }
      >
        <LinkIcon className="mr-3 h-5 w-5" />
        {t.connect}
      </NavLink>
      
      <NavLink 
        to="/integration-status" 
        className={({ isActive }) => 
          `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`
        }
      >
        <Database className="mr-3 h-5 w-5" />
        {t.integrationStatus || 'Integration Status'}
      </NavLink>
      
      <NavLink 
        to="/settings" 
        className={({ isActive }) => 
          `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`
        }
      >
        <Settings className="mr-3 h-5 w-5" />
        {t.settings}
      </NavLink>
    </>
  );

  // Show these menu items only when integrations exist
  const dataMenuItems = hasIntegrations && (
    <>
      <NavLink 
        to="/daily-sales" 
        className={({ isActive }) => 
          `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`
        }
      >
        <CalendarDays className="mr-3 h-5 w-5" />
        {t.dailySales}
      </NavLink>
      
      <NavLink 
        to="/trends" 
        className={({ isActive }) => 
          `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`
        }
      >
        <TrendingUp className="mr-3 h-5 w-5" />
        {t.trends}
      </NavLink>
      
      <NavLink 
        to="/repeat-purchase-rate" 
        className={({ isActive }) => 
          `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`
        }
      >
        <Repeat className="mr-3 h-5 w-5" />
        {t.repeatPurchaseRate}
      </NavLink>
      
      <NavLink 
        to="/basket-openers" 
        className={({ isActive }) => 
          `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`
        }
      >
        <ShoppingCart className="mr-3 h-5 w-5" />
        {t.basketOpeners}
      </NavLink>
      
      <NavLink 
        to="/products" 
        className={({ isActive }) => 
          `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`
        }
      >
        <Package className="mr-3 h-5 w-5" />
        {t.products}
      </NavLink>
    </>
  );

  if (loading) {
    return (
      <nav className="space-y-1">
        {basicMenuItems}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {basicMenuItems}
      
      {hasIntegrations && (
        <>
          <hr className="border-t border-gray-200 my-2" />
          {dataMenuItems}
        </>
      )}
    </nav>
  );
};

export default NavigationMenu;

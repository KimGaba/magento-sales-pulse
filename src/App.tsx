
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { FilterProvider } from './context/FilterContext';
import { ThemeProvider } from "@/components/theme-provider"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"

// Import pages
import Index from './pages/Index';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DailySales from './pages/DailySales';
import Trends from './pages/Trends';
import RepeatPurchaseRate from './pages/RepeatPurchaseRate';
import BasketOpeners from './pages/BasketOpeners';
import Products from './pages/Products';
import Connect from './pages/Connect';
import IntegrationStatus from './pages/IntegrationStatus';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import DatabaseTest from './pages/DatabaseTest';
import MagentoApiHelp from './pages/MagentoApiHelp';

// Import components
import AuthGuard from './components/auth/AuthGuard';

const queryClient = new QueryClient();

function App() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <Router>
        <AuthProvider>
          <LanguageProvider>
            <FilterProvider>
              <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                  <TooltipProvider>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
                      <Route path="/daily-sales" element={<AuthGuard><DailySales /></AuthGuard>} />
                      <Route path="/trends" element={<AuthGuard><Trends /></AuthGuard>} />
                      <Route path="/repeat-purchase-rate" element={<AuthGuard><RepeatPurchaseRate /></AuthGuard>} />
                      <Route path="/basket-openers" element={<AuthGuard><BasketOpeners /></AuthGuard>} />
                      <Route path="/products" element={<AuthGuard><Products /></AuthGuard>} />
                      <Route path="/connect" element={<AuthGuard><Connect /></AuthGuard>} />
                      <Route path="/magento-api-help" element={<AuthGuard><MagentoApiHelp /></AuthGuard>} />
                      <Route path="/integration-status" element={<AuthGuard><IntegrationStatus /></AuthGuard>} />
                      <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
                      <Route path="/database-test" element={<AuthGuard><DatabaseTest /></AuthGuard>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <Toaster />
                  </TooltipProvider>
                </ThemeProvider>
              </QueryClientProvider>
            </FilterProvider>
          </LanguageProvider>
        </AuthProvider>
      </Router>
    </Suspense>
  );
}

export default App;

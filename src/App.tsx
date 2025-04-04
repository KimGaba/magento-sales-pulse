
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { LanguageProvider } from './i18n/LanguageContext';
import AuthGuard from './components/auth/AuthGuard';
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Trends from "./pages/Trends";
import DailySales from "./pages/DailySales";
import Connect from "./pages/Connect";
import NotFound from "./pages/NotFound";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <FilterProvider>
            <TooltipProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
                <Route path="/products" element={<AuthGuard><Products /></AuthGuard>} />
                <Route path="/trends" element={<AuthGuard><Trends /></AuthGuard>} />
                <Route path="/daily-sales" element={<AuthGuard><DailySales /></AuthGuard>} />
                <Route path="/connect" element={<AuthGuard><Connect /></AuthGuard>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </FilterProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;

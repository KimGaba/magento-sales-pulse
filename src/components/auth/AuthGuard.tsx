
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveMagentoConnections } from '@/services/magentoService';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  // Check if user has any active connections
  const { data: activeConnections } = useQuery({
    queryKey: ['active-connections-check', user?.id],
    queryFn: () => user?.id ? fetchActiveMagentoConnections(user.id) : Promise.resolve([]),
    enabled: !!user?.id && isAuthenticated,
  });

  // Determine if user has access to restricted pages
  const hasActiveConnections = activeConnections && activeConnections.length > 0;

  // Define public and restricted routes
  const publicRoutes = ['/', '/login'];
  const setupRoutes = ['/connect', '/settings', '/integration-status'];
  
  // Routes that should only be accessible when a connection exists
  const connectionRequiredRoutes = [
    '/dashboard', 
    '/daily-sales', 
    '/basket-openers',
    '/repeat-purchase-rate', 
    '/products',
    '/trends'
  ];

  useEffect(() => {
    const checkAuth = () => {
      console.log("AuthGuard - checking authentication:", { 
        isAuthenticated, 
        path: location.pathname,
        hasActiveConnections: Boolean(hasActiveConnections)
      });
      
      // If not authenticated and trying to access a protected route, redirect to login
      if (!isAuthenticated && !publicRoutes.includes(location.pathname)) {
        console.log("AuthGuard - not authenticated, redirecting to login");
        navigate('/login', { replace: true });
      }
      
      // If authenticated but no connections and trying to access a connection-required route
      if (isAuthenticated && !hasActiveConnections && connectionRequiredRoutes.includes(location.pathname)) {
        console.log("AuthGuard - no active connections, redirecting to connect page");
        navigate('/connect', { replace: true });
      }
      
      setIsChecking(false);
    };
    
    // Give AuthContext more time to initialize first
    const timeout = setTimeout(checkAuth, 300);
    return () => clearTimeout(timeout);
  }, [isAuthenticated, navigate, location.pathname, hasActiveConnections]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-magento-600 mb-4" />
          <p className="text-lg text-gray-600">Indlæser...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !publicRoutes.includes(location.pathname)) {
    return null;
  }

  // Make the connections available to child components via context
  return (
    <ConnectionContext.Provider value={{ hasActiveConnections, activeConnections: activeConnections || [] }}>
      {children}
    </ConnectionContext.Provider>
  );
};

// Create a context to share connection state
export const ConnectionContext = React.createContext<{
  hasActiveConnections: boolean;
  activeConnections: any[];
}>({
  hasActiveConnections: false,
  activeConnections: [],
});

// Hook to use the connection context
export const useConnectionContext = () => React.useContext(ConnectionContext);

export default AuthGuard;

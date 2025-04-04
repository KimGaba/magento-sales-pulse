
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      console.log("AuthGuard - checking authentication:", { isAuthenticated, path: location.pathname });
      
      // Public routes that don't require authentication
      const publicRoutes = ['/', '/login'];
      
      if (!isAuthenticated && !publicRoutes.includes(location.pathname)) {
        console.log("AuthGuard - not authenticated, redirecting to login");
        navigate('/login', { replace: true });
      }
      setIsChecking(false);
    };
    
    // Give AuthContext more time to initialize first
    const timeout = setTimeout(checkAuth, 300);
    return () => clearTimeout(timeout);
  }, [isAuthenticated, navigate, location.pathname]);

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

  if (!isAuthenticated && !['/', '/login'].includes(location.pathname)) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;

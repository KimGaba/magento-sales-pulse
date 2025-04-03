
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsAuthenticated(isLoggedIn);
  }, []);

  const login = async (email: string, password: string) => {
    // Simuleret login proces
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        localStorage.setItem("isLoggedIn", "true");
        setIsAuthenticated(true);
        resolve();
      }, 1000);
    });
  };

  const loginWithGoogle = async () => {
    // Simuleret Google login proces
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        localStorage.setItem("isLoggedIn", "true");
        setIsAuthenticated(true);
        resolve();
      }, 1000);
    });
  };

  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

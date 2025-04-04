
import React from 'react';
import Layout from '@/components/layout/Layout';
import MetricsSection from '@/components/dashboard/MetricsSection';
import ChartsSection from '@/components/dashboard/ChartsSection';
import OrdersData from '@/components/dashboard/OrdersData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { CircleCheck, CircleX, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { fetchMagentoConnections } from '@/services/magentoService';

const Dashboard = () => {
  const { user } = useAuth();
  const [integrationStatus, setIntegrationStatus] = useState<'active' | 'error' | 'pending' | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      checkIntegrationStatus();
    }
  }, [user]);
  
  const checkIntegrationStatus = async () => {
    if (!user) return;
    
    try {
      const connections = await fetchMagentoConnections(user.id);
      
      if (connections.length === 0) {
        setIntegrationStatus(null);
      } else {
        // Check if any connection has error status
        const hasError = connections.some(conn => conn.status === 'error');
        // Check if any connection is pending
        const hasPending = connections.some(conn => conn.status === 'pending');
        
        if (hasError) {
          setIntegrationStatus('error');
        } else if (hasPending) {
          setIntegrationStatus('pending');
        } else {
          setIntegrationStatus('active');
        }
      }
    } catch (error) {
      console.error("Error checking integration status:", error);
      setIntegrationStatus(null);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusIndicator = () => {
    if (integrationStatus === 'active') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CircleCheck className="h-5 w-5" />
          <span>Integration aktiv</span>
        </div>
      );
    } else if (integrationStatus === 'error') {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <CircleX className="h-5 w-5" />
          <span>Integrationsfejl</span>
        </div>
      );
    } else if (integrationStatus === 'pending') {
      return (
        <div className="flex items-center gap-2 text-amber-600">
          <div className="w-5 h-5 rounded-full border-2 border-amber-600 border-t-transparent animate-spin"></div>
          <span>Integration afventer</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <CircleX className="h-5 w-5" />
        <span>Ingen integration</span>
      </div>
    );
  };
  
  return (
    <Layout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-500">Velkommen til dit salgsoverblik</p>
      </div>
      
      {/* Integration Status Card */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-xl flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-magento-600"></div>
          ) : (
            getStatusIndicator()
          )}
          <Button asChild size="sm">
            <Link to="/integration-status">Se detaljer</Link>
          </Button>
        </CardContent>
      </Card>
      
      {/* Key Metrics */}
      <MetricsSection />
      
      {/* Charts */}
      <ChartsSection />
      
      {/* Recent Orders */}
      <OrdersData />
    </Layout>
  );
};

export default Dashboard;

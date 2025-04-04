
import React from 'react';
import Layout from '@/components/layout/Layout';
import MetricsSection from '@/components/dashboard/MetricsSection';
import ChartsSection from '@/components/dashboard/ChartsSection';
import OrdersData from '@/components/dashboard/OrdersData';

const Dashboard = () => {
  return (
    <Layout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-500">Velkommen til dit salgsoverblik</p>
      </div>
      
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

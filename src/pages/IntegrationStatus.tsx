
import React from 'react';
import Layout from '@/components/layout/Layout';
import IntegrationStatusSection from '@/components/integration/IntegrationStatusSection';
import IntegrationHistorySection from '@/components/integration/IntegrationHistorySection';

const IntegrationStatus = () => {
  return (
    <Layout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Integration Status</h1>
        <p className="text-gray-500">Overvåg status på din Magento integration</p>
      </div>
      
      {/* Current Integration Status */}
      <IntegrationStatusSection />
      
      {/* Integration History */}
      <IntegrationHistorySection />
    </Layout>
  );
};

export default IntegrationStatus;

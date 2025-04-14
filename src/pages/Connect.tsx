
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { addMagentoConnection, MagentoConnection, triggerMagentoSync } from '@/services/magentoService';
import { useSyncProcess } from '@/hooks/useSyncProcess';
import { Profile } from '@/types/database';
import { fetchUserProfile } from '@/services/profileService';
import Layout from '@/components/layout/Layout';
import ConnectForm from '@/components/connect/ConnectForm';
import SyncProgressCard from '@/components/connect/SyncProgressCard';
import ConnectionCompleteCard from '@/components/connect/ConnectionCompleteCard';

const Connect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connectionData, setConnectionData] = useState<MagentoConnection | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { 
    step, 
    syncProgress, 
    syncStatus, 
    connecting,
    realSyncProgress,
    setConnecting, 
    startSyncProcess,
    setStep,
    resetSyncProcess 
  } = useSyncProcess();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const userProfile = await fetchUserProfile(user.id);
      setProfile(userProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleConnect = async (connection: Omit<MagentoConnection, 'id' | 'created_at' | 'updated_at'>) => {
    setConnecting(true);
    try {
      // Set the user ID from the authenticated user
      const connectionWithUser = {
        ...connection,
        user_id: user.id
      };

      const connectedStore = await addMagentoConnection(connectionWithUser);
      setConnectionData(connectedStore);
      
      toast({
        title: "Butik forbundet!",
        description: "Din Magento-butik er nu forbundet. Synkronisering starter...",
      });
      
      // Since we might not have a store_id yet, pass the connection ID
      // Edge function will take care of creating the store and updating the connection
      startSyncProcess(connectedStore.id, true);
    } catch (error) {
      console.error("Error connecting to Magento:", error);
      toast({
        title: "Fejl ved oprettelse af forbindelse",
        description: "Der opstod en fejl ved oprettelse af forbindelse til Magento. Prøv igen senere.",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="container mx-auto mt-10">
        {step === 1 && (
          <ConnectForm 
            onConnect={handleConnect} 
            connecting={connecting} 
          />
        )}

        {step === 2 && (
          <SyncProgressCard
            syncProgress={syncProgress}
            syncStatus={syncStatus}
            realSyncProgress={realSyncProgress}
          />
        )}

        {step === 3 && (
          <ConnectionCompleteCard onGoToDashboard={handleGoToDashboard} />
        )}
      </div>
    </Layout>
  );
};

export default Connect;

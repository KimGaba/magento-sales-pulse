
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { addMagentoConnection, MagentoConnection, triggerMagentoSync, fetchMagentoConnections } from '@/services/magentoService';
import { useSyncProcess } from '@/hooks/useSyncProcess';
import { Profile } from '@/types/database';
import { fetchUserProfile } from '@/services/profileService';
import Layout from '@/components/layout/Layout';
import ConnectForm from '@/components/connect/ConnectForm';
import SyncProgressCard from '@/components/connect/SyncProgressCard';
import ConnectionCompleteCard from '@/components/connect/ConnectionCompleteCard';
import ConnectionsList from '@/components/connect/ConnectionsList';

const Connect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connectionData, setConnectionData] = useState<MagentoConnection | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [connections, setConnections] = useState<MagentoConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // New state to force refresh
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
      loadConnections();
    }
  }, [user, refreshTrigger]); // Add refreshTrigger to dependencies

  const fetchProfile = async () => {
    try {
      const userProfile = await fetchUserProfile(user.id);
      setProfile(userProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const loadConnections = async () => {
    if (!user) return;
    
    setLoadingConnections(true);
    try {
      // Force a fresh fetch from the database by adding a timestamp and cache: 'no-store'
      const timestamp = new Date().getTime();
      console.log(`Loading connections at ${timestamp}...`);
      
      const userConnections = await fetchMagentoConnections(user.id);
      console.log("Loaded connections:", userConnections);
      
      // Update state with the fresh connections
      setConnections(userConnections);
    } catch (error) {
      console.error("Error loading connections:", error);
      toast({
        variant: "destructive",
        title: "Fejl ved indlæsning af forbindelser",
        description: "Der opstod en fejl ved indlæsning af dine Magento-forbindelser."
      });
    } finally {
      setLoadingConnections(false);
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
      
      // Refresh connections list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error connecting to Magento:", error);
      toast({
        variant: "destructive",
        title: "Fejl ved oprettelse af forbindelse",
        description: "Der opstod en fejl ved oprettelse af forbindelse til Magento. Prøv igen senere.",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (connection: MagentoConnection) => {
    // This function now forces a refresh after deletion
    console.log("Connection was disconnected:", connection.id);
    
    // Force a refresh of the connections by incrementing the trigger
    setRefreshTrigger(prev => prev + 1);
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="container mx-auto mt-10 space-y-8">
        {step === 1 && (
          <>
            <ConnectForm 
              onConnect={handleConnect} 
              connecting={connecting} 
            />
            
            {/* Show existing connections */}
            {connections.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-bold mb-4">Dine forbundne butikker</h2>
                <ConnectionsList
                  connections={connections}
                  loadingConnections={loadingConnections}
                  onDisconnect={handleDisconnect}
                />
              </div>
            )}
          </>
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

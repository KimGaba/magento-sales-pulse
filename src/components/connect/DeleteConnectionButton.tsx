
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import DeleteConnectionDialog from './DeleteConnectionDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StoreConnection {
  id: string;
  store_id?: string;
  store_name: string;
  store_url: string;
  status: string;
  order_statuses?: string[];
}

interface DeleteConnectionButtonProps {
  connection: StoreConnection;
  onDeleted: () => void;
}

const DeleteConnectionButton: React.FC<DeleteConnectionButtonProps> = ({ 
  connection, 
  onDeleted 
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!connection.id) return;
    
    setIsDeleting(true);
    try {
      console.log(`Starting deletion process for connection: ${connection.id}, store: ${connection.store_id || 'None'}`);
      
      // Important: First check if this connection even exists
      const { data: connectionCheck, error: checkError } = await supabase
        .from('magento_connections')
        .select('id')
        .eq('id', connection.id)
        .single();
        
      if (checkError) {
        console.log(`Connection ${connection.id} already deleted or does not exist`);
        setDialogOpen(false);
        onDeleted();
        return;
      }
      
      // For connections without a store_id, delete directly from magento_connections
      if (!connection.store_id) {
        console.log(`Deleting connection ${connection.id} without a store_id`);
        
        // First delete any related data - sync_progress
        const { error: syncError } = await supabase
          .from('sync_progress')
          .delete()
          .eq('connection_id', connection.id);
          
        if (syncError) {
          console.error('Error deleting sync progress data:', syncError);
          // Non-blocking error, continue anyway
        } else {
          console.log(`Successfully deleted sync progress data for connection ${connection.id}`);
        }
        
        // Next delete any related store views
        const { error: storeViewsError } = await supabase
          .from('magento_store_views')
          .delete()
          .eq('connection_id', connection.id);
          
        if (storeViewsError) {
          console.error('Error deleting store views data:', storeViewsError);
          // Non-blocking error, continue anyway
        } else {
          console.log(`Successfully deleted store views data for connection ${connection.id}`);
        }
        
        // Finally delete the connection itself
        const { error: connectionError } = await supabase
          .from('magento_connections')
          .delete()
          .eq('id', connection.id);
          
        if (connectionError) {
          console.error('Error deleting connection:', connectionError);
          throw new Error(`Kunne ikke slette forbindelsen: ${connectionError.message}`);
        }
        
        console.log(`Successfully deleted connection ${connection.id}`);
      } 
      // For connections with a store_id, use the delete_store_data function
      else {
        console.log(`Deleting all data for store ${connection.store_id}`);
        
        // Call the delete_store_data function to delete everything related to this store
        const { error: deleteError } = await supabase.rpc('delete_store_data', {
          target_store_id: connection.store_id
        });
        
        if (deleteError) {
          console.error('Error deleting store data:', deleteError);
          throw new Error(`Kunne ikke slette butiksdata: ${deleteError.message}`);
        }
      }
      
      toast({
        title: "Butik slettet",
        description: `Butikken "${connection.store_name}" og tilhørende data er blevet slettet.`,
      });
      
      // Close dialog and notify parent
      setDialogOpen(false);
      onDeleted();
    } catch (error) {
      console.error('Error during deletion process:', error);
      toast({
        variant: "destructive",
        title: "Fejl ved sletning",
        description: error instanceof Error ? error.message : "Der opstod en fejl ved sletning af butikken.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        className="border-red-500 text-red-500 hover:bg-red-50"
        onClick={() => setDialogOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Slet butik
      </Button>
      
      <DeleteConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        storeToDelete={connection}
        onConfirmDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default DeleteConnectionButton;

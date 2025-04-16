
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
      
      // If we have a store_id, use it to delete all associated data
      if (connection.store_id) {
        console.log(`Deleting all data for store ${connection.store_id}`);
        
        // Call the delete_store_data function to delete everything related to this store
        const { error: deleteError } = await supabase.rpc('delete_store_data', {
          target_store_id: connection.store_id
        });
        
        if (deleteError) {
          console.error('Error deleting store data:', deleteError);
          throw new Error(`Kunne ikke slette butiksdata: ${deleteError.message}`);
        }
      } else {
        // If no store_id, just delete the connection directly
        console.log(`Deleting connection ${connection.id} without a store_id`);
        
        // Make sure to delete the connection first - this is important!
        const { error: connectionError } = await supabase
          .from('magento_connections')
          .delete()
          .eq('id', connection.id);
          
        if (connectionError) {
          console.error('Error deleting connection:', connectionError);
          throw new Error(`Kunne ikke slette forbindelsen: ${connectionError.message}`);
        }
        
        console.log(`Successfully deleted connection ${connection.id}`);
        
        // Also check for any sync_progress entries with this connection_id
        const { error: syncError } = await supabase
          .from('sync_progress')
          .delete()
          .eq('connection_id', connection.id);
          
        if (syncError) {
          console.error('Error deleting sync progress data:', syncError);
          // Non-blocking error, just log it
        } else {
          console.log(`Successfully deleted sync progress data for connection ${connection.id}`);
        }
        
        // Also check for any magento_store_views with this connection_id
        const { error: storeViewsError } = await supabase
          .from('magento_store_views')
          .delete()
          .eq('connection_id', connection.id);
          
        if (storeViewsError) {
          console.error('Error deleting store views data:', storeViewsError);
          // Non-blocking error, just log it
        } else {
          console.log(`Successfully deleted store views data for connection ${connection.id}`);
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

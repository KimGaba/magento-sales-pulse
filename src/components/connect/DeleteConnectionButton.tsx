
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
      
      // Using the Edge Function to handle deletion of both connection types (with or without store_id)
      const { data, error } = await supabase.functions.invoke('magento-sync', {
        body: {
          action: 'delete_connection',
          connectionId: connection.id
        }
      });
      
      if (error) {
        console.error('Error calling delete_connection function:', error);
        throw new Error(`Kunne ikke slette forbindelsen: ${error.message}`);
      }
      
      if (!data.success) {
        console.error('Delete connection failed:', data.error);
        throw new Error(data.error || 'Kunne ikke slette forbindelsen');
      }
      
      console.log('Delete connection response:', data);
      
      toast({
        title: "Forbindelse slettet",
        description: data.message || `Forbindelsen "${connection.store_name}" er blevet slettet.`,
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

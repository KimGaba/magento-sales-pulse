
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';

interface StoreConnection {
  id: string;
  store_id?: string;
  store_name: string;
  store_url: string;
  status: string;
  order_statuses?: string[];
}

interface DeleteConnectionButtonProps {
  connectionId: string;
  onDeleted: () => void;
  // Add the connection prop with optional marker
  connection?: StoreConnection;
}

const DeleteConnectionButton: React.FC<DeleteConnectionButtonProps> = ({ 
  connectionId, 
  connection,
  onDeleted 
}) => {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    // If we have a connection object, use its ID, otherwise use the connectionId prop
    const idToDelete = connection?.id || connectionId;

    if (!idToDelete) {
      console.error('No connection ID provided for deletion');
      toast({
        variant: 'destructive',
        title: 'Fejl',
        description: 'Ingen forbindelse ID angivet til sletning'
      });
      return;
    }

    if (!window.confirm('Er du sikker på, at du vil slette denne forbindelse? Dette kan ikke fortrydes.')) {
      return;
    }

    setDeleting(true);
    
    try {
      console.log(`Deleting connection ID: ${idToDelete}`);
      
      // Call the Edge Function to handle deletion
      const { data, error } = await supabase.functions.invoke('magento-sync', {
        body: { 
          action: 'delete_connection',
          connectionId: idToDelete 
        }
      });
      
      if (error) {
        console.error('Error calling delete_connection function:', error);
        toast({
          variant: 'destructive',
          title: 'Fejl ved sletning',
          description: `Der opstod en fejl: ${error.message}`
        });
        return;
      }
      
      if (data && !data.success) {
        console.error('Delete connection returned error:', data.error);
        toast({
          variant: 'destructive',
          title: 'Fejl ved sletning',
          description: data.error || 'Der opstod en ukendt fejl ved sletning af forbindelsen'
        });
        return;
      }

      // Success
      sonnerToast.success('Forbindelsen blev slettet');
      
      // Notify parent component to refresh the connections list
      onDeleted();
      
    } catch (error) {
      console.error('Exception in handleDelete:', error);
      toast({
        variant: 'destructive',
        title: 'Fejl ved sletning',
        description: error instanceof Error ? error.message : 'Der opstod en ukendt fejl'
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      className="border-red-500 text-red-500 hover:bg-red-50"
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
          Sletter...
        </div>
      ) : (
        <>
          <Database className="h-4 w-4 mr-2" />
          Slet butik
        </>
      )}
    </Button>
  );
};

export default DeleteConnectionButton;

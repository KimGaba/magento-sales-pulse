import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/LanguageContext';
import DeleteConnectionDialog from './DeleteConnectionDialog';

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
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

const DeleteConnectionButton: React.FC<DeleteConnectionButtonProps> = ({
  connection,
  onDeleted,
  variant = 'destructive',
  size = 'default',
  disabled = false
}) => {
  // Safety check to avoid issues with undefined props
  if (!connection || !connection.id) {
    console.warn("DeleteConnectionButton rendered without valid connection");
    // Return empty button instead of null to maintain UI layout
    return (
      <Button
        variant={variant}
        size={size}
        disabled={true}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Slet
      </Button>
    );
  }

  const connectionId = connection.id;
  const storeName = connection.store_name;

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleDelete = async () => {
    if (isDeleting) return; // Prevent double clicks
    
    setIsDeleting(true);
    console.log("Starting deletion process for connection:", connectionId);
    
    try {
      // Direct database deletion approach instead of using Edge Function
      const { error } = await supabase
        .from("magento_connections")
        .delete()
        .eq("id", connectionId);
        
      if (error) {
        console.error('Error deleting connection from database:', error);
        toast({
          title: t('error'),
          description: t('errorDeletingConnection'),
          variant: 'destructive'
        });
        return;
      }
      
      console.log("Connection deleted successfully:", connectionId);
      toast({
        title: t('success'),
        description: t('connectionDeleted')
      });
      
      // Notify parent component that deletion was successful
      if (typeof onDeleted === 'function') {
        onDeleted();
      }
    } catch (error) {
      console.error('Exception deleting connection:', error);
      toast({
        title: t('error'),
        description: t('errorDeletingConnection'),
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowConfirmDialog(true)}
        disabled={disabled || isDeleting}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {t('deleteConnection')}
      </Button>
      
      {showConfirmDialog && (
        <DeleteConnectionDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          storeName={storeName}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};

export default DeleteConnectionButton;

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/LanguageContext';
import DeleteConnectionDialog from './DeleteConnectionDialog';

interface DeleteConnectionButtonProps {
  connectionId: string;
  storeName: string;
  onDeleted: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

const DeleteConnectionButton: React.FC<DeleteConnectionButtonProps> = ({
  connectionId,
  storeName,
  onDeleted,
  variant = 'destructive',
  size = 'default',
  disabled = false
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      console.log("Deleting connection with ID:", connectionId); // Debug log
      
      if (!connectionId) {
        console.error("No connection ID provided for deletion");
        toast({
          title: t('error'),
          description: t('errorDeletingConnection'),
          variant: 'destructive'
        });
        return;
      }
      
      // Call the Supabase Edge Function to delete the connection
      const { data, error } = await supabase.functions.invoke('magento-sync', {
        body: { 
          action: 'delete_connection',
          connectionId
        }
      });
      
      if (error) {
        console.error('Error deleting connection:', error);
        toast({
          title: t('error'),
          description: t('errorDeletingConnection'),
          variant: 'destructive'
        });
        return;
      }
      
      if (!data?.success) {
        console.error('Error from edge function:', data?.error);
        toast({
          title: t('error'),
          description: data?.error || t('errorDeletingConnection'),
          variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: t('success'),
        description: t('connectionDeleted')
      });
      
      // Notify parent component that deletion was successful
      onDeleted();
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
      
      <DeleteConnectionDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        storeName={storeName}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default DeleteConnectionButton;


import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StoreConnection {
  id: string;
  store_id?: string;
  store_name: string;
  store_url: string;
  status: string;
  order_statuses?: string[];
}

interface DeleteConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeToDelete: StoreConnection | null;
  onConfirmDelete: () => void;
  isDeleting?: boolean;
}

const DeleteConnectionDialog: React.FC<DeleteConnectionDialogProps> = ({
  open,
  onOpenChange,
  storeToDelete,
  onConfirmDelete,
  isDeleting = false
}) => {
  return (
    <AlertDialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing the dialog while deletion is in progress
      if (isDeleting && newOpen === false) {
        return;
      }
      onOpenChange(newOpen);
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Vil du slette denne butik?</AlertDialogTitle>
          <AlertDialogDescription>
            Dette vil slette alle data relateret til butikken "{storeToDelete?.store_name}". 
            Denne handling kan ikke fortrydes, og alle data vil gå tabt.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuller</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirmDelete}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span>
                Sletter...
              </>
            ) : (
              "Ja, slet butikken"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConnectionDialog;

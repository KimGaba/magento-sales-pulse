
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format, parseISO } from 'date-fns';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { SyncProgress, fetchSyncHistory } from '@/services/transactionService';

interface SyncHistoryItem {
  id: string;
  timestamp: string; // ISO string
  end_timestamp?: string; // ISO string
  status: 'success' | 'error' | 'in_progress';
  items_synced: number;
  duration_seconds?: number;
  trigger_type: 'manual' | 'scheduled' | 'initial';
  store_id: string;
  store_name?: string;
}

const IntegrationHistorySection = () => {
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSyncHistory();
  }, []);
  
  const loadSyncHistory = async () => {
    setLoading(true);
    try {
      // Pass a default store ID for now - this should be updated with the actual store ID when available
      const historyData = await fetchSyncHistory('default-store-id', 10);
      
      // Convert the SyncProgress[] to SyncHistoryItem[]
      const formattedHistory: SyncHistoryItem[] = historyData.map(item => ({
        id: item.id,
        timestamp: item.started_at,
        end_timestamp: item.status !== 'in_progress' ? item.updated_at : undefined,
        status: item.status === 'completed' ? 'success' : 
               item.status === 'error' ? 'error' : 'in_progress',
        items_synced: item.orders_processed,
        duration_seconds: item.status !== 'in_progress' ? 
          (new Date(item.updated_at).getTime() - new Date(item.started_at).getTime()) / 1000 : undefined,
        trigger_type: 'scheduled', // Default value, should be updated with real data when available
        store_id: item.store_id
      }));
      
      setHistory(formattedHistory);
    } catch (error) {
      console.error("Error loading sync history:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds} sek.`;
    }
    
    return `${minutes} min. ${remainingSeconds} sek.`;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Synkroniseringshistorik (7 dage)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start tidspunkt</TableHead>
                  <TableHead>Slut tidspunkt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Elementer synkroniseret</TableHead>
                  <TableHead className="hidden md:table-cell">Varighed</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Ingen synkroniseringshistorik fundet
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {format(parseISO(item.timestamp), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {item.end_timestamp 
                          ? format(parseISO(item.end_timestamp), 'dd/MM/yyyy HH:mm')
                          : 'I gang'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : item.status === 'error' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />
                          )}
                          <span className="hidden md:inline">
                            {item.status === 'success' ? 'Gennemført' : 
                             item.status === 'error' ? 'Fejlet' : 'I gang'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{item.items_synced}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDuration(item.duration_seconds)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.trigger_type === 'manual' 
                            ? 'bg-blue-100 text-blue-800' 
                            : item.trigger_type === 'initial'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.trigger_type === 'manual' ? 'Manuel' : 
                           item.trigger_type === 'initial' ? 'Initial' : 'Planlagt'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {history.length > 0 && (
              <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                <p><strong>Næste planlagte synkronisering:</strong> Hver dag kl. 02:00</p>
                <p>Butikker synkroniseres automatisk én gang dagligt for at opdatere med nye ordrer og produkter.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IntegrationHistorySection;

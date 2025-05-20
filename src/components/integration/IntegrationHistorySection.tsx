
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format } from 'date-fns';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/railway/client';

interface SyncHistoryItem {
  id: string;
  timestamp: Date;
  status: 'success' | 'error';
  itemsSynced: number;
  duration: number;
  trigger: 'manual' | 'scheduled';
}

const IntegrationHistorySection = () => {
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchSyncHistory();
  }, []);
  
  const fetchSyncHistory = async () => {
    setLoading(true);
    try {
      // Fetch sync progress history from the database
      const { data, error } = await supabase
        .from('sync_progress')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching sync history:', error);
        return;
      }
      
      if (data) {
        // Transform the data to match our component format
        const historyItems: SyncHistoryItem[] = data.map(item => {
          const startTime = new Date(item.started_at);
          const endTime = new Date(item.updated_at);
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationSeconds = Math.floor(durationMs / 1000);
          
          return {
            id: item.id,
            timestamp: startTime,
            status: item.status === 'completed' ? 'success' : 'error',
            itemsSynced: item.orders_processed || 0,
            duration: durationSeconds,
            trigger: 'manual' // Default to manual since we don't have this info
          };
        });
        
        setHistory(historyItems);
      }
    } catch (error) {
      console.error('Error in fetchSyncHistory:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Synkroniseringshistorik</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magento-600"></div>
          </div>
        ) : (
          <>
            {history.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tidspunkt</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Antal elementer</TableHead>
                      <TableHead className="hidden md:table-cell">Varighed</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {format(item.timestamp, 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {item.status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="hidden md:inline">
                              {item.status === 'success' ? 'Gennemført' : 'Fejlet'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{item.itemsSynced}</TableCell>
                        <TableCell className="hidden md:table-cell">{item.duration} sek.</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.trigger === 'manual' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.trigger === 'manual' ? 'Manuel' : 'Planlagt'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Ingen synkroniseringshistorik tilgængelig endnu</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default IntegrationHistorySection;

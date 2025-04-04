
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format, subDays } from 'date-fns';
import { CheckCircle, XCircle } from 'lucide-react';

// Placeholder mock data - would be replaced with real API call
const generateMockHistory = () => {
  const history = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = subDays(today, i);
    // Create 1-3 sync events per day
    const eventsCount = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < eventsCount; j++) {
      // Random hour between 0-23
      const hours = Math.floor(Math.random() * 24);
      const minutes = Math.floor(Math.random() * 60);
      
      date.setHours(hours);
      date.setMinutes(minutes);
      
      history.push({
        id: `sync-${i}-${j}`,
        timestamp: new Date(date),
        status: Math.random() > 0.2 ? 'success' : 'error',
        itemsSynced: Math.floor(Math.random() * 100) + 1,
        duration: Math.floor(Math.random() * 120) + 10, // 10-130 seconds
        trigger: Math.random() > 0.7 ? 'manual' : 'scheduled'
      });
    }
  }
  
  // Sort by timestamp, newest first
  return history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const IntegrationHistorySection = () => {
  const [history] = useState(generateMockHistory());
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Synkroniseringshistorik (7 dage)</CardTitle>
      </CardHeader>
      <CardContent>
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
        <p className="text-xs text-gray-500 mt-4 text-center">
          * Bemærk: I øjeblikket vises mockdata. I produktionen vil dette være din faktiske synkroniseringshistorik.
        </p>
      </CardContent>
    </Card>
  );
};

export default IntegrationHistorySection;

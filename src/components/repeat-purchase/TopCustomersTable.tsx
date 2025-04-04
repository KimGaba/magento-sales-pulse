
import React from 'react';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';

interface Customer {
  email: string;
  purchases: number;
  totalSpent: number;
  lastPurchase: string;
}

interface TopCustomersTableProps {
  customers: Customer[];
  title: string;
  description: string;
  labels: {
    customerEmail: string;
    purchaseCount: string;
    totalSpent: string;
    lastPurchase: string;
  };
}

const TopCustomersTable: React.FC<TopCustomersTableProps> = ({
  customers,
  title,
  description,
  labels
}) => {
  const isMobile = useIsMobile();
  
  return (
    <Card>
      <CardHeader className="py-4 md:py-6">
        <CardTitle className="text-xl md:text-2xl">{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 md:px-6 pb-4 md:pb-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">{labels.customerEmail}</TableHead>
              <TableHead className="text-right whitespace-nowrap">{labels.purchaseCount}</TableHead>
              <TableHead className="text-right whitespace-nowrap">{labels.totalSpent}</TableHead>
              {!isMobile && <TableHead className="whitespace-nowrap">{labels.lastPurchase}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium max-w-[150px] md:max-w-none truncate">
                  {customer.email}
                </TableCell>
                <TableCell className="text-right">
                  {customer.purchases}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(customer.totalSpent)}
                </TableCell>
                {!isMobile && (
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(customer.lastPurchase), 'dd/MM/yyyy')}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TopCustomersTable;

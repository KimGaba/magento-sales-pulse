
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{labels.customerEmail}</TableHead>
              <TableHead className="text-right">{labels.purchaseCount}</TableHead>
              <TableHead className="text-right">{labels.totalSpent}</TableHead>
              <TableHead>{labels.lastPurchase}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{customer.email}</TableCell>
                <TableCell className="text-right">{customer.purchases}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(customer.totalSpent)}
                </TableCell>
                <TableCell>
                  {format(new Date(customer.lastPurchase), 'dd/MM/yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TopCustomersTable;

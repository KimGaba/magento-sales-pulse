
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
import { ArrowUp, ArrowDown } from 'lucide-react';

interface Customer {
  email: string;
  purchases: number;
  totalSpent: number;
  lastPurchase: string;
  averageOrderValue?: number;
  firstPurchase?: string;
  frequency?: number; // days between purchases on average
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
  const [sortField, setSortField] = React.useState<keyof Customer>('purchases');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  
  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const sortedCustomers = [...customers].sort((a, b) => {
    const valueA = a[sortField] as string | number;
    const valueB = b[sortField] as string | number;
    
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    // Handle string comparison
    const strA = String(valueA);
    const strB = String(valueB);
    
    return sortDirection === 'asc' 
      ? strA.localeCompare(strB) 
      : strB.localeCompare(strA);
  });
  
  // Calculate additional metrics for customers
  const enhancedCustomers = sortedCustomers.map(customer => {
    // Calculate average order value
    const averageOrderValue = customer.totalSpent / customer.purchases;
    
    // For demonstration, let's assume first purchase date is 30 days earlier than last purchase
    // In a real scenario, this would come from the actual data
    const lastPurchaseDate = new Date(customer.lastPurchase);
    const estimatedFirstPurchase = new Date(lastPurchaseDate);
    estimatedFirstPurchase.setDate(estimatedFirstPurchase.getDate() - 30);
    
    // Calculate average days between purchases (frequency)
    // Simple estimate: days between first and last purchase divided by number of purchases
    const daysDifference = (lastPurchaseDate.getTime() - estimatedFirstPurchase.getTime()) / (1000 * 60 * 60 * 24);
    const frequency = customer.purchases > 1 ? daysDifference / (customer.purchases - 1) : 0;
    
    return {
      ...customer,
      averageOrderValue,
      firstPurchase: format(estimatedFirstPurchase, 'yyyy-MM-dd'),
      frequency: Math.round(frequency)
    };
  });
  
  const SortIcon = ({ field }: { field: keyof Customer }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };
  
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
              <TableHead 
                className="whitespace-nowrap cursor-pointer" 
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center">
                  {labels.customerEmail}
                  <SortIcon field="email" />
                </div>
              </TableHead>
              <TableHead 
                className="text-right whitespace-nowrap cursor-pointer"
                onClick={() => handleSort('purchases')}
              >
                <div className="flex items-center justify-end">
                  {labels.purchaseCount}
                  <SortIcon field="purchases" />
                </div>
              </TableHead>
              <TableHead 
                className="text-right whitespace-nowrap cursor-pointer"
                onClick={() => handleSort('totalSpent')}
              >
                <div className="flex items-center justify-end">
                  {labels.totalSpent}
                  <SortIcon field="totalSpent" />
                </div>
              </TableHead>
              {!isMobile && (
                <>
                  <TableHead className="text-right whitespace-nowrap">
                    Avg. Order
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    {labels.lastPurchase}
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Frequency
                  </TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {enhancedCustomers.map((customer, index) => (
              <TableRow key={index} className="hover:bg-muted/30 transition-colors duration-200">
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
                  <>
                    <TableCell className="text-right whitespace-nowrap">
                      {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(customer.averageOrderValue || 0)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(customer.lastPurchase), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {customer.frequency ? `${customer.frequency} days` : 'N/A'}
                    </TableCell>
                  </>
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

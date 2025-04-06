
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BasketOpenerProduct } from '@/services/transactionService';

interface BasketOpenerTableProps {
  products: BasketOpenerProduct[];
  title: string;
  description: string;
  labels: {
    productName: string;
    openerScore: string;
    openerCount: string;
    totalAppearances: string;
  };
}

const BasketOpenerTable: React.FC<BasketOpenerTableProps> = ({
  products,
  title,
  description,
  labels
}) => {
  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center text-gray-500">
          Ingen data at vise
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">{labels.productName}</TableHead>
              <TableHead className="text-center">{labels.openerScore}</TableHead>
              <TableHead className="text-right">{labels.openerCount}</TableHead>
              <TableHead className="text-right">{labels.totalAppearances}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.product_id}>
                <TableCell className="font-medium">{product.product_name}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-magento-600 h-2.5 rounded-full" 
                        style={{ width: `${product.opener_score}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm">{product.opener_score}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{product.opener_count}</TableCell>
                <TableCell className="text-right">{product.total_appearances}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default BasketOpenerTable;

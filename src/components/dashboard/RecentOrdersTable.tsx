
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

interface Order {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: string;
  statusClass: string;
}

interface RecentOrdersTableProps {
  orders: Order[];
  title: string;
  description: string;
}

const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({
  orders,
  title,
  description
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle px-6">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Ordre ID</th>
                  <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Kunde</th>
                  <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Dato</th>
                  <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Beløb</th>
                  <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{order.id}</td>
                    <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{order.customer}</td>
                    <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{order.date}</td>
                    <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{order.amount}</td>
                    <td className="py-3 px-2 md:px-4 text-xs md:text-sm">
                      <span className={order.statusClass}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentOrdersTable;

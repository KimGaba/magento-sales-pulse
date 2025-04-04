
import React from 'react';
import RecentOrdersTable from './RecentOrdersTable';

const orders = [
  {
    id: "#10024",
    customer: "Anders Jensen",
    date: "3. apr 2025",
    amount: "1.245 kr",
    status: "Gennemført",
    statusClass: "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
  },
  {
    id: "#10023",
    customer: "Maria Nielsen",
    date: "2. apr 2025",
    amount: "860 kr",
    status: "Afsendt",
    statusClass: "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
  },
  {
    id: "#10022",
    customer: "Lars Petersen",
    date: "2. apr 2025",
    amount: "450 kr",
    status: "Behandles",
    statusClass: "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs"
  },
  {
    id: "#10021",
    customer: "Sofie Hansen",
    date: "1. apr 2025",
    amount: "1.780 kr",
    status: "Gennemført",
    statusClass: "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
  },
  {
    id: "#10020",
    customer: "Mikkel Andersen",
    date: "1. apr 2025",
    amount: "925 kr",
    status: "Gennemført",
    statusClass: "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
  }
];

const OrdersData: React.FC = () => {
  return (
    <RecentOrdersTable
      orders={orders}
      title="Seneste ordrer"
      description="De 5 seneste ordrer i din butik"
    />
  );
};

export default OrdersData;

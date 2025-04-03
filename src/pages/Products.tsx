
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Database, TrendingUp, TrendingDown } from 'lucide-react';

// Sample product data
const products = [
  {
    id: 1,
    name: "Premium T-shirt",
    sku: "TS-001",
    price: 299,
    stock: 45,
    sold: 120,
    trend: "up",
    image: "/placeholder.svg"
  },
  {
    id: 2,
    name: "Denim Jeans",
    sku: "DJ-002",
    price: 599,
    stock: 28,
    sold: 98,
    trend: "up",
    image: "/placeholder.svg"
  },
  {
    id: 3,
    name: "Leather Jacket",
    sku: "LJ-003",
    price: 1299,
    stock: 12,
    sold: 86,
    trend: "down",
    image: "/placeholder.svg"
  },
  {
    id: 4,
    name: "Running Shoes",
    sku: "RS-004",
    price: 899,
    stock: 32,
    sold: 75,
    trend: "down",
    image: "/placeholder.svg"
  },
  {
    id: 5,
    name: "Backpack",
    sku: "BP-005",
    price: 499,
    stock: 50,
    sold: 65,
    trend: "up",
    image: "/placeholder.svg"
  },
  {
    id: 6,
    name: "Sunglasses",
    sku: "SG-006",
    price: 349,
    stock: 60,
    sold: 55,
    trend: "down",
    image: "/placeholder.svg"
  }
];

const Products = () => {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Produkter</h1>
        <p className="text-gray-500">Oversigt over dine produkters præstation</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Produktstatistik</CardTitle>
          <CardDescription>Generel oversigt over dit produktkatalog</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-magento-100 p-3 rounded-full">
                <Database className="h-6 w-6 text-magento-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Totale produkter</p>
                <p className="text-2xl font-semibold">487</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Bedst performende</p>
                <p className="text-2xl font-semibold">122</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Lav beholdning</p>
                <p className="text-2xl font-semibold">35</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Bedst sælgende produkter</CardTitle>
              <CardDescription>Produkter med højeste salg i denne måned</CardDescription>
            </div>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="text" placeholder="Søg efter produkt..." />
              <Button type="submit">Søg</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Produkt</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">SKU</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Pris</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Lager</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Solgt</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Trend</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 mr-3 bg-gray-200 rounded flex-shrink-0">
                          <img src={product.image} alt={product.name} className="h-10 w-10 object-cover rounded" />
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{product.sku}</td>
                    <td className="py-3 px-4 text-sm">{product.price} kr</td>
                    <td className="py-3 px-4 text-sm">{product.stock}</td>
                    <td className="py-3 px-4 text-sm">{product.sold}</td>
                    <td className="py-3 px-4 text-sm">
                      {product.trend === "up" ? (
                        <span className="flex items-center text-green-600">
                          <TrendingUp className="h-4 w-4 mr-1" /> Opadgående
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <TrendingDown className="h-4 w-4 mr-1" /> Nedadgående
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-500">Viser 1-6 af 487 produkter</p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>Forrige</Button>
              <Button variant="outline" size="sm" className="bg-magento-600 text-white hover:bg-magento-700">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">Næste</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default Products;

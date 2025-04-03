
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Database, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    image: "/placeholder.svg",
    storeView: "DK Website",
    customerGroup: "Retail"
  },
  {
    id: 2,
    name: "Denim Jeans",
    sku: "DJ-002",
    price: 599,
    stock: 28,
    sold: 98,
    trend: "up",
    image: "/placeholder.svg",
    storeView: "SE Website",
    customerGroup: "Wholesale"
  },
  {
    id: 3,
    name: "Leather Jacket",
    sku: "LJ-003",
    price: 1299,
    stock: 12,
    sold: 86,
    trend: "down",
    image: "/placeholder.svg",
    storeView: "NO Website",
    customerGroup: "Retail"
  },
  {
    id: 4,
    name: "Running Shoes",
    sku: "RS-004",
    price: 899,
    stock: 32,
    sold: 75,
    trend: "down",
    image: "/placeholder.svg",
    storeView: "DK Website",
    customerGroup: "VIP"
  },
  {
    id: 5,
    name: "Backpack",
    sku: "BP-005",
    price: 499,
    stock: 50,
    sold: 65,
    trend: "up",
    image: "/placeholder.svg",
    storeView: "SE Website",
    customerGroup: "Retail"
  },
  {
    id: 6,
    name: "Sunglasses",
    sku: "SG-006",
    price: 349,
    stock: 60,
    sold: 55,
    trend: "down",
    image: "/placeholder.svg",
    storeView: "NO Website",
    customerGroup: "Wholesale"
  }
];

// Define available store views and customer groups
const storeViews = ["Alle", "DK Website", "SE Website", "NO Website"];
const customerGroups = ["Alle", "Retail", "Wholesale", "VIP"];

const Products = () => {
  const [selectedStoreView, setSelectedStoreView] = useState("Alle");
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState("Alle");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter products based on selected filters and search query
  const filteredProducts = products.filter(product => {
    // Filter by store view
    const storeViewMatch = selectedStoreView === "Alle" || product.storeView === selectedStoreView;
    
    // Filter by customer group
    const customerGroupMatch = selectedCustomerGroup === "Alle" || product.customerGroup === selectedCustomerGroup;
    
    // Filter by search query
    const searchMatch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    return storeViewMatch && customerGroupMatch && searchMatch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortColumn) return 0;

    // Handle different column types
    let aValue = a[sortColumn as keyof typeof a];
    let bValue = b[sortColumn as keyof typeof b];

    // String comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    // Number comparison
    if (sortDirection === "asc") {
      return (aValue as number) - (bValue as number);
    } else {
      return (bValue as number) - (aValue as number);
    }
  });

  // Toggle sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, set to asc
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderSortIndicator = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortDirection === "asc" ? 
      <ArrowUpDown className="ml-2 h-4 w-4 text-magento-600" /> : 
      <ArrowUpDown className="ml-2 h-4 w-4 rotate-180 text-magento-600" />;
  };

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
          <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
            <div>
              <CardTitle>Bedst sælgende produkter</CardTitle>
              <CardDescription>Produkter med højeste salg i denne måned</CardDescription>
            </div>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <Select value={selectedStoreView} onValueChange={setSelectedStoreView}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Vælg website" />
                  </SelectTrigger>
                  <SelectContent>
                    {storeViews.map((storeView) => (
                      <SelectItem key={storeView} value={storeView}>
                        {storeView}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={selectedCustomerGroup} onValueChange={setSelectedCustomerGroup}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Vælg kundegruppe" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-full md:w-auto items-center space-x-2">
                <Input 
                  type="text" 
                  placeholder="Søg efter produkt..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit">Søg</Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center">
                      Produkt {renderSortIndicator("name")}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("sku")}>
                    <div className="flex items-center">
                      SKU {renderSortIndicator("sku")}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("price")}>
                    <div className="flex items-center">
                      Pris {renderSortIndicator("price")}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("stock")}>
                    <div className="flex items-center">
                      Lager {renderSortIndicator("stock")}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("sold")}>
                    <div className="flex items-center">
                      Solgt {renderSortIndicator("sold")}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("storeView")}>
                    <div className="flex items-center">
                      Website {renderSortIndicator("storeView")}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("customerGroup")}>
                    <div className="flex items-center">
                      Kundegruppe {renderSortIndicator("customerGroup")}
                    </div>
                  </TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 mr-3 bg-gray-200 rounded flex-shrink-0">
                          <img src={product.image} alt={product.name} className="h-10 w-10 object-cover rounded" />
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.price} kr</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.sold}</TableCell>
                    <TableCell>{product.storeView}</TableCell>
                    <TableCell>{product.customerGroup}</TableCell>
                    <TableCell>
                      {product.trend === "up" ? (
                        <span className="flex items-center text-green-600">
                          <TrendingUp className="h-4 w-4 mr-1" /> Opadgående
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <TrendingDown className="h-4 w-4 mr-1" /> Nedadgående
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-500">Viser {sortedProducts.length} af {products.length} produkter</p>
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

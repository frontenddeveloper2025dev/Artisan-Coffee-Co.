import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryTracker } from './InventoryTracker';
import { InventoryAnalytics } from './InventoryAnalytics';
import { AutoReorderSystem } from './AutoReorderSystem';
import { useInventoryManagement } from '@/hooks/use-inventory';
import { useCoffeeDatabase } from '@/hooks/use-coffee-database';
import { useToast } from '@/hooks/use-toast';
import { Package, TrendingDown, TrendingUp, AlertTriangle, RefreshCw, Settings, DollarSign } from 'lucide-react';

export function AdminPanel() {
  const { stats, loading: statsLoading, reload } = useInventoryManagement();
  const { products, loading: productsLoading, initializeData, initialized } = useCoffeeDatabase();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [newStockLevel, setNewStockLevel] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800 border-green-200';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock': return <TrendingUp className="w-4 h-4" />;
      case 'low_stock': return <AlertTriangle className="w-4 h-4" />;
      case 'out_of_stock': return <TrendingDown className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (statsLoading || productsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading admin data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Admin Dashboard
            </div>
            {!initialized && (
              <Button onClick={initializeData} variant="outline" size="sm">
                <Package className="w-4 h-4 mr-2" />
                Initialize Sample Data
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Manage inventory, track sales, and monitor coffee product performance
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reorder">Auto-Reorder</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-coffee-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">Active in catalog</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Stock</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
                  <p className="text-xs text-muted-foreground">Ready to ship</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.lowStock + stats.outOfStock}</div>
                  <p className="text-xs text-muted-foreground">Low or out of stock</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-coffee-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Total stock value</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>Monitor and update stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.origin}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">{product.available_stock} available</div>
                        {product.inventory && (
                          <div className="text-sm text-gray-600">
                            {product.inventory.reserved_stock} reserved
                          </div>
                        )}
                      </div>

                      <Badge className={getStockStatusColor(product.stock_status)}>
                        {getStockStatusIcon(product.stock_status)}
                        <span className="ml-1 capitalize">{product.stock_status.replace('_', ' ')}</span>
                      </Badge>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product._id);
                              setNewStockLevel(product.inventory?.current_stock?.toString() || '0');
                            }}
                          >
                            Update
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Stock Level</DialogTitle>
                            <DialogDescription>
                              Adjust inventory for {product.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="stock-level">New Stock Level</Label>
                              <Input
                                id="stock-level"
                                type="number"
                                min="0"
                                value={newStockLevel}
                                onChange={(e) => setNewStockLevel(e.target.value)}
                                placeholder="Enter new stock level"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                              <Button 
                                onClick={async () => {
                                  setIsUpdating(true);
                                  try {
                                    toast({
                                      title: "Stock Updated",
                                      description: `Stock level would be updated to ${newStockLevel} units.`,
                                    });
                                    await reload();
                                  } catch (error) {
                                    console.error('Failed to update stock:', error);
                                  } finally {
                                    setIsUpdating(false);
                                  }
                                }}
                                disabled={isUpdating}
                              >
                                {isUpdating ? 'Updating...' : 'Update Stock'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>Overview of all coffee products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Card key={product._id} className="overflow-hidden">
                    <div 
                      className="h-32 bg-cover bg-center"
                      style={{ backgroundImage: `url(${product.image_url})` }}
                    />
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.origin}</p>
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline" className="text-xs">
                          Intensity {product.intensity}/10
                        </Badge>
                        <span className="font-bold">{formatCurrency(product.price)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge className={getStockStatusColor(product.stock_status)} variant="outline">
                          {product.available_stock} in stock
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <InventoryTracker />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <InventoryAnalytics />
        </TabsContent>

        <TabsContent value="reorder" className="space-y-4">
          <AutoReorderSystem />
        </TabsContent>
      </Tabs>
    </div>
  );
}
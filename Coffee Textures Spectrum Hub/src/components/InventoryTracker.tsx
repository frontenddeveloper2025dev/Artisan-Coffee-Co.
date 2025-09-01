import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { table } from '@devvai/devv-code-backend';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  BarChart3,
  RefreshCw,
  Plus,
  Minus,
  History,
  Bell,
  Target
} from 'lucide-react';

interface InventoryMovement {
  _id: string;
  product_id: string;
  movement_type: 'restock' | 'sale' | 'adjustment' | 'reservation' | 'release';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference_id?: string;
  created_at: string;
  created_by: string;
}

interface StockAlert {
  _id: string;
  product_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'reorder_needed' | 'expired';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  acknowledged: boolean;
  created_at: string;
}

interface InventoryAnalytics {
  totalMovements: number;
  totalSales: number;
  averageMovementValue: number;
  topSellingProducts: Array<{
    product_id: string;
    product_name: string;
    total_sold: number;
    revenue: number;
  }>;
  lowStockAlerts: number;
  criticalAlerts: number;
}

export function InventoryTracker() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [movementType, setMovementType] = useState<'restock' | 'adjustment'>('restock');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadInventoryData();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await table.getItems('evmzzktorxts', { limit: 100 });
      setProducts(response.items);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      
      // Load movements (simulated for now - would need a movements table)
      const mockMovements: InventoryMovement[] = [
        {
          _id: '1',
          product_id: 'prod_1',
          movement_type: 'restock',
          quantity: 50,
          previous_stock: 10,
          new_stock: 60,
          reason: 'Weekly restock delivery',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          created_by: 'admin'
        },
        {
          _id: '2',
          product_id: 'prod_2',
          movement_type: 'sale',
          quantity: -3,
          previous_stock: 25,
          new_stock: 22,
          reason: 'Customer order #12345',
          reference_id: 'order_12345',
          created_at: new Date(Date.now() - 43200000).toISOString(),
          created_by: 'system'
        }
      ];
      
      setMovements(mockMovements);

      // Load alerts (simulated)
      const mockAlerts: StockAlert[] = [
        {
          _id: '1',
          product_id: 'prod_3',
          alert_type: 'low_stock',
          message: 'Ethiopian Yirgacheffe is running low (5 units remaining)',
          severity: 'warning',
          acknowledged: false,
          created_at: new Date(Date.now() - 21600000).toISOString()
        },
        {
          _id: '2',
          product_id: 'prod_4',
          alert_type: 'reorder_needed',
          message: 'Colombian Supremo needs reordering (below reorder level)',
          severity: 'critical',
          acknowledged: false,
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      
      setAlerts(mockAlerts);

      // Calculate analytics
      const mockAnalytics: InventoryAnalytics = {
        totalMovements: mockMovements.length,
        totalSales: mockMovements
          .filter(m => m.movement_type === 'sale')
          .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
        averageMovementValue: 25.5,
        topSellingProducts: [
          {
            product_id: 'prod_1',
            product_name: 'Ethiopian Yirgacheffe',
            total_sold: 145,
            revenue: 2755.50
          },
          {
            product_id: 'prod_2',
            product_name: 'Colombian Supremo',
            total_sold: 132,
            revenue: 2376.00
          }
        ],
        lowStockAlerts: 3,
        criticalAlerts: 1
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to load inventory data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load inventory tracking data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const recordMovement = async () => {
    if (!selectedProduct || !quantity || !reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current inventory
      const inventoryResponse = await table.getItems('evn000r9yk8w', {
        query: { product_id: selectedProduct },
        limit: 1
      });

      if (inventoryResponse.items.length === 0) {
        toast({
          title: "Product Not Found",
          description: "Product not found in inventory",
          variant: "destructive"
        });
        return;
      }

      const inventory = inventoryResponse.items[0];
      const quantityNum = parseInt(quantity);
      const newStock = inventory.current_stock + (movementType === 'restock' ? quantityNum : quantityNum);

      // Update inventory
      await table.updateItem('evn000r9yk8w', {
        _uid: inventory._uid,
        _id: inventory._id,
        current_stock: Math.max(0, newStock),
        last_restock_date: movementType === 'restock' ? new Date().toISOString() : inventory.last_restock_date,
        last_restock_quantity: movementType === 'restock' ? quantityNum : inventory.last_restock_quantity,
        updated_at: new Date().toISOString()
      });

      toast({
        title: "Movement Recorded",
        description: `${movementType === 'restock' ? 'Restocked' : 'Adjusted'} ${Math.abs(quantityNum)} units`,
      });

      // Reset form
      setSelectedProduct('');
      setQuantity('');
      setReason('');
      
      // Reload data
      await loadInventoryData();
    } catch (error) {
      console.error('Failed to record movement:', error);
      toast({
        title: "Recording Failed",
        description: "Failed to record inventory movement",
        variant: "destructive"
      });
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert._id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    
    toast({
      title: "Alert Acknowledged",
      description: "Alert has been marked as acknowledged",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <Bell className="w-4 h-4" />;
      case 'info': return <Target className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading inventory tracker...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Inventory Tracking System
          </CardTitle>
          <CardDescription>
            Advanced inventory management with movement history, alerts, and analytics
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
                  <History className="h-4 w-4 text-coffee-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalMovements}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{analytics.totalSales}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {analytics.lowStockAlerts + analytics.criticalAlerts}
                  </div>
                  <p className="text-xs text-muted-foreground">{analytics.criticalAlerts} critical</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Movement</CardTitle>
                  <BarChart3 className="h-4 w-4 text-coffee-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.averageMovementValue}</div>
                  <p className="text-xs text-muted-foreground">Units per movement</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Best performing products by sales volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topSellingProducts.map((product, index) => (
                  <div key={product.product_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-coffee-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-coffee-600">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{product.product_name}</h3>
                        <p className="text-sm text-gray-600">{product.total_sold} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">${product.revenue.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Inventory Movements</CardTitle>
              <CardDescription>Complete history of stock changes and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movements.map((movement) => {
                  const product = products.find(p => p._id === movement.product_id);
                  const isIncrease = movement.quantity > 0;
                  
                  return (
                    <div key={movement._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${isIncrease ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isIncrease ? 
                            <Plus className="w-4 h-4 text-green-600" /> : 
                            <Minus className="w-4 h-4 text-red-600" />
                          }
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {product?.name || `Product ${movement.product_id}`}
                          </h3>
                          <p className="text-sm text-gray-600">{movement.reason}</p>
                          <p className="text-xs text-gray-500">{formatDate(movement.created_at)}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge 
                          variant="outline" 
                          className={`mb-1 ${isIncrease ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}`}
                        >
                          {movement.movement_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <div className="text-sm">
                          <span className={isIncrease ? 'text-green-600' : 'text-red-600'}>
                            {isIncrease ? '+' : ''}{movement.quantity}
                          </span>
                          <span className="text-gray-500 ml-2">
                            ({movement.previous_stock} → {movement.new_stock})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts & Notifications</CardTitle>
              <CardDescription>Real-time alerts for inventory issues and reorder needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => {
                  const product = products.find(p => p._id === alert.product_id);
                  
                  return (
                    <div key={alert._id} className={`p-4 border rounded-lg ${alert.acknowledged ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${getSeverityColor(alert.severity).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                            {getSeverityIcon(alert.severity)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">
                                {product?.name || `Product ${alert.product_id}`}
                              </h3>
                              <Badge className={getSeverityColor(alert.severity)} variant="outline">
                                {alert.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                            <p className="text-xs text-gray-500">{formatDate(alert.created_at)}</p>
                          </div>
                        </div>
                        
                        {!alert.acknowledged && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => acknowledgeAlert(alert._id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Record Inventory Movement</CardTitle>
              <CardDescription>Add stock movements, adjustments, and restocks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-select">Product</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="movement-type">Movement Type</Label>
                    <Select value={movementType} onValueChange={(value: any) => setMovementType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restock">Restock</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>
                
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe the reason for this movement"
                    rows={3}
                  />
                </div>
                
                <Button onClick={recordMovement} className="w-full">
                  <Package className="w-4 h-4 mr-2" />
                  Record Movement
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
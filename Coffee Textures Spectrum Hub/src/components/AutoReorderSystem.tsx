import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { table } from '@devvai/devv-code-backend';
import { 
  Settings, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Package,
  Truck,
  DollarSign,
  Calendar,
  Target,
  RefreshCw,
  Zap
} from 'lucide-react';

interface ReorderRule {
  _id: string;
  product_id: string;
  product_name: string;
  enabled: boolean;
  reorder_level: number;
  reorder_quantity: number;
  supplier: string;
  lead_time_days: number;
  cost_per_unit: number;
  safety_stock: number;
  auto_execute: boolean;
  created_at: string;
  updated_at: string;
}

interface PendingOrder {
  _id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  supplier: string;
  estimated_cost: number;
  status: 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
  created_at: string;
  expected_delivery: string;
}

interface ReorderMetrics {
  totalRules: number;
  activeRules: number;
  pendingOrders: number;
  totalOrderValue: number;
  averageLeadTime: number;
  successRate: number;
}

export function AutoReorderSystem() {
  const [reorderRules, setReorderRules] = useState<ReorderRule[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [metrics, setMetrics] = useState<ReorderMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [systemEnabled, setSystemEnabled] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const { toast } = useToast();

  // Form states for new rule
  const [formData, setFormData] = useState({
    reorder_level: '',
    reorder_quantity: '',
    supplier: '',
    lead_time_days: '',
    cost_per_unit: '',
    safety_stock: '',
    auto_execute: false
  });

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      
      // Load products and inventory
      const [productsResponse, inventoryResponse] = await Promise.all([
        table.getItems('evmzzktorxts', { limit: 100 }),
        table.getItems('evn000r9yk8w', { limit: 100 })
      ]);

      setProducts(productsResponse.items);
      setInventory(inventoryResponse.items);

      // Mock reorder rules data
      const mockRules: ReorderRule[] = [
        {
          _id: 'rule_1',
          product_id: 'prod_1',
          product_name: 'Ethiopian Yirgacheffe',
          enabled: true,
          reorder_level: 10,
          reorder_quantity: 50,
          supplier: 'Coffee Direct Inc.',
          lead_time_days: 7,
          cost_per_unit: 12.50,
          safety_stock: 5,
          auto_execute: true,
          created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: 'rule_2',
          product_id: 'prod_2',
          product_name: 'Colombian Supremo',
          enabled: true,
          reorder_level: 15,
          reorder_quantity: 40,
          supplier: 'South American Coffee Co.',
          lead_time_days: 10,
          cost_per_unit: 11.75,
          safety_stock: 8,
          auto_execute: false,
          created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: 'rule_3',
          product_id: 'prod_3',
          product_name: 'Jamaican Blue Mountain',
          enabled: false,
          reorder_level: 5,
          reorder_quantity: 20,
          supplier: 'Premium Coffee Imports',
          lead_time_days: 14,
          cost_per_unit: 45.00,
          safety_stock: 3,
          auto_execute: false,
          created_at: new Date(Date.now() - 86400000 * 21).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock pending orders
      const mockOrders: PendingOrder[] = [
        {
          _id: 'order_1',
          product_id: 'prod_1',
          product_name: 'Ethiopian Yirgacheffe',
          quantity: 50,
          supplier: 'Coffee Direct Inc.',
          estimated_cost: 625.00,
          status: 'pending',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          expected_delivery: new Date(Date.now() + 86400000 * 7).toISOString()
        },
        {
          _id: 'order_2',
          product_id: 'prod_2',
          product_name: 'Colombian Supremo',
          quantity: 40,
          supplier: 'South American Coffee Co.',
          estimated_cost: 470.00,
          status: 'approved',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          expected_delivery: new Date(Date.now() + 86400000 * 8).toISOString()
        }
      ];

      setReorderRules(mockRules);
      setPendingOrders(mockOrders);

      // Calculate metrics
      const mockMetrics: ReorderMetrics = {
        totalRules: mockRules.length,
        activeRules: mockRules.filter(rule => rule.enabled).length,
        pendingOrders: mockOrders.filter(order => order.status === 'pending').length,
        totalOrderValue: mockOrders.reduce((sum, order) => sum + order.estimated_cost, 0),
        averageLeadTime: mockRules.reduce((sum, rule) => sum + rule.lead_time_days, 0) / mockRules.length,
        successRate: 94.2
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load system data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load auto-reorder system data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createReorderRule = async () => {
    if (!selectedProduct || !formData.reorder_level || !formData.reorder_quantity || !formData.supplier) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const product = products.find(p => p._id === selectedProduct);
      if (!product) return;

      const newRule: ReorderRule = {
        _id: `rule_${Date.now()}`,
        product_id: selectedProduct,
        product_name: product.name,
        enabled: true,
        reorder_level: parseInt(formData.reorder_level),
        reorder_quantity: parseInt(formData.reorder_quantity),
        supplier: formData.supplier,
        lead_time_days: parseInt(formData.lead_time_days) || 7,
        cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
        safety_stock: parseInt(formData.safety_stock) || 0,
        auto_execute: formData.auto_execute,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setReorderRules(prev => [...prev, newRule]);
      
      // Reset form
      setSelectedProduct('');
      setFormData({
        reorder_level: '',
        reorder_quantity: '',
        supplier: '',
        lead_time_days: '',
        cost_per_unit: '',
        safety_stock: '',
        auto_execute: false
      });

      toast({
        title: "Rule Created",
        description: `Auto-reorder rule created for ${product.name}`,
      });
    } catch (error) {
      console.error('Failed to create reorder rule:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create reorder rule",
        variant: "destructive"
      });
    }
  };

  const toggleRule = async (ruleId: string) => {
    setReorderRules(prev => prev.map(rule => 
      rule._id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));

    const rule = reorderRules.find(r => r._id === ruleId);
    toast({
      title: rule?.enabled ? "Rule Disabled" : "Rule Enabled",
      description: `Auto-reorder rule ${rule?.enabled ? 'disabled' : 'enabled'} for ${rule?.product_name}`,
    });
  };

  const executeOrder = async (orderId: string) => {
    setPendingOrders(prev => prev.map(order => 
      order._id === orderId ? { ...order, status: 'ordered' } : order
    ));

    const order = pendingOrders.find(o => o._id === orderId);
    toast({
      title: "Order Executed",
      description: `Purchase order placed for ${order?.product_name}`,
    });
  };

  const checkInventoryLevels = async () => {
    // Simulate checking inventory levels against reorder rules
    let triggeredOrders = 0;
    
    for (const rule of reorderRules.filter(r => r.enabled)) {
      const inventoryItem = inventory.find(inv => inv.product_id === rule.product_id);
      if (inventoryItem && inventoryItem.current_stock <= rule.reorder_level) {
        // Would trigger a reorder
        triggeredOrders++;
      }
    }

    toast({
      title: "Inventory Check Complete",
      description: `Checked ${reorderRules.filter(r => r.enabled).length} rules. ${triggeredOrders} would trigger reorders.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ordered': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'received': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading auto-reorder system...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Auto-Reorder System
              </CardTitle>
              <CardDescription>
                Automated inventory replenishment with intelligent forecasting
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="system-toggle">System Active</Label>
                <Switch
                  id="system-toggle"
                  checked={systemEnabled}
                  onCheckedChange={setSystemEnabled}
                />
              </div>
              <Button onClick={checkInventoryLevels} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Levels
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
              <Settings className="h-4 w-4 text-coffee-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalRules}</div>
              <p className="text-xs text-muted-foreground">{metrics.activeRules} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{metrics.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalOrderValue)}</div>
              <p className="text-xs text-muted-foreground">Total pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Lead Time</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.averageLeadTime)}</div>
              <p className="text-xs text-muted-foreground">Days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.successRate}%</div>
              <p className="text-xs text-muted-foreground">Order accuracy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              {systemEnabled ? 
                <Play className="h-4 w-4 text-green-600" /> : 
                <Pause className="h-4 w-4 text-red-600" />
              }
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${systemEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {systemEnabled ? 'Active' : 'Paused'}
              </div>
              <p className="text-xs text-muted-foreground">Auto-reorder</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reorder Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reorder Rules</CardTitle>
              <CardDescription>Configure automated reordering for each product</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Package className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Reorder Rule</DialogTitle>
                  <DialogDescription>
                    Set up automated reordering for a product
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reorder-level">Reorder Level</Label>
                      <Input
                        id="reorder-level"
                        type="number"
                        value={formData.reorder_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, reorder_level: e.target.value }))}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reorder-quantity">Reorder Quantity</Label>
                      <Input
                        id="reorder-quantity"
                        type="number"
                        value={formData.reorder_quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, reorder_quantity: e.target.value }))}
                        placeholder="50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Supplier name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lead-time">Lead Time (days)</Label>
                      <Input
                        id="lead-time"
                        type="number"
                        value={formData.lead_time_days}
                        onChange={(e) => setFormData(prev => ({ ...prev, lead_time_days: e.target.value }))}
                        placeholder="7"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost-per-unit">Cost per Unit</Label>
                      <Input
                        id="cost-per-unit"
                        type="number"
                        step="0.01"
                        value={formData.cost_per_unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                        placeholder="12.50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="safety-stock">Safety Stock</Label>
                    <Input
                      id="safety-stock"
                      type="number"
                      value={formData.safety_stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, safety_stock: e.target.value }))}
                      placeholder="5"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.auto_execute}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_execute: checked }))}
                    />
                    <Label>Auto-execute orders</Label>
                  </div>
                  
                  <Button onClick={createReorderRule} className="w-full">
                    Create Rule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reorderRules.map((rule) => (
              <div key={rule._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${rule.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {rule.enabled ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <Pause className="w-4 h-4 text-gray-600" />
                    }
                  </div>
                  <div>
                    <h3 className="font-semibold">{rule.product_name}</h3>
                    <p className="text-sm text-gray-600">
                      Reorder {rule.reorder_quantity} units when stock ≤ {rule.reorder_level}
                    </p>
                    <p className="text-xs text-gray-500">
                      Supplier: {rule.supplier} • Lead time: {rule.lead_time_days} days
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(rule.cost_per_unit)}</div>
                    <div className="text-sm text-gray-600">per unit</div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {rule.auto_execute && (
                      <Badge variant="outline" className="border-purple-200 text-purple-700">
                        Auto
                      </Badge>
                    )}
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleRule(rule._id)}
                      disabled={!systemEnabled}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Purchase Orders</CardTitle>
            <CardDescription>Orders awaiting approval or execution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{order.product_name}</h3>
                      <p className="text-sm text-gray-600">
                        {order.quantity} units from {order.supplier}
                      </p>
                      <p className="text-xs text-gray-500">
                        Expected delivery: {formatDate(order.expected_delivery)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(order.estimated_cost)}</div>
                      <div className="text-sm text-gray-600">Total cost</div>
                    </div>
                    
                    <Badge className={getStatusColor(order.status)} variant="outline">
                      {order.status.toUpperCase()}
                    </Badge>
                    
                    {order.status === 'pending' && (
                      <Button onClick={() => executeOrder(order._id)} size="sm">
                        Execute Order
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
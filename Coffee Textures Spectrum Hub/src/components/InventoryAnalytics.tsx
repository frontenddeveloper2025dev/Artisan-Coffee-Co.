import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { table } from '@devvai/devv-code-backend';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  RefreshCw
} from 'lucide-react';

interface InventoryAnalyticsData {
  overview: {
    totalProducts: number;
    totalStockValue: number;
    averageStockLevel: number;
    turnoverRate: number;
    stockAccuracy: number;
  };
  trends: {
    period: string;
    salesTrend: number;
    stockTrend: number;
    valueChange: number;
  };
  performance: {
    fastMovingProducts: Array<{
      product_id: string;
      name: string;
      turnover_rate: number;
      revenue: number;
    }>;
    slowMovingProducts: Array<{
      product_id: string;
      name: string;
      days_in_stock: number;
      current_stock: number;
    }>;
  };
  forecasting: {
    reorderPredictions: Array<{
      product_id: string;
      name: string;
      predicted_stockout_date: string;
      recommended_order_quantity: number;
      confidence: number;
    }>;
  };
  categoryBreakdown: Array<{
    category: string;
    stock_count: number;
    stock_value: number;
    percentage: number;
  }>;
}

export function InventoryAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<InventoryAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load products and inventory
      const [productsResponse, inventoryResponse] = await Promise.all([
        table.getItems('evmzzktorxts', { limit: 100 }),
        table.getItems('evn000r9yk8w', { limit: 100 })
      ]);

      setProducts(productsResponse.items);
      setInventory(inventoryResponse.items);

      // Calculate analytics (mock data for demonstration)
      const mockAnalytics: InventoryAnalyticsData = {
        overview: {
          totalProducts: productsResponse.items.length,
          totalStockValue: calculateTotalStockValue(productsResponse.items, inventoryResponse.items),
          averageStockLevel: calculateAverageStockLevel(inventoryResponse.items),
          turnoverRate: 2.3,
          stockAccuracy: 98.2
        },
        trends: {
          period: selectedPeriod,
          salesTrend: 12.5,
          stockTrend: -8.2,
          valueChange: 5.7
        },
        performance: {
          fastMovingProducts: [
            {
              product_id: 'prod_1',
              name: 'Ethiopian Yirgacheffe',
              turnover_rate: 4.2,
              revenue: 3250.00
            },
            {
              product_id: 'prod_2',
              name: 'Colombian Supremo',
              turnover_rate: 3.8,
              revenue: 2890.00
            }
          ],
          slowMovingProducts: [
            {
              product_id: 'prod_3',
              name: 'Jamaican Blue Mountain',
              days_in_stock: 45,
              current_stock: 12
            },
            {
              product_id: 'prod_4',
              name: 'Hawaiian Kona',
              days_in_stock: 38,
              current_stock: 8
            }
          ]
        },
        forecasting: {
          reorderPredictions: [
            {
              product_id: 'prod_1',
              name: 'Ethiopian Yirgacheffe',
              predicted_stockout_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              recommended_order_quantity: 50,
              confidence: 0.87
            },
            {
              product_id: 'prod_2',
              name: 'Colombian Supremo',
              predicted_stockout_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
              recommended_order_quantity: 40,
              confidence: 0.82
            }
          ]
        },
        categoryBreakdown: [
          {
            category: 'Single Origin',
            stock_count: 45,
            stock_value: 2250.00,
            percentage: 60
          },
          {
            category: 'Blends',
            stock_count: 30,
            stock_value: 1350.00,
            percentage: 40
          }
        ]
      };

      setAnalyticsData(mockAnalytics);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast({
        title: "Error Loading Analytics",
        description: "Failed to load inventory analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalStockValue = (products: any[], inventory: any[]) => {
    let totalValue = 0;
    inventory.forEach((inv) => {
      const product = products.find(p => p._id === inv.product_id);
      if (product) {
        const availableStock = Math.max(0, inv.current_stock - inv.reserved_stock);
        totalValue += availableStock * (product.price / 100);
      }
    });
    return totalValue;
  };

  const calculateAverageStockLevel = (inventory: any[]) => {
    if (inventory.length === 0) return 0;
    const totalStock = inventory.reduce((sum, inv) => sum + inv.current_stock, 0);
    return Math.round(totalStock / inventory.length);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatPercentage = (value: number, showSign = true) => {
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading analytics...</span>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <AlertTriangle className="w-6 h-6 mr-2 text-yellow-600" />
          <span>No analytics data available</span>
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
                <BarChart3 className="w-5 h-5" />
                Inventory Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive insights and forecasting for inventory management
              </CardDescription>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-coffee-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active SKUs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.overview.totalStockValue)}</div>
            <p className={`text-xs flex items-center ${getTrendColor(analyticsData.trends.valueChange)}`}>
              {getTrendIcon(analyticsData.trends.valueChange)}
              <span className="ml-1">{formatPercentage(analyticsData.trends.valueChange)} from last period</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Stock Level</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.averageStockLevel}</div>
            <p className="text-xs text-muted-foreground">Units per product</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.turnoverRate}x</div>
            <p className="text-xs text-muted-foreground">Times per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Accuracy</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.stockAccuracy}%</div>
            <p className="text-xs text-muted-foreground">Inventory precision</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Fast Moving Products
            </CardTitle>
            <CardDescription>Products with highest turnover rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.performance.fastMovingProducts.map((product, index) => (
                <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-600">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-sm text-gray-600">Turnover: {product.turnover_rate}x/month</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(product.revenue)}</div>
                    <div className="text-sm text-gray-600">Revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-yellow-600" />
              Slow Moving Products
            </CardTitle>
            <CardDescription>Products requiring attention or promotion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.performance.slowMovingProducts.map((product, index) => (
                <div key={product.product_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                      <AlertTriangle className="w-3 h-3 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.days_in_stock} days in stock</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{product.current_stock}</div>
                    <div className="text-sm text-gray-600">Units</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecasting & Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Reorder Predictions
          </CardTitle>
          <CardDescription>AI-powered forecasting for optimal inventory levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.forecasting.reorderPredictions.map((prediction) => (
              <div key={prediction.product_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{prediction.name}</h4>
                    <p className="text-sm text-gray-600">
                      Predicted stockout: {formatDate(prediction.predicted_stockout_date)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-bold">{prediction.recommended_order_quantity} units</div>
                    <div className="text-sm text-gray-600">Recommended order</div>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className={`${
                      prediction.confidence >= 0.85 
                        ? 'border-green-200 text-green-700' 
                        : prediction.confidence >= 0.7 
                        ? 'border-yellow-200 text-yellow-700'
                        : 'border-red-200 text-red-700'
                    }`}
                  >
                    {Math.round(prediction.confidence * 100)}% confidence
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Category Breakdown
          </CardTitle>
          <CardDescription>Stock distribution by product category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.categoryBreakdown.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{category.category}</h4>
                    <p className="text-sm text-gray-600">
                      {category.stock_count} units • {formatCurrency(category.stock_value)}
                    </p>
                  </div>
                  <Badge variant="outline">{category.percentage}%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-coffee-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
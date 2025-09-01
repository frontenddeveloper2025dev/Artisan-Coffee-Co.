import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { 
  useProductsWithInventory, 
  useInventoryAlerts,
  useSampleDataInitialization 
} from '@/hooks/use-coffee-data'
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Coffee,
  Eye,
  RefreshCw
} from 'lucide-react'

function AdminDashboard() {
  const { toast } = useToast()
  const { products, loading, error, refetch } = useProductsWithInventory()
  const { alerts, loading: alertsLoading } = useInventoryAlerts()
  const { initializeSampleData, initialized, initializing } = useSampleDataInitialization()

  // Initialize sample data if needed
  useEffect(() => {
    if (!initialized && !initializing && products.length === 0) {
      initializeSampleData()
    }
  }, [initialized, initializing, products.length, initializeSampleData])

  const handleRefresh = async () => {
    try {
      await refetch()
      toast({
        title: "Data Refreshed",
        description: "Inventory data has been updated successfully."
      })
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh inventory data.",
        variant: "destructive"
      })
    }
  }

  // Calculate inventory statistics
  const stats = {
    totalProducts: products.length,
    inStock: products.filter(p => p.available_stock > 0).length,
    lowStock: products.filter(p => p.available_stock > 0 && p.available_stock <= p.inventory.reorder_level).length,
    outOfStock: products.filter(p => p.available_stock === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.product.price * p.available_stock), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Coffee Inventory Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Monitor your coffee products, stock levels, and inventory alerts
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {!initialized && (
                <Button onClick={initializeSampleData} disabled={initializing}>
                  {initializing ? 'Initializing...' : 'Load Sample Data'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <Package className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Stock</p>
                  <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Alerts */}
        {alerts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Inventory Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="font-medium">{alert.product_name}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                    <Badge variant={alert.alert_type === 'out_of_stock' ? 'destructive' : 'default'}>
                      {alert.alert_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="w-5 h-5" />
              Product Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Coffee className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No coffee products found</p>
                <Button onClick={initializeSampleData} disabled={initializing}>
                  {initializing ? 'Loading Sample Data...' : 'Initialize Sample Data'}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Product</th>
                      <th className="text-left p-4">Origin</th>
                      <th className="text-left p-4">Price</th>
                      <th className="text-center p-4">Available Stock</th>
                      <th className="text-center p-4">Reserved</th>
                      <th className="text-center p-4">Reorder Level</th>
                      <th className="text-center p-4">Status</th>
                      <th className="text-center p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((item) => {
                      const { product, inventory, available_stock } = item
                      const isLowStock = available_stock <= inventory.reorder_level && available_stock > 0
                      const isOutOfStock = available_stock === 0
                      
                      return (
                        <tr key={product._id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {product.roast_level} roast • Intensity {product.intensity}/10
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">{product.origin}</td>
                          <td className="p-4">${(product.price / 100).toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <span className={`font-medium ${
                              isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {available_stock}
                            </span>
                          </td>
                          <td className="p-4 text-center">{inventory.reserved_stock}</td>
                          <td className="p-4 text-center">{inventory.reorder_level}</td>
                          <td className="p-4 text-center">
                            <Badge variant={
                              isOutOfStock ? 'destructive' : 
                              isLowStock ? 'default' : 'secondary'
                            }>
                              {isOutOfStock ? 'Out of Stock' : 
                               isLowStock ? 'Low Stock' : 'In Stock'}
                            </Badge>
                          </td>
                          <td className="p-4 text-center">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
import React, { useState, useEffect } from 'react';
import { Package, Calendar, Settings, CreditCard, MapPin, Coffee, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { table } from '@devvai/devv-code-backend';

interface Subscription {
  _id: string;
  subscription_plan: 'discovery' | 'signature' | 'premium';
  status: 'active' | 'paused' | 'cancelled' | 'pending';
  delivery_frequency: 'weekly' | 'bi-weekly' | 'monthly';
  bag_quantity: number;
  next_delivery_date: string;
  last_delivery_date?: string;
  preferred_intensity: number;
  preferred_roast_levels: string;
  total_deliveries: number;
  created_at: string;
}

interface Order {
  _id: string;
  order_number: string;
  order_status: string;
  order_type: string;
  order_date: string;
  total_amount: number;
  order_items: string;
  tracking_number?: string;
  estimated_delivery?: string;
}

function DashboardPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load subscriptions
      const subscriptionsResponse = await table.getItems('evn00i73xszk', {
        query: { customer_email: user.email },
        limit: 10
      });

      // Load recent orders
      const ordersResponse = await table.getItems('evn0gqq0jvuo', {
        query: { customer_email: user.email },
        limit: 5,
        sort: 'order_date',
        order: 'desc'
      });

      setSubscriptions(subscriptionsResponse.items.map(item => ({
        _id: item._id,
        subscription_plan: item.subscription_plan,
        status: item.status,
        delivery_frequency: item.delivery_frequency,
        bag_quantity: item.bag_quantity,
        next_delivery_date: item.next_delivery_date,
        last_delivery_date: item.last_delivery_date,
        preferred_intensity: item.preferred_intensity,
        preferred_roast_levels: item.preferred_roast_levels,
        total_deliveries: item.total_deliveries,
        created_at: item.created_at
      })));

      setRecentOrders(ordersResponse.items.map(item => ({
        _id: item._id,
        order_number: item.order_number,
        order_status: item.order_status,
        order_type: item.order_type,
        order_date: item.order_date,
        total_amount: item.total_amount,
        order_items: item.order_items,
        tracking_number: item.tracking_number,
        estimated_delivery: item.estimated_delivery
      })));

    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load your subscription and order information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanDetails = (plan: string) => {
    switch (plan) {
      case 'discovery':
        return { name: 'Discovery', price: '$14.99', description: 'Explore new flavors monthly' };
      case 'signature':
        return { name: 'Signature', price: '$24.99', description: 'Premium blends & single origins' };
      case 'premium':
        return { name: 'Premium', price: '$39.99', description: 'Rare & exotic coffees' };
      default:
        return { name: plan, price: '', description: '' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-roast-light border-t-roast-medium rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-roast-medium">Loading your coffee journey...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream">
        {/* Header */}
        <div className="bg-gradient-to-r from-roast-dark to-roast-medium text-cream">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user?.name || 'Coffee Lover'}!
                </h1>
                <p className="text-cream/80">
                  Manage your subscription and track your coffee journey
                </p>
              </div>
              <div className="w-16 h-16 bg-cream/20 rounded-full flex items-center justify-center">
                <Coffee className="w-8 h-8 text-cream" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Package className="h-4 w-4 text-roast-medium" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-roast-dark">
                  {subscriptions.filter(s => s.status === 'active').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                <TrendingUp className="h-4 w-4 text-roast-medium" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-roast-dark">
                  {subscriptions.reduce((sum, s) => sum + s.total_deliveries, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
                <Clock className="h-4 w-4 text-roast-medium" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-roast-dark">
                  {recentOrders.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Membership Since</CardTitle>
                <CheckCircle className="h-4 w-4 text-roast-medium" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-roast-dark">
                  {user?.created_at ? new Date(user.created_at).getFullYear() : '2024'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Subscriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-roast-medium" />
                  Your Subscriptions
                </CardTitle>
                <CardDescription>
                  Manage your coffee delivery preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptions.length === 0 ? (
                    <div className="text-center py-8">
                      <Coffee className="w-12 h-12 text-roast-light mx-auto mb-4" />
                      <p className="text-roast-medium mb-4">No active subscriptions</p>
                      <Button className="bg-roast-medium hover:bg-roast-dark text-cream">
                        Start Your Coffee Journey
                      </Button>
                    </div>
                  ) : (
                    subscriptions.map((subscription) => {
                      const planDetails = getPlanDetails(subscription.subscription_plan);
                      return (
                        <div key={subscription._id} className="border border-roast-light/20 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-roast-dark">{planDetails.name} Plan</h3>
                              <p className="text-sm text-roast-medium">{planDetails.description}</p>
                            </div>
                            <Badge className={getStatusColor(subscription.status)}>
                              {subscription.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-roast-medium">Delivery:</span>
                              <div className="font-medium text-roast-dark capitalize">
                                {subscription.delivery_frequency.replace('-', ' ')}
                              </div>
                            </div>
                            <div>
                              <span className="text-roast-medium">Quantity:</span>
                              <div className="font-medium text-roast-dark">
                                {subscription.bag_quantity} bag{subscription.bag_quantity > 1 ? 's' : ''}
                              </div>
                            </div>
                            <div>
                              <span className="text-roast-medium">Next Delivery:</span>
                              <div className="font-medium text-roast-dark">
                                {formatDate(subscription.next_delivery_date)}
                              </div>
                            </div>
                            <div>
                              <span className="text-roast-medium">Intensity:</span>
                              <div className="font-medium text-roast-dark">
                                {subscription.preferred_intensity}/10
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="outline" className="text-roast-medium border-roast-light">
                              <Settings className="w-4 h-4 mr-1" />
                              Modify
                            </Button>
                            <Button size="sm" variant="outline" className="text-roast-medium border-roast-light">
                              <Calendar className="w-4 h-4 mr-1" />
                              Schedule
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-roast-medium" />
                  Recent Orders
                </CardTitle>
                <CardDescription>
                  Track your recent coffee orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-roast-light mx-auto mb-4" />
                      <p className="text-roast-medium">No recent orders</p>
                    </div>
                  ) : (
                    recentOrders.map((order) => (
                      <div key={order._id} className="border border-roast-light/20 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-roast-dark">
                              Order #{order.order_number}
                            </h3>
                            <p className="text-sm text-roast-medium">
                              {formatDate(order.order_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-roast-dark">
                              {formatPrice(order.total_amount)}
                            </div>
                            <Badge className={getStatusColor(order.order_status)}>
                              {order.order_status}
                            </Badge>
                          </div>
                        </div>
                        
                        {order.tracking_number && (
                          <div className="text-sm text-roast-medium">
                            <span className="font-medium">Tracking:</span> {order.tracking_number}
                          </div>
                        )}
                        
                        {order.estimated_delivery && (
                          <div className="text-sm text-roast-medium">
                            <span className="font-medium">Est. Delivery:</span> {formatDate(order.estimated_delivery)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Settings Preview */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-roast-medium" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Quick access to your account preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 text-left border-roast-light/20"
                  onClick={() => toast({ title: "Profile", description: "Profile settings coming soon!" })}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-roast-light/10 rounded-full flex items-center justify-center">
                      <Settings className="w-5 h-5 text-roast-medium" />
                    </div>
                    <div>
                      <div className="font-medium text-roast-dark">Coffee Preferences</div>
                      <div className="text-sm text-roast-medium">Intensity, roast levels</div>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 text-left border-roast-light/20"
                  onClick={() => toast({ title: "Shipping", description: "Address management coming soon!" })}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-roast-light/10 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-roast-medium" />
                    </div>
                    <div>
                      <div className="font-medium text-roast-dark">Shipping Addresses</div>
                      <div className="text-sm text-roast-medium">Manage delivery locations</div>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 text-left border-roast-light/20"
                  onClick={() => toast({ title: "Payment", description: "Payment settings coming soon!" })}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-roast-light/10 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-roast-medium" />
                    </div>
                    <div>
                      <div className="font-medium text-roast-dark">Payment Methods</div>
                      <div className="text-sm text-roast-medium">Cards & billing info</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default DashboardPage;
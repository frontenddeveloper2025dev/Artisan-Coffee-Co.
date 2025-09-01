import React, { useState } from 'react';
import { Bell, BellRing, Check, X, Settings, Filter, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications, NotificationData } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: NotificationData;
  onMarkRead: (id: string) => void;
  onClear: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkRead, onClear }) => {
  const priorityColors = {
    low: 'bg-blue-50 border-blue-200',
    medium: 'bg-yellow-50 border-yellow-200',
    high: 'bg-orange-50 border-orange-200',
    critical: 'bg-red-50 border-red-200'
  };

  const categoryIcons = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  const typeColors = {
    inventory: 'bg-purple-100 text-purple-800',
    order: 'bg-green-100 text-green-800',
    subscription: 'bg-blue-100 text-blue-800',
    system: 'bg-gray-100 text-gray-800',
    promotion: 'bg-pink-100 text-pink-800'
  };

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${
        !notification.read ? 'border-l-4 border-l-coffee-bean' : ''
      } ${priorityColors[notification.priority]}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{categoryIcons[notification.category]}</span>
            <div>
              <CardTitle className="text-sm font-medium">{notification.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${typeColors[notification.type]}`}>
                  {notification.type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {notification.priority}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkRead(notification.id)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClear(notification.id)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm mb-2">
          {notification.message}
        </CardDescription>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
          </span>
          {notification.actionable && notification.actionCallback && (
            <Button
              variant="outline"
              size="sm"
              onClick={notification.actionCallback}
              className="h-7 text-xs"
            >
              {notification.actionLabel || 'Action'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface NotificationCenterProps {
  trigger?: React.ReactNode;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ trigger }) => {
  const {
    notifications,
    unreadCount,
    preferences,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    updatePreferences,
    requestDesktopPermission,
    getNotificationsByType
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | NotificationData['type']>('all');
  const [isOpen, setIsOpen] = useState(false);

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : getNotificationsByType(filter);

  const handleRequestDesktopPermission = async () => {
    const granted = await requestDesktopPermission();
    if (granted) {
      updatePreferences({ desktop: true });
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="relative">
      {unreadCount > 0 ? (
        <BellRing className="h-5 w-5" />
      ) : (
        <Bell className="h-5 w-5" />
      )}
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark All Read
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Notification Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="inventory-notifications">Inventory Alerts</Label>
                        <Switch
                          id="inventory-notifications"
                          checked={preferences.inventory}
                          onCheckedChange={(checked) => updatePreferences({ inventory: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="order-notifications">Order Updates</Label>
                        <Switch
                          id="order-notifications"
                          checked={preferences.orders}
                          onCheckedChange={(checked) => updatePreferences({ orders: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="subscription-notifications">Subscription Alerts</Label>
                        <Switch
                          id="subscription-notifications"
                          checked={preferences.subscriptions}
                          onCheckedChange={(checked) => updatePreferences({ subscriptions: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="promotion-notifications">Promotions</Label>
                        <Switch
                          id="promotion-notifications"
                          checked={preferences.promotions}
                          onCheckedChange={(checked) => updatePreferences({ promotions: checked })}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sound-notifications">Sound Alerts</Label>
                        <Switch
                          id="sound-notifications"
                          checked={preferences.sound}
                          onCheckedChange={(checked) => updatePreferences({ sound: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="desktop-notifications"
                            checked={preferences.desktop}
                            onCheckedChange={(checked) => updatePreferences({ desktop: checked })}
                          />
                          {!preferences.desktop && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRequestDesktopPermission}
                              className="h-6 text-xs"
                            >
                              Enable
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </SheetTitle>
          <SheetDescription>
            Stay updated with your coffee orders and inventory
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="text-xs">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="inventory" className="text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter
                </TabsTrigger>
                <TabsTrigger value="order" className="text-xs">
                  Orders
                </TabsTrigger>
              </TabsList>
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="h-8 ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <TabsContent value="all" className="mt-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredNotifications.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center">
                          No notifications yet.<br />
                          We'll keep you updated on your orders and inventory.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkRead={markAsRead}
                        onClear={clearNotification}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="inventory" className="mt-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {getNotificationsByType('inventory').map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markAsRead}
                      onClear={clearNotification}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="order" className="mt-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {getNotificationsByType('order').map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markAsRead}
                      onClear={clearNotification}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;
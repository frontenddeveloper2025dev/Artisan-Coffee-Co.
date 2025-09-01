import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { useInventory } from '@/hooks/use-inventory';

export interface NotificationData {
  id: string;
  type: 'inventory' | 'order' | 'subscription' | 'system' | 'promotion';
  category: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
  actionLabel?: string;
  actionCallback?: () => void;
  persistent?: boolean;
  autoHide?: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationPreferences {
  inventory: boolean;
  orders: boolean;
  subscriptions: boolean;
  promotions: boolean;
  system: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  inventory: true,
  orders: true,
  subscriptions: true,
  promotions: true,
  system: true,
  sound: false,
  desktop: false,
  email: true,
};

export function useNotifications() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { inventoryStats } = useInventory();
  
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isConnected, setIsConnected] = useState(true);

  // Notification sound
  const playNotificationSound = useCallback((priority: NotificationData['priority']) => {
    if (!preferences.sound) return;
    
    try {
      // Create different tones based on priority
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Different frequencies for different priorities
      const frequencies = {
        low: 400,
        medium: 600,
        high: 800,
        critical: 1000
      };
      
      oscillator.frequency.setValueAtTime(frequencies[priority], context.currentTime);
      oscillator.type = priority === 'critical' ? 'sawtooth' : 'sine';
      
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [preferences.sound]);

  // Desktop notification
  const showDesktopNotification = useCallback((notification: NotificationData) => {
    if (!preferences.desktop || !('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      const desktopNotification = new Notification(`Artisan Coffee - ${notification.title}`, {
        body: notification.message,
        icon: '/coffee-icon.png',
        badge: '/coffee-badge.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
      });
      
      desktopNotification.onclick = () => {
        window.focus();
        if (notification.actionCallback) {
          notification.actionCallback();
        }
        desktopNotification.close();
      };
      
      // Auto-close after 5 seconds unless critical
      if (notification.priority !== 'critical') {
        setTimeout(() => desktopNotification.close(), 5000);
      }
    }
  }, [preferences.desktop]);

  // Request desktop notification permission
  const requestDesktopPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return Notification.permission === 'granted';
  }, []);

  // Add notification
  const addNotification = useCallback((data: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => {
    const notification: NotificationData = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    // Check if this type is enabled
    if (!preferences[data.type as keyof NotificationPreferences]) return;

    setNotifications(prev => [notification, ...prev].slice(0, 100)); // Keep only latest 100

    // Show toast notification
    const toastVariant = {
      info: 'default',
      success: 'default',
      warning: 'destructive',
      error: 'destructive'
    }[data.category] as 'default' | 'destructive';

    toast({
      title: notification.title,
      description: notification.message,
      variant: toastVariant,
      action: notification.actionable && notification.actionCallback ? {
        altText: notification.actionLabel || 'Action',
        onClick: notification.actionCallback,
        children: notification.actionLabel || 'Action'
      } : undefined,
    });

    // Play sound
    playNotificationSound(notification.priority);

    // Show desktop notification
    showDesktopNotification(notification);

    return notification.id;
  }, [preferences, toast, playNotificationSound, showDesktopNotification]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Clear notification
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  // Inventory monitoring
  useEffect(() => {
    if (!inventoryStats || !preferences.inventory) return;

    const checkInventoryAlerts = () => {
      // Low stock alerts
      if (inventoryStats.lowStock > 0) {
        addNotification({
          type: 'inventory',
          category: 'warning',
          title: 'Low Stock Alert',
          message: `${inventoryStats.lowStock} products are running low on stock`,
          priority: 'medium',
          actionable: true,
          actionLabel: 'View Inventory',
          actionCallback: () => {
            // Navigate to inventory dashboard
            window.location.hash = '#inventory';
          }
        });
      }

      // Out of stock alerts
      if (inventoryStats.outOfStock > 0) {
        addNotification({
          type: 'inventory',
          category: 'error',
          title: 'Out of Stock Alert',
          message: `${inventoryStats.outOfStock} products are out of stock`,
          priority: 'high',
          actionable: true,
          actionLabel: 'Restock Now',
          actionCallback: () => {
            window.location.hash = '#restock';
          }
        });
      }

      // High demand alerts
      if (inventoryStats.totalReserved > inventoryStats.totalStock * 0.8) {
        addNotification({
          type: 'inventory',
          category: 'info',
          title: 'High Demand Alert',
          message: 'Stock levels are getting low due to high demand',
          priority: 'medium'
        });
      }
    };

    // Check immediately and then every 5 minutes
    checkInventoryAlerts();
    const interval = setInterval(checkInventoryAlerts, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [inventoryStats, preferences.inventory, addNotification]);

  // System status monitoring
  useEffect(() => {
    const checkSystemStatus = () => {
      // Simulate connection monitoring
      const wasConnected = isConnected;
      const nowConnected = navigator.onLine;
      
      if (wasConnected && !nowConnected) {
        addNotification({
          type: 'system',
          category: 'error',
          title: 'Connection Lost',
          message: 'Internet connection has been lost. Some features may not work properly.',
          priority: 'high',
          persistent: true
        });
      } else if (!wasConnected && nowConnected) {
        addNotification({
          type: 'system',
          category: 'success',
          title: 'Connection Restored',
          message: 'Internet connection has been restored.',
          priority: 'medium'
        });
      }
      
      setIsConnected(nowConnected);
    };

    window.addEventListener('online', checkSystemStatus);
    window.addEventListener('offline', checkSystemStatus);

    return () => {
      window.removeEventListener('online', checkSystemStatus);
      window.removeEventListener('offline', checkSystemStatus);
    };
  }, [isConnected, addNotification]);

  // Welcome notification for new users
  useEffect(() => {
    if (user && notifications.length === 0) {
      setTimeout(() => {
        addNotification({
          type: 'system',
          category: 'info',
          title: `Welcome, ${user.name || 'Coffee Lover'}!`,
          message: 'Discover our premium coffee selection and personalized recommendations.',
          priority: 'low',
          actionable: true,
          actionLabel: 'Explore Coffees',
          actionCallback: () => {
            document.getElementById('coffee-varieties')?.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }, 2000);
    }
  }, [user, notifications.length, addNotification]);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get notifications by type
  const getNotificationsByType = useCallback((type: NotificationData['type']) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Get notifications by priority
  const getNotificationsByPriority = useCallback((priority: NotificationData['priority']) => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    preferences,
    isConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    updatePreferences,
    requestDesktopPermission,
    getNotificationsByType,
    getNotificationsByPriority
  };
}

// Utility functions for common notifications
export const NotificationHelpers = {
  orderConfirmed: (orderNumber: string) => ({
    type: 'order' as const,
    category: 'success' as const,
    title: 'Order Confirmed',
    message: `Your order #${orderNumber} has been confirmed and is being prepared.`,
    priority: 'medium' as const,
  }),

  orderShipped: (orderNumber: string, trackingNumber: string) => ({
    type: 'order' as const,
    category: 'info' as const,
    title: 'Order Shipped',
    message: `Your order #${orderNumber} has been shipped. Tracking: ${trackingNumber}`,
    priority: 'medium' as const,
    actionable: true,
    actionLabel: 'Track Package',
    actionCallback: () => {
      window.open(`https://tracking.example.com/${trackingNumber}`, '_blank');
    },
  }),

  subscriptionRenewal: (days: number) => ({
    type: 'subscription' as const,
    category: 'info' as const,
    title: 'Subscription Renewal',
    message: `Your subscription will renew in ${days} days.`,
    priority: 'low' as const,
  }),

  productRecommendation: (productName: string) => ({
    type: 'promotion' as const,
    category: 'info' as const,
    title: 'New Recommendation',
    message: `Based on your preferences, you might like ${productName}`,
    priority: 'low' as const,
  }),

  inventoryLow: (productName: string, stock: number) => ({
    type: 'inventory' as const,
    category: 'warning' as const,
    title: 'Low Stock Alert',
    message: `${productName} has only ${stock} units remaining`,
    priority: 'medium' as const,
  }),

  inventoryOut: (productName: string) => ({
    type: 'inventory' as const,
    category: 'error' as const,
    title: 'Out of Stock',
    message: `${productName} is now out of stock`,
    priority: 'high' as const,
  }),
};
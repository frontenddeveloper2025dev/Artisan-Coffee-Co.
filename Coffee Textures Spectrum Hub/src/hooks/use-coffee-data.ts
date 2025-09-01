// Custom hook for coffee data management
import { useState, useEffect, useCallback } from 'react';
import { CoffeeDataService } from '@/services/coffee-data';
import type { 
  CoffeeProduct, 
  ProductWithInventory, 
  InventoryAlert,
  SubscriptionFormData
} from '@/types/coffee';

export function useCoffeeProducts() {
  const [products, setProducts] = useState<CoffeeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CoffeeDataService.getAllProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts
  };
}

export function useProductsWithInventory() {
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductsWithInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CoffeeDataService.getProductsWithInventory();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products with inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductsWithInventory();
  }, [fetchProductsWithInventory]);

  return {
    products,
    loading,
    error,
    refetch: fetchProductsWithInventory
  };
}

export function useProductsByRoastLevel(roastLevel: string) {
  const [products, setProducts] = useState<CoffeeProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductsByRoast = useCallback(async () => {
    if (!roastLevel) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await CoffeeDataService.getProductsByRoastLevel(roastLevel);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products by roast level');
    } finally {
      setLoading(false);
    }
  }, [roastLevel]);

  useEffect(() => {
    fetchProductsByRoast();
  }, [fetchProductsByRoast]);

  return {
    products,
    loading,
    error,
    refetch: fetchProductsByRoast
  };
}

export function useProductRecommendations(intensity: number, roastLevels: string[]) {
  const [recommendations, setRecommendations] = useState<CoffeeProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (intensity < 1 || intensity > 10) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await CoffeeDataService.getRecommendedProducts(intensity, roastLevels);
      setRecommendations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  }, [intensity, roastLevels]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations
  };
}

export function useInventoryAlerts() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CoffeeDataService.getInventoryAlerts();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts
  };
}

export function useProductAvailability() {
  const [availabilityCache, setAvailabilityCache] = useState<Record<string, boolean>>({});
  
  const checkAvailability = useCallback(async (productId: string, quantity: number = 1) => {
    const cacheKey = `${productId}-${quantity}`;
    
    if (availabilityCache[cacheKey] !== undefined) {
      return availabilityCache[cacheKey];
    }

    try {
      const isAvailable = await CoffeeDataService.checkProductAvailability(productId, quantity);
      setAvailabilityCache(prev => ({
        ...prev,
        [cacheKey]: isAvailable
      }));
      return isAvailable;
    } catch (error) {
      console.error('Failed to check availability:', error);
      return false;
    }
  }, [availabilityCache]);

  const clearCache = useCallback(() => {
    setAvailabilityCache({});
  }, []);

  return {
    checkAvailability,
    clearCache
  };
}

export function useSubscriptionCreation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubscription = useCallback(async (formData: SubscriptionFormData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await CoffeeDataService.createSubscription(formData);
      
      if (!result.success) {
        setError(result.error || 'Failed to create subscription');
        return false;
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createSubscription,
    loading,
    error,
    clearError: () => setError(null)
  };
}

// Initialize sample data hook (for development/demo)
export function useSampleDataInitialization() {
  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const initializeSampleData = useCallback(async () => {
    if (initialized || initializing) return;
    
    try {
      setInitializing(true);
      await CoffeeDataService.initializeSampleData();
      setInitialized(true);
    } catch (error) {
      console.error('Failed to initialize sample data:', error);
    } finally {
      setInitializing(false);
    }
  }, [initialized, initializing]);

  return {
    initializeSampleData,
    initialized,
    initializing
  };
}
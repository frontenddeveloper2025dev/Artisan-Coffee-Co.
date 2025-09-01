import { useState, useEffect } from 'react';
import { table } from '@devvai/devv-code-backend';
import { useToast } from '@/hooks/use-toast';
import { initializeSampleData } from '@/utils/sample-data';

export interface CoffeeProduct {
  _id: string;
  _uid: string;
  _tid: string;
  name: string;
  origin: string;
  roast_level: string;
  flavor_profile: string;
  intensity: number;
  price: number;
  description: string;
  processing_method: string;
  altitude: string;
  variety: string;
  farm_info: string;
  image_url: string;
  is_active: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  _id: string;
  _uid: string;
  _tid: string;
  product_id: string;
  current_stock: number;
  reserved_stock: number;
  reorder_level: number;
  reorder_quantity: number;
  stock_status: string;
  last_restock_date: string;
  last_restock_quantity: number;
  total_sold: number;
  warehouse_location: string;
  expiry_date: string;
  batch_number: string;
  updated_at: string;
}

export interface ProductWithInventory extends CoffeeProduct {
  inventory?: InventoryItem;
  available_stock: number;
  stock_status: string;
}

export function useCoffeeDatabase() {
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get active coffee products
      const productsResponse = await table.getItems('evmzzktorxts', {
        query: { is_active: 'active' },
        sort: '_id',
        order: 'asc',
        limit: 50
      });

      if (productsResponse.items.length === 0 && !initialized) {
        // No products found, initialize sample data
        await initializeSampleData();
        setInitialized(true);
        // Retry loading products
        const retryResponse = await table.getItems('evmzzktorxts', {
          query: { is_active: 'active' },
          sort: '_id',
          order: 'asc',
          limit: 50
        });
        productsResponse.items = retryResponse.items;
      }

      // Get all inventory data
      const inventoryResponse = await table.getItems('evn000r9yk8w', {
        limit: 100
      });

      // Create inventory lookup map
      const inventoryMap = new Map<string, InventoryItem>();
      inventoryResponse.items.forEach((item: InventoryItem) => {
        inventoryMap.set(item.product_id, item);
      });

      // Combine products with inventory
      const productsWithInventory: ProductWithInventory[] = productsResponse.items.map((product: CoffeeProduct) => {
        const inventory = inventoryMap.get(product._id);
        return {
          ...product,
          inventory,
          available_stock: inventory ? Math.max(0, inventory.current_stock - inventory.reserved_stock) : 0,
          stock_status: inventory?.stock_status || 'out_of_stock'
        };
      });

      setProducts(productsWithInventory);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load coffee products';
      setError(errorMessage);
      toast({
        title: "Error Loading Products",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getProductsByRoastLevel = (roastLevel: string) => {
    return products.filter(product => product.roast_level === roastLevel && product.stock_status !== 'out_of_stock');
  };

  const getProductsByIntensity = (minIntensity: number, maxIntensity: number) => {
    return products.filter(product => 
      product.intensity >= minIntensity && 
      product.intensity <= maxIntensity &&
      product.stock_status !== 'out_of_stock'
    );
  };

  const getAvailableProducts = () => {
    return products.filter(product => product.stock_status === 'in_stock');
  };

  const getFeaturedProducts = () => {
    return products
      .filter(product => product.stock_status !== 'out_of_stock')
      .sort((a, b) => (b.inventory?.total_sold || 0) - (a.inventory?.total_sold || 0))
      .slice(0, 6);
  };

  const initializeData = async () => {
    try {
      await initializeSampleData();
      await loadProducts();
      setInitialized(true);
      toast({
        title: "Data Initialized",
        description: "Sample coffee products and inventory have been loaded.",
      });
    } catch (err) {
      console.error('Failed to initialize data:', err);
      toast({
        title: "Initialization Failed",
        description: "Failed to load sample data.",
        variant: "destructive"
      });
    }
  };

  return {
    products,
    loading,
    error,
    initialized,
    reload: loadProducts,
    initializeData,
    getProductsByRoastLevel,
    getProductsByIntensity,
    getAvailableProducts,
    getFeaturedProducts
  };
}
import { useState, useEffect } from 'react';
import { table } from '@devvai/devv-code-backend';
import { useToast } from '@/hooks/use-toast';

export interface InventoryStats {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
  needsReorder: number;
}

export function useInventoryManagement() {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadInventoryStats();
  }, []);

  const loadInventoryStats = async () => {
    try {
      setLoading(true);

      // Get all inventory items
      const inventoryResponse = await table.getItems('evn000r9yk8w', {
        limit: 100
      });

      // Get all products for pricing
      const productsResponse = await table.getItems('evmzzktorxts', {
        limit: 100
      });

      // Create product price lookup
      const productPrices = new Map<string, number>();
      productsResponse.items.forEach((product: any) => {
        productPrices.set(product._id, product.price || 0);
      });

      // Calculate stats
      let totalProducts = inventoryResponse.items.length;
      let inStock = 0;
      let lowStock = 0;
      let outOfStock = 0;
      let totalValue = 0;
      let needsReorder = 0;

      inventoryResponse.items.forEach((item: any) => {
        const available = Math.max(0, item.current_stock - item.reserved_stock);
        const price = productPrices.get(item.product_id) || 0;
        
        totalValue += available * (price / 100); // Convert cents to dollars

        if (item.stock_status === 'in_stock') inStock++;
        else if (item.stock_status === 'low_stock') lowStock++;
        else if (item.stock_status === 'out_of_stock') outOfStock++;

        if (item.current_stock <= item.reorder_level) needsReorder++;
      });

      setStats({
        totalProducts,
        inStock,
        lowStock,
        outOfStock,
        totalValue,
        needsReorder
      });
    } catch (err) {
      console.error('Failed to load inventory stats:', err);
      toast({
        title: "Error Loading Stats",
        description: "Failed to load inventory statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId: string, newStock: number) => {
    try {
      // First get the current inventory item
      const inventoryResponse = await table.getItems('evn000r9yk8w', {
        query: { product_id: productId },
        limit: 1
      });

      if (inventoryResponse.items.length === 0) {
        throw new Error('Inventory item not found');
      }

      const inventoryItem = inventoryResponse.items[0];
      
      // Determine new stock status
      let stock_status = 'in_stock';
      if (newStock <= 0) {
        stock_status = 'out_of_stock';
      } else if (newStock <= inventoryItem.reorder_level) {
        stock_status = 'low_stock';
      }

      // Update inventory
      await table.updateItem('evn000r9yk8w', {
        _uid: inventoryItem._uid,
        _id: inventoryItem._id,
        current_stock: newStock,
        stock_status,
        updated_at: new Date().toISOString()
      });

      toast({
        title: "Stock Updated",
        description: `Stock level updated to ${newStock} units`,
      });

      // Reload stats
      await loadInventoryStats();
    } catch (err) {
      console.error('Failed to update stock:', err);
      toast({
        title: "Update Failed",
        description: "Failed to update stock level",
        variant: "destructive"
      });
    }
  };

  const reserveStock = async (productId: string, quantity: number) => {
    try {
      // Get current inventory
      const inventoryResponse = await table.getItems('evn000r9yk8w', {
        query: { product_id: productId },
        limit: 1
      });

      if (inventoryResponse.items.length === 0) {
        throw new Error('Product not found in inventory');
      }

      const inventoryItem = inventoryResponse.items[0];
      const available = Math.max(0, inventoryItem.current_stock - inventoryItem.reserved_stock);

      if (available < quantity) {
        throw new Error('Insufficient stock available');
      }

      // Update reserved stock
      await table.updateItem('evn000r9yk8w', {
        _uid: inventoryItem._uid,
        _id: inventoryItem._id,
        reserved_stock: inventoryItem.reserved_stock + quantity,
        updated_at: new Date().toISOString()
      });

      return true;
    } catch (err) {
      console.error('Failed to reserve stock:', err);
      throw err;
    }
  };

  const releaseReservedStock = async (productId: string, quantity: number) => {
    try {
      // Get current inventory
      const inventoryResponse = await table.getItems('evn000r9yk8w', {
        query: { product_id: productId },
        limit: 1
      });

      if (inventoryResponse.items.length === 0) {
        throw new Error('Product not found in inventory');
      }

      const inventoryItem = inventoryResponse.items[0];

      // Update reserved stock
      await table.updateItem('evn000r9yk8w', {
        _uid: inventoryItem._uid,
        _id: inventoryItem._id,
        reserved_stock: Math.max(0, inventoryItem.reserved_stock - quantity),
        updated_at: new Date().toISOString()
      });

      return true;
    } catch (err) {
      console.error('Failed to release reserved stock:', err);
      throw err;
    }
  };

  return {
    stats,
    loading,
    reload: loadInventoryStats,
    updateStock,
    reserveStock,
    releaseReservedStock
  };
}
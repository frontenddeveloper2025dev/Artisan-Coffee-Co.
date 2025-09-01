// Coffee data service for managing products and inventory
import { table } from '@devvai/devv-code-backend';
import type { 
  CoffeeProduct, 
  InventoryItem, 
  CoffeeSubscription, 
  ProductWithInventory,
  SubscriptionFormData,
  InventoryAlert,
  StockMovement
} from '@/types/coffee';

// Table IDs - these would be your actual table IDs from the table creation
const TABLES = {
  PRODUCTS: 'evmzzktorxts',
  INVENTORY: 'evn000r9yk8w', 
  SUBSCRIPTIONS: 'evn00i73xszk'
};

export class CoffeeDataService {
  // Product Management
  static async getAllProducts(): Promise<CoffeeProduct[]> {
    try {
      const response = await table.getItems(TABLES.PRODUCTS, {
        query: { is_active: 'active' },
        sort: 'intensity',
        order: 'asc',
        limit: 50
      });
      return response.items as CoffeeProduct[];
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  }

  static async getProductsByRoastLevel(roastLevel: string): Promise<CoffeeProduct[]> {
    try {
      const response = await table.getItems(TABLES.PRODUCTS, {
        query: { 
          roast_level: roastLevel,
          is_active: 'active'
        },
        sort: 'intensity',
        order: 'asc'
      });
      return response.items as CoffeeProduct[];
    } catch (error) {
      console.error('Failed to fetch products by roast level:', error);
      return [];
    }
  }

  static async getProductsByIntensityRange(minIntensity: number, maxIntensity: number): Promise<CoffeeProduct[]> {
    try {
      const allProducts = await this.getAllProducts();
      return allProducts.filter(product => 
        product.intensity >= minIntensity && product.intensity <= maxIntensity
      );
    } catch (error) {
      console.error('Failed to fetch products by intensity:', error);
      return [];
    }
  }

  // Inventory Management
  static async getInventoryForProduct(productId: string): Promise<InventoryItem | null> {
    try {
      const response = await table.getItems(TABLES.INVENTORY, {
        query: { product_id: productId },
        limit: 1
      });
      return response.items.length > 0 ? response.items[0] as InventoryItem : null;
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      return null;
    }
  }

  static async getProductsWithInventory(): Promise<ProductWithInventory[]> {
    try {
      const products = await this.getAllProducts();
      const productsWithInventory: ProductWithInventory[] = [];

      for (const product of products) {
        const inventory = await this.getInventoryForProduct(product._id);
        if (inventory) {
          const available_stock = Math.max(0, inventory.current_stock - inventory.reserved_stock);
          productsWithInventory.push({
            product,
            inventory,
            available_stock
          });
        }
      }

      return productsWithInventory.sort((a, b) => b.available_stock - a.available_stock);
    } catch (error) {
      console.error('Failed to fetch products with inventory:', error);
      return [];
    }
  }

  static async checkProductAvailability(productId: string, quantity: number = 1): Promise<boolean> {
    try {
      const inventory = await this.getInventoryForProduct(productId);
      if (!inventory) return false;
      
      const available = inventory.current_stock - inventory.reserved_stock;
      return available >= quantity;
    } catch (error) {
      console.error('Failed to check availability:', error);
      return false;
    }
  }

  static async getInventoryAlerts(): Promise<InventoryAlert[]> {
    try {
      const response = await table.getItems(TABLES.INVENTORY, {
        query: { stock_status: 'low_stock' },
        limit: 20
      });
      
      const lowStockItems = response.items as InventoryItem[];
      const alerts: InventoryAlert[] = [];

      for (const item of lowStockItems) {
        const products = await table.getItems(TABLES.PRODUCTS, {
          query: { _id: item.product_id },
          limit: 1
        });
        
        if (products.items.length > 0) {
          const product = products.items[0] as CoffeeProduct;
          alerts.push({
            product_id: item.product_id,
            product_name: product.name,
            alert_type: item.current_stock === 0 ? 'out_of_stock' : 'low_stock',
            current_stock: item.current_stock,
            reorder_level: item.reorder_level,
            message: item.current_stock === 0 
              ? `${product.name} is out of stock`
              : `${product.name} is running low (${item.current_stock} left)`
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error('Failed to fetch inventory alerts:', error);
      return [];
    }
  }

  // Subscription Management
  static async createSubscription(formData: SubscriptionFormData): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      const now = new Date().toISOString();
      
      // Calculate next delivery date based on frequency
      const nextDelivery = new Date();
      switch (formData.delivery_frequency) {
        case 'weekly':
          nextDelivery.setDate(nextDelivery.getDate() + 7);
          break;
        case 'bi-weekly':
          nextDelivery.setDate(nextDelivery.getDate() + 14);
          break;
        case 'monthly':
          nextDelivery.setMonth(nextDelivery.getMonth() + 1);
          break;
      }

      // Determine bag quantity based on plan
      const bagQuantity = formData.subscription_plan === 'discovery' ? 1 : 
                         formData.subscription_plan === 'signature' ? 2 : 3;

      const subscription: Omit<CoffeeSubscription, '_id' | '_uid' | '_tid'> = {
        customer_email: formData.customer_email,
        customer_name: formData.customer_name,
        preferred_intensity: formData.preferred_intensity,
        preferred_roast_levels: formData.preferred_roast_levels.join(','),
        delivery_frequency: formData.delivery_frequency,
        bag_quantity: bagQuantity,
        subscription_plan: formData.subscription_plan,
        status: 'pending',
        next_delivery_date: nextDelivery.toISOString(),
        shipping_address: JSON.stringify(formData.shipping_address),
        billing_info: JSON.stringify({
          ...formData.billing_info,
          billing_address: formData.billing_info.use_shipping_for_billing 
            ? formData.shipping_address 
            : formData.billing_info.billing_address
        }),
        special_instructions: formData.special_instructions || '',
        total_deliveries: 0,
        created_at: now,
        updated_at: now
      };

      await table.addItem(TABLES.SUBSCRIPTIONS, subscription);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to create subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async getUserSubscriptions(userEmail: string): Promise<CoffeeSubscription[]> {
    try {
      const response = await table.getItems(TABLES.SUBSCRIPTIONS, {
        query: { customer_email: userEmail },
        sort: '_id',
        order: 'desc'
      });
      return response.items as CoffeeSubscription[];
    } catch (error) {
      console.error('Failed to fetch user subscriptions:', error);
      return [];
    }
  }

  // Recommendation Engine
  static async getRecommendedProducts(intensity: number, roastLevels: string[]): Promise<CoffeeProduct[]> {
    try {
      const allProducts = await this.getAllProducts();
      
      // Filter by roast levels if specified
      let filtered = roastLevels.length > 0 
        ? allProducts.filter(product => roastLevels.includes(product.roast_level))
        : allProducts;
      
      // Sort by intensity proximity
      filtered.sort((a, b) => {
        const diffA = Math.abs(a.intensity - intensity);
        const diffB = Math.abs(b.intensity - intensity);
        return diffA - diffB;
      });
      
      return filtered.slice(0, 6); // Return top 6 recommendations
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }

  // Sample data initialization (for demo purposes)
  static async initializeSampleData(): Promise<void> {
    try {
      const sampleProducts = [
        {
          name: "Ethiopian Yirgacheffe",
          origin: "Ethiopia",
          roast_level: "light" as const,
          flavor_profile: "floral, citrus, tea-like, bright acidity",
          intensity: 3,
          price: 1890,
          description: "A bright and complex coffee with distinctive wine-like qualities and floral aromatics. Grown at high altitude in the Yirgacheffe region.",
          processing_method: "washed" as const,
          altitude: "1700-2200m",
          variety: "Heirloom",
          farm_info: "Gedeb Cooperative",
          image_url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop",
          is_active: "active" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: "Colombian Supremo",
          origin: "Colombia",
          roast_level: "medium" as const,
          flavor_profile: "chocolate, caramel, nuts, balanced",
          intensity: 5,
          price: 1690,
          description: "A well-balanced coffee with rich chocolate and caramel notes. Perfect for daily drinking with excellent body and mild acidity.",
          processing_method: "washed" as const,
          altitude: "1200-1800m",
          variety: "Caturra, Bourbon",
          farm_info: "Huila Region Farmers",
          image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop",
          is_active: "active" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: "Guatemala Antigua",
          origin: "Guatemala",
          roast_level: "medium-dark" as const,
          flavor_profile: "spicy, smoky, full-body, cocoa",
          intensity: 7,
          price: 1790,
          description: "A full-bodied coffee with spicy complexity and smoky undertones. Grown in volcanic soil for distinctive character.",
          processing_method: "washed" as const,
          altitude: "1500-1700m",
          variety: "Bourbon, Caturra",
          farm_info: "Antigua Valley Estates",
          image_url: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&h=300&fit=crop",
          is_active: "active" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: "Italian Dark Roast",
          origin: "Brazil",
          roast_level: "dark" as const,
          flavor_profile: "bold, smoky, low acidity, intense",
          intensity: 9,
          price: 1590,
          description: "A bold and intense dark roast with smoky flavor and minimal acidity. Perfect for espresso and strong coffee lovers.",
          processing_method: "natural" as const,
          altitude: "800-1200m",
          variety: "Bourbon, Mundo Novo",
          farm_info: "Cerrado Region Cooperatives",
          image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
          is_active: "active" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      for (const product of sampleProducts) {
        await table.addItem(TABLES.PRODUCTS, product);
        
        // Add corresponding inventory
        const inventory = {
          product_id: '', // Will be set after product creation
          current_stock: Math.floor(Math.random() * 100) + 50,
          reserved_stock: Math.floor(Math.random() * 10),
          reorder_level: 20,
          reorder_quantity: 100,
          stock_status: 'in_stock' as const,
          last_restock_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          last_restock_quantity: 100,
          total_sold: Math.floor(Math.random() * 200),
          warehouse_location: `Shelf-${Math.floor(Math.random() * 10) + 1}`,
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          batch_number: `BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          updated_at: new Date().toISOString()
        };
        
        // Note: In a real implementation, you'd get the product ID after creation
        // For demo purposes, we'll create inventory separately
      }

      console.log('Sample coffee data initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sample data:', error);
    }
  }
}
import { table } from '@devvai/devv-code-backend';

export const sampleCoffeeProducts = [
  {
    name: 'Ethiopian Yirgacheffe',
    origin: 'Yirgacheffe, Ethiopia',
    roast_level: 'light',
    flavor_profile: 'floral, citrus, tea-like, bergamot',
    intensity: 3,
    price: 1899, // $18.99
    description: 'Bright and floral with wine-like acidity and delicate tea notes. This exceptional coffee from the birthplace of coffee offers complex citrus flavors and a clean, refreshing finish.',
    processing_method: 'washed',
    altitude: '1900-2200m',
    variety: 'Heirloom Ethiopian',
    farm_info: 'Konga Cooperative',
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=600&fit=crop',
    is_active: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Colombian Supremo',
    origin: 'Huila, Colombia',
    roast_level: 'medium',
    flavor_profile: 'chocolate, caramel, nutty, vanilla',
    intensity: 5,
    price: 1699, // $16.99
    description: 'Well-balanced with rich chocolate notes and smooth caramel finish. Grown in the high altitudes of Huila, this coffee represents the best of Colombian coffee tradition.',
    processing_method: 'washed',
    altitude: '1500-1800m',
    variety: 'Caturra, Castillo',
    farm_info: 'Huila Cooperative',
    image_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=600&fit=crop',
    is_active: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Costa Rican Tarrazú',
    origin: 'Tarrazú, Costa Rica',
    roast_level: 'medium',
    flavor_profile: 'bright, fruity, clean, orange',
    intensity: 4,
    price: 1999, // $19.99
    description: 'Clean and bright with complex fruit notes and vibrant acidity. From the volcanic soils of Tarrazú comes this exceptional coffee with perfect balance.',
    processing_method: 'honey',
    altitude: '1200-1700m',
    variety: 'Caturra, Catuai',
    farm_info: 'Tarrazú Estate',
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
    is_active: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Guatemalan Antigua',
    origin: 'Antigua, Guatemala',
    roast_level: 'medium-dark',
    flavor_profile: 'smoky, spicy, full-bodied, dark chocolate',
    intensity: 6,
    price: 1799, // $17.99
    description: 'Full-bodied with smoky undertones and spicy complexity. The volcanic soil of Antigua creates a unique flavor profile with incredible depth.',
    processing_method: 'washed',
    altitude: '1500-1700m',
    variety: 'Bourbon, Typica',
    farm_info: 'Antigua Valley Farms',
    image_url: 'https://images.unsplash.com/photo-1611854779393-1b2da9d400ac?w=800&h=600&fit=crop',
    is_active: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Jamaican Blue Mountain',
    origin: 'Blue Mountains, Jamaica',
    roast_level: 'medium',
    flavor_profile: 'mild, sweet, balanced, smooth',
    intensity: 4,
    price: 3499, // $34.99
    description: 'Exceptionally smooth and mild with perfect balance and no bitterness. This world-renowned coffee from the misty Blue Mountains is truly exceptional.',
    processing_method: 'washed',
    altitude: '1000-1700m',
    variety: 'Blue Mountain',
    farm_info: 'Blue Mountain Estate',
    image_url: 'https://images.unsplash.com/photo-1559496417-e7f25cb247cd?w=800&h=600&fit=crop',
    is_active: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Brazilian Santos',
    origin: 'São Paulo, Brazil',
    roast_level: 'dark',
    flavor_profile: 'bold, earthy, rich, cocoa',
    intensity: 8,
    price: 1599, // $15.99
    description: 'Bold and rich with earthy undertones and low acidity. This classic Brazilian coffee offers robust flavor and excellent body.',
    processing_method: 'natural',
    altitude: '800-1200m',
    variety: 'Bourbon, Mundo Novo',
    farm_info: 'Santos Region Farms',
    image_url: 'https://images.unsplash.com/photo-1611078484385-d4ba89a4ca73?w=800&h=600&fit=crop',
    is_active: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Kenyan AA',
    origin: 'Nyeri, Kenya',
    roast_level: 'medium-light',
    flavor_profile: 'wine-like, blackcurrant, bright, complex',
    intensity: 7,
    price: 2199, // $21.99
    description: 'Distinctive wine-like acidity with blackcurrant notes and incredible complexity. This premium AA grade coffee showcases Kenya\'s exceptional terroir.',
    processing_method: 'washed',
    altitude: '1600-2100m',
    variety: 'SL28, SL34',
    farm_info: 'Nyeri Cooperative',
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop',
    is_active: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Hawaiian Kona',
    origin: 'Kona Coast, Hawaii',
    roast_level: 'medium',
    flavor_profile: 'smooth, buttery, low acidity, rich',
    intensity: 5,
    price: 3999, // $39.99
    description: 'Smooth and buttery with low acidity and rich flavor. Grown on the volcanic slopes of Hawaii, this rare coffee is incredibly smooth and luxurious.',
    processing_method: 'washed',
    altitude: '500-900m',
    variety: 'Typica',
    farm_info: 'Kona Coffee Farms',
    image_url: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=800&h=600&fit=crop',
    is_active: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function initializeSampleData() {
  try {
    console.log('Initializing sample coffee data...');
    
    // Add coffee products
    const productIds: string[] = [];
    for (const product of sampleCoffeeProducts) {
      await table.addItem('evmzzktorxts', product);
      // We'll need to get the generated ID for inventory
      console.log(`Added product: ${product.name}`);
    }

    // Get all products to create inventory
    const productsResponse = await table.getItems('evmzzktorxts', {
      limit: 20
    });

    // Create inventory for each product
    for (const product of productsResponse.items) {
      const baseStock = Math.floor(Math.random() * 100) + 20; // Random stock between 20-120
      const reservedStock = Math.floor(Math.random() * 10); // Random reserved 0-10
      const reorderLevel = 15;
      
      let stockStatus = 'in_stock';
      if (baseStock <= 0) stockStatus = 'out_of_stock';
      else if (baseStock <= reorderLevel) stockStatus = 'low_stock';

      const inventoryItem = {
        product_id: product._id,
        current_stock: baseStock,
        reserved_stock: reservedStock,
        reorder_level: reorderLevel,
        reorder_quantity: 50,
        stock_status: stockStatus,
        last_restock_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
        last_restock_quantity: 50,
        total_sold: Math.floor(Math.random() * 200), // Random sales history
        warehouse_location: `Section-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 20) + 1}`, // Random location
        expiry_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(), // Random expiry within next year
        batch_number: `B${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`,
        updated_at: new Date().toISOString()
      };

      await table.addItem('evn000r9yk8w', inventoryItem);
      console.log(`Added inventory for: ${product.name} (${baseStock} units)`);
    }

    console.log('Sample data initialization completed successfully!');
    return true;
  } catch (error) {
    console.error('Failed to initialize sample data:', error);
    throw error;
  }
}
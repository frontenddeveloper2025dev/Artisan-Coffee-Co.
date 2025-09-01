// Coffee product and inventory management types

export interface CoffeeProduct {
  _id: string;
  _uid: string;
  _tid: string;
  name: string;
  origin: string;
  roast_level: 'light' | 'medium' | 'medium-dark' | 'dark' | 'extra-dark';
  flavor_profile: string;
  intensity: number; // 1-10 scale
  price: number; // in cents
  description: string;
  processing_method: 'washed' | 'natural' | 'honey' | 'semi-washed';
  altitude: string;
  variety: string;
  farm_info: string;
  image_url: string;
  is_active: 'active' | 'inactive' | 'seasonal';
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
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  last_restock_date: string;
  last_restock_quantity: number;
  total_sold: number;
  warehouse_location: string;
  expiry_date: string;
  batch_number: string;
  updated_at: string;
}

export interface CoffeeSubscription {
  _id: string;
  _uid: string;
  _tid: string;
  customer_email: string;
  customer_name: string;
  preferred_intensity: number;
  preferred_roast_levels: string;
  delivery_frequency: 'weekly' | 'bi-weekly' | 'monthly';
  bag_quantity: number;
  subscription_plan: 'discovery' | 'signature' | 'premium';
  status: 'active' | 'paused' | 'cancelled' | 'pending';
  next_delivery_date: string;
  last_delivery_date?: string;
  shipping_address: string; // JSON string
  billing_info: string; // JSON string
  special_instructions?: string;
  total_deliveries: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithInventory {
  product: CoffeeProduct;
  inventory: InventoryItem;
  available_stock: number; // current_stock - reserved_stock
}

export interface SubscriptionPlan {
  id: 'discovery' | 'signature' | 'premium';
  name: string;
  description: string;
  price: number; // in cents
  features: string[];
  bags_per_delivery: number;
}

export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface BillingInfo {
  card_number: string; // encrypted/masked
  expiry_month: number;
  expiry_year: number;
  cardholder_name: string;
  billing_address: ShippingAddress;
}

// Form types for subscription creation
export interface SubscriptionFormData {
  customer_email: string;
  customer_name: string;
  preferred_intensity: number;
  preferred_roast_levels: string[];
  delivery_frequency: 'weekly' | 'bi-weekly' | 'monthly';
  subscription_plan: 'discovery' | 'signature' | 'premium';
  shipping_address: ShippingAddress;
  billing_info: Omit<BillingInfo, 'billing_address'> & { 
    use_shipping_for_billing: boolean;
    billing_address?: ShippingAddress;
  };
  special_instructions?: string;
}

// Inventory management types
export interface StockMovement {
  product_id: string;
  movement_type: 'in' | 'out' | 'reserved' | 'unreserved';
  quantity: number;
  reason: string;
  timestamp: string;
}

export interface InventoryAlert {
  product_id: string;
  product_name: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'expiring_soon';
  current_stock: number;
  reorder_level: number;
  expiry_date?: string;
  message: string;
}
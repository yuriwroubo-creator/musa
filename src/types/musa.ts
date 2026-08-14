export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
  vendor_id: string | null;
  created_at: string | null;
  [key: string]: unknown;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
  vendor_id: string | null;
  created_at: string | null;
  [key: string]: unknown;
}

export interface VendorSubscription {
  id: string;
  serial_id: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  business_name: string | null;
  store_photo_url: string | null;
  plan: string | null;
  status: string | null;
  created_at: string | null;
}

export interface OrderSummaryItem {
  name: string;
  quantity: number;
  price?: number;
}

export interface OrderSummary {
  customerName: string;
  customerPhone: string;
  items: OrderSummaryItem[];
  total?: number;
  note?: string;
}

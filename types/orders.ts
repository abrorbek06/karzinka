export type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentType = 'cash' | 'card' | 'transfer' | 'online';
export type ProductStatus = 'bor' | 'kutilmoqda' | 'yo\'q';

export interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  status: ProductStatus;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  products: Product[];
  totalAmount: number;
  paymentType: PaymentType;
  pickupDate: Date;
  assignedTo?: string; // Person assigned to collect products
  createdAt: Date;
  updatedAt: Date;
}

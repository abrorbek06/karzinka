import { promises as fs } from 'fs';
import path from 'path';

import { Customer, Order, OrderStatus, PaymentType, Product, ProductStatus } from '@/types/orders';

const storePath = path.join(process.cwd(), 'data', 'store.json');

type StoreOrder = Omit<Order, 'pickupDate' | 'createdAt' | 'updatedAt'> & {
  pickupDate: string;
  createdAt: string;
  updatedAt: string;
};

type StoreCustomer = Omit<Customer, 'createdAt'> & {
  createdAt: string;
};

type StoreData = {
  customers: StoreCustomer[];
  orders: StoreOrder[];
  assignees: string[];
};

export type OrderInputProduct = {
  name: string;
  quantity: number;
  price: number;
  category: string;
  status?: ProductStatus;
};

export type OrderCreateInput = {
  customerId: string;
  paymentType: PaymentType;
  pickupDate: string;
  assignedTo?: string;
  products: OrderInputProduct[];
};

export type CustomerCreateInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

function reviveCustomer(customer: StoreCustomer): Customer {
  return {
    ...customer,
    createdAt: new Date(customer.createdAt),
  };
}

function reviveOrder(order: StoreOrder): Order {
  return {
    ...order,
    pickupDate: new Date(order.pickupDate),
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  };
}

function serializeCustomer(customer: Customer): StoreCustomer {
  return {
    ...customer,
    createdAt: customer.createdAt.toISOString(),
  };
}

function serializeOrder(order: Order): StoreOrder {
  return {
    ...order,
    pickupDate: order.pickupDate.toISOString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

async function readStore(): Promise<StoreData> {
  const raw = await fs.readFile(storePath, 'utf8');
  return JSON.parse(raw) as StoreData;
}

async function writeStore(data: StoreData) {
  await fs.writeFile(storePath, JSON.stringify(data, null, 2), 'utf8');
}

function generateId(prefix: string) {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${suffix}`;
}

function calculateTotalAmount(products: Product[]) {
  return products.reduce((sum, product) => sum + product.price * product.quantity, 0);
}

export async function getCustomers() {
  const store = await readStore();
  return store.customers.map(reviveCustomer);
}

export async function createCustomer(input: CustomerCreateInput) {
  const store = await readStore();
  const customer: Customer = {
    id: generateId('CUST'),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    createdAt: new Date(),
  };

  store.customers.unshift(serializeCustomer(customer));
  await writeStore(store);
  return customer;
}

export async function deleteCustomer(customerId: string) {
  const store = await readStore();
  const hasOrders = store.orders.some((order) => order.customerId === customerId);

  if (hasOrders) {
    throw new Error('Bu mijozga tegishli buyurtmalar mavjud.');
  }

  const nextCustomers = store.customers.filter((customer) => customer.id !== customerId);
  const deleted = nextCustomers.length !== store.customers.length;

  if (!deleted) {
    return false;
  }

  store.customers = nextCustomers;
  await writeStore(store);
  return true;
}

export async function getOrders() {
  const store = await readStore();
  return store.orders.map(reviveOrder);
}

export async function getAssignees() {
  const store = await readStore();
  return store.assignees;
}

export async function createOrder(input: OrderCreateInput) {
  const store = await readStore();
  const customer = store.customers.find((item) => item.id === input.customerId);

  if (!customer) {
    throw new Error('Mijoz topilmadi.');
  }

  const now = new Date();
  const products: Product[] = input.products.map((product) => ({
    id: generateId('P'),
    name: product.name.trim(),
    quantity: product.quantity,
    price: product.price,
    category: product.category.trim(),
    status: product.status ?? 'bor',
  }));

  const order: Order = {
    id: generateId('ORD'),
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    status: 'new',
    products,
    totalAmount: calculateTotalAmount(products),
    paymentType: input.paymentType,
    pickupDate: new Date(input.pickupDate),
    assignedTo: input.assignedTo?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  store.orders.unshift(serializeOrder(order));
  await writeStore(store);
  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const store = await readStore();
  const target = store.orders.find((order) => order.id === orderId);

  if (!target) {
    return null;
  }

  target.status = status;
  target.updatedAt = new Date().toISOString();
  await writeStore(store);
  return reviveOrder(target);
}

export async function updateOrderProduct(orderId: string, productId: string, changes: { price?: number; status?: ProductStatus }) {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);

  if (!order) {
    return null;
  }

  const product = order.products.find((item) => item.id === productId);

  if (!product) {
    return null;
  }

  if (typeof changes.price === 'number') {
    product.price = changes.price;
  }

  if (changes.status) {
    product.status = changes.status;
  }

  const revivedOrder = reviveOrder(order);
  revivedOrder.totalAmount = calculateTotalAmount(revivedOrder.products);
  revivedOrder.updatedAt = new Date();

  const serialized = serializeOrder(revivedOrder);
  const orderIndex = store.orders.findIndex((item) => item.id === orderId);
  store.orders[orderIndex] = serialized;
  await writeStore(store);
  return revivedOrder;
}

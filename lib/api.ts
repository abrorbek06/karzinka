import { Customer, Order, OrderStatus, PaymentType, ProductStatus } from '@/types/orders';

type ApiErrorBody = {
  message?: string;
};

export type OrderFormProduct = {
  name: string;
  quantity: number;
  price: number;
  category: string;
  status?: ProductStatus;
};

export type CreateOrderPayload = {
  customerId: string;
  paymentType: PaymentType;
  pickupDate: string;
  assignedTo?: string;
  products: OrderFormProduct[];
};

export type CreateCustomerPayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(data?.message || 'So‘rov bajarilmadi.');
  }

  return response.json() as Promise<T>;
}

function reviveCustomer(customer: Customer): Customer {
  return {
    ...customer,
    createdAt: new Date(customer.createdAt),
  };
}

function reviveOrder(order: Order): Order {
  return {
    ...order,
    pickupDate: new Date(order.pickupDate),
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  };
}

export async function fetchOrders() {
  const orders = await request<Order[]>('/api/orders', {
    cache: 'no-store',
  });
  return orders.map(reviveOrder);
}

export async function createOrder(payload: CreateOrderPayload) {
  const order = await request<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return reviveOrder(order);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const order = await request<Order>(`/api/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return reviveOrder(order);
}

export async function updateOrderProduct(orderId: string, productId: string, changes: { price?: number; status?: ProductStatus }) {
  const order = await request<Order>(`/api/orders/${orderId}/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
  return reviveOrder(order);
}

export async function fetchCustomers() {
  const customers = await request<Customer[]>('/api/customers', {
    cache: 'no-store',
  });
  return customers.map(reviveCustomer);
}

export async function createCustomer(payload: CreateCustomerPayload) {
  const customer = await request<Customer>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return reviveCustomer(customer);
}

export async function deleteCustomer(customerId: string) {
  await request<{ success: true }>(`/api/customers/${customerId}`, {
    method: 'DELETE',
  });
}

export async function fetchMeta() {
  return request<{ assignees: string[] }>('/api/meta', {
    cache: 'no-store',
  });
}

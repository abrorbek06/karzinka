import { NextRequest, NextResponse } from 'next/server';

import { createOrder, getOrders } from '@/lib/store';

export async function GET() {
  const orders = await getOrders();
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const order = await createOrder(body);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Buyurtma yaratilmadi.';
    return NextResponse.json({ message }, { status: 400 });
  }
}

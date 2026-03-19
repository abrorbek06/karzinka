import { NextRequest, NextResponse } from 'next/server';

import { updateOrderStatus } from '@/lib/store';
import { OrderStatus } from '@/types/orders';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const order = await updateOrderStatus(id, body.status as OrderStatus);

    if (!order) {
      return NextResponse.json({ message: 'Buyurtma topilmadi.' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ message: 'Buyurtma statusi yangilanmadi.' }, { status: 400 });
  }
}

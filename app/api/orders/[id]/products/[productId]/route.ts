import { NextRequest, NextResponse } from 'next/server';

import { updateOrderProduct } from '@/lib/store';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const { id, productId } = await params;
    const body = await request.json();
    const order = await updateOrderProduct(id, productId, body);

    if (!order) {
      return NextResponse.json({ message: 'Mahsulot yoki buyurtma topilmadi.' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ message: 'Mahsulot yangilanmadi.' }, { status: 400 });
  }
}

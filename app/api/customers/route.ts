import { NextRequest, NextResponse } from 'next/server';

import { createCustomer, getCustomers } from '@/lib/store';

export async function GET() {
  const customers = await getCustomers();
  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customer = await createCustomer(body);
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mijoz yaratilmadi.';
    return NextResponse.json({ message }, { status: 400 });
  }
}

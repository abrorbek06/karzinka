import { NextResponse } from 'next/server';

import { deleteCustomer } from '@/lib/store';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteCustomer(id);

    if (!deleted) {
      return NextResponse.json({ message: 'Mijoz topilmadi.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mijoz o‘chirilmadi.';
    return NextResponse.json({ message }, { status: 400 });
  }
}

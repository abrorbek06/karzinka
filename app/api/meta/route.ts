import { NextResponse } from 'next/server';

import { getAssignees } from '@/lib/store';

export async function GET() {
  const assignees = await getAssignees();
  return NextResponse.json({ assignees });
}

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId: productIdStr } = await params;
    const productId = parseInt(productIdStr);
    const body = await request.json();
    const { isVisible } = body;

    if (isVisible === undefined) {
      return NextResponse.json({ error: "Missing visibility status" }, { status: 400 });
    }

    await pool.query(
      'UPDATE products SET is_visible = ? WHERE product_id = ?',
      [isVisible ? 1 : 0, productId]
    );

    return NextResponse.json({ message: "Visibility updated successfully" }, { status: 200 });
  } catch (error) {
    console.error('Update visibility error:', error);
    return NextResponse.json({ error: "Failed to update visibility" }, { status: 500 });
  }
}

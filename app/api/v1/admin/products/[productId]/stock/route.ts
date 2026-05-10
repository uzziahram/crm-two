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
    const { quantity } = body;

    if (quantity === undefined || isNaN(parseInt(quantity)) || parseInt(quantity) < 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    await pool.query(
      'UPDATE products SET stock_quantity = ? WHERE product_id = ?',
      [parseInt(quantity), productId]
    );

    return NextResponse.json({ message: "Stock quantity updated successfully" }, { status: 200 });
  } catch (error) {
    console.error('Update stock quantity error:', error);
    return NextResponse.json({ error: "Failed to update stock quantity" }, { status: 500 });
  }
}

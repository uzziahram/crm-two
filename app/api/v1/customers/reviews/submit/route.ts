import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, orderId, rating, comment } = body;

    if (!productId || !orderId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify order belongs to user and is DELIVERED
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE order_id = ? AND customer_id = ? AND order_status = "DELIVERED"',
      [orderId, user.userId]
    );

    if ((orders as any[]).length === 0) {
      return NextResponse.json({ error: "Order not found or not delivered" }, { status: 403 });
    }

    // 2. Verify product was in that order
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id = ? AND product_id = ?',
      [orderId, productId]
    );

    if ((items as any[]).length === 0) {
      return NextResponse.json({ error: "Product not found in this order" }, { status: 400 });
    }

    // 3. Submit review (UNIQUE constraint on order_id + product_id prevents duplicate reviews)
    try {
      await pool.query(
        'INSERT INTO reviews (product_id, customer_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [productId, user.userId, orderId, rating, comment]
      );
      return NextResponse.json({ message: "Review submitted successfully" }, { status: 201 });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: "You have already reviewed this item" }, { status: 409 });
      }
      throw err;
    }

  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

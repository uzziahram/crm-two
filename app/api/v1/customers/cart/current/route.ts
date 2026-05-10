import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query `orders` table where customer_id = user.userId AND order_status = 'CART'
    const [orders] = await pool.query(
      'SELECT order_id, total_amount FROM orders WHERE customer_id = ? AND order_status = "CART" LIMIT 1',
      [user.userId]
    );

    const cartOrders = orders as any[];
    if (cartOrders.length === 0) {
      return NextResponse.json({ message: "Cart is empty", items: [] }, { status: 200 });
    }

    const order = cartOrders[0];

    // Get items for this order
    const [items] = await pool.query(
      `SELECT oi.*, p.name, p.image_url 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.product_id 
       WHERE oi.order_id = ?`,
      [order.order_id]
    );

    return NextResponse.json({
      order_id: order.order_id,
      total_amount: order.total_amount,
      items: items
    }, { status: 200 });
  } catch (error) {
    console.error('Fetch cart error:', error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

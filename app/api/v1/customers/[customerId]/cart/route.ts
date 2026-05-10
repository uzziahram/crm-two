import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const user = await getAuthUser();
    const { customerId: customerIdStr } = await params;
    const customerId = parseInt(customerIdStr);

    if (!user || (user.role !== 'customer' && user.role !== 'admin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === 'customer' && user.userId !== customerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Query `orders` table where customer_id = customerId AND order_status = 'CART'
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE customer_id = ? AND order_status = "CART" LIMIT 1',
      [customerId]
    );

    const cartOrders = orders as any[];
    if (cartOrders.length === 0) {
      return NextResponse.json({ message: "Cart is empty", items: [] }, { status: 200 });
    }

    const order = cartOrders[0];

    // Get items for this order
    const [items] = await pool.query(
      `SELECT oi.*, p.name 
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

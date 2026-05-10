import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId: orderIdStr } = await params;
    const orderId = parseInt(orderIdStr);
    const body = await request.json();
    const { payment_method, shipping_address } = body;

    if (!payment_method || !shipping_address) {
      return NextResponse.json({ error: "Payment method and shipping address are required" }, { status: 400 });
    }

    // 1. Verify order belongs to user and is in 'CART' status
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE order_id = ? AND customer_id = ? AND order_status = "CART"',
      [orderId, user.userId]
    );
    const orderList = orders as any[];
    if (orderList.length === 0) {
      return NextResponse.json({ error: "Order not found or already processed" }, { status: 404 });
    }

    // 2. Get items to check stock and deduct later
    const [items] = await pool.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [orderId]
    );
    const orderItems = items as any[];

    // Check stock for all items first
    for (const item of orderItems) {
      const [products] = await pool.query('SELECT stock_quantity FROM products WHERE product_id = ?', [item.product_id]);
      const product = (products as any[])[0];
      if (product.stock_quantity < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for product ID: ${item.product_id}` }, { status: 400 });
      }
    }

    // 3. Start Transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Deduct stock
      for (const item of orderItems) {
        await connection.query(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Update order status
      const paymentStatus = payment_method === 'COD' ? 'PENDING' : 'PAID';
      await connection.query(
        'UPDATE orders SET order_status = "PROCESSING", payment_status = ?, payment_method = ?, shipping_address = ? WHERE order_id = ?',
        [paymentStatus, payment_method, shipping_address, orderId]
      );

      await connection.commit();
      return NextResponse.json({ message: "Order placed successfully", order_id: orderId }, { status: 200 });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all orders with customer details, excluding 'CART' status
    const query = `
      SELECT 
        o.order_id,
        o.customer_id,
        o.total_amount,
        o.order_status,
        o.payment_status,
        o.payment_method,
        o.shipping_address,
        o.created_at,
        c.first_name,
        c.last_name,
        c.email
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      WHERE o.order_status != 'CART'
      ORDER BY o.created_at DESC
    `;

    const [rows] = await pool.query(query);

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Fetch all orders error:', error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    // Fetch all orders with customer details, excluding 'CART' status
    let sql = `
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
    `;
    const params: any[] = [];

    if (query) {
      sql += ` AND (o.order_id LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR o.shipping_address LIKE ?)`;
      const searchPattern = `%${query}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    sql += ` ORDER BY o.created_at DESC`;

    const [rows] = await pool.query(sql, params);

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Fetch all orders error:', error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch customers with aggregated stats
    const query = `
      SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        c.email,
        c.created_at,
        COUNT(DISTINCT o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.order_status != 'CART'
      GROUP BY c.customer_id
      ORDER BY total_spent DESC
    `;

    const [rows] = await pool.query(query);

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Fetch admin customers error:', error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

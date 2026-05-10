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

    // Fetch customers with aggregated stats
    let sql = `
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
      WHERE 1=1
    `;
    const params: any[] = [];

    if (query) {
      sql += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.customer_id LIKE ?)`;
      const searchPattern = `%${query}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    sql += ` GROUP BY c.customer_id ORDER BY total_spent DESC`;

    const [rows] = await pool.query(sql, params);

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Fetch admin customers error:', error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

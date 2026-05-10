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
    const month = searchParams.get('month'); // Expects format 'YYYY-MM'

    if (month) {
      // Detailed order-level data for a specific month
      const query = `
        SELECT 
          o.order_id,
          o.created_at,
          SUM(oi.quantity * oi.unit_price) as total_income,
          SUM(oi.quantity * p.cost_price) as total_investment,
          SUM(oi.quantity * (oi.unit_price - p.cost_price)) as net_profit,
          c.first_name,
          c.last_name
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.product_id
        JOIN customers c ON o.customer_id = c.customer_id
        WHERE o.payment_status = 'PAID' 
          AND DATE_FORMAT(o.created_at, '%Y-%m') = ?
        GROUP BY o.order_id
        ORDER BY o.created_at DESC
      `;
      const [rows] = await pool.query(query, [month]);
      return NextResponse.json(rows, { status: 200 });
    }

    // Default: Aggregate financial metrics by month
    const query = `
      SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m') as month,
        SUM(oi.quantity * oi.unit_price) as total_income,
        SUM(oi.quantity * p.cost_price) as total_investment,
        SUM(oi.quantity * (oi.unit_price - p.cost_price)) as net_profit
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      WHERE o.payment_status = 'PAID'
      GROUP BY month
      ORDER BY month DESC
    `;

    const [rows] = await pool.query(query);

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Fetch profits error:', error);
    return NextResponse.json({ error: "Failed to fetch profit analytics" }, { status: 500 });
  }
}

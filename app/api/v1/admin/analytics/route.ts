import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Calculate Aggregate Revenue (from all PAID orders)
    const [revenueRows] = await pool.query(
      'SELECT SUM(total_amount) as total_revenue FROM orders WHERE payment_status = "PAID"'
    );
    const totalRevenue = (revenueRows as any[])[0].total_revenue || 0;

    // 2. Count Total Orders Fulfilled (DELIVERED status)
    const [orderRows] = await pool.query(
      'SELECT COUNT(*) as total_delivered FROM orders WHERE order_status = "DELIVERED"'
    );
    const totalDelivered = (orderRows as any[])[0].total_delivered || 0;

    return NextResponse.json({
      total_revenue: parseFloat(totalRevenue),
      total_orders_delivered: parseInt(totalDelivered),
    }, { status: 200 });
  } catch (error) {
    console.error('Analytics generation error:', error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}

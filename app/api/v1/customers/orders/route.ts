import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all orders except those still in 'CART' status
    const [rows] = await pool.query(
      `SELECT * FROM orders 
       WHERE customer_id = ? AND order_status != "CART" 
       ORDER BY created_at DESC`,
      [user.userId]
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

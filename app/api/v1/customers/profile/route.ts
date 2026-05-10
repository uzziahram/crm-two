import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows] = await pool.query(
      'SELECT customer_id, first_name, last_name, email, created_at FROM customers WHERE customer_id = ?',
      [user.userId]
    );

    const customers = rows as any[];
    if (customers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(customers[0], { status: 200 });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

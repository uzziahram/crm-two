import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId: orderIdStr } = await params;
    const orderId = parseInt(orderIdStr);
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await pool.query(
      'UPDATE orders SET order_status = ? WHERE order_id = ?',
      [status, orderId]
    );

    return NextResponse.json({ message: "Order status updated successfully" }, { status: 200 });
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}

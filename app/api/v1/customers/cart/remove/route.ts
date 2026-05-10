import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await request.json();
    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    // 1. Verify item belongs to user's active cart
    const [items] = await pool.query(
      `SELECT oi.item_id, oi.order_id 
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE oi.item_id = ? AND o.customer_id = ? AND o.order_status = "CART"`,
      [itemId, user.userId]
    );

    const itemList = items as any[];
    if (itemList.length === 0) {
      return NextResponse.json({ error: "Item not found in active cart" }, { status: 404 });
    }

    const orderId = itemList[0].order_id;

    // 2. Delete item
    await pool.query('DELETE FROM order_items WHERE item_id = ?', [itemId]);

    // 3. Recalculate order total
    const [totals] = await pool.query(
      'SELECT SUM(quantity * unit_price) as total FROM order_items WHERE order_id = ?',
      [orderId]
    );
    const newTotal = (totals as any[])[0].total || 0;

    await pool.query('UPDATE orders SET total_amount = ? WHERE order_id = ?', [newTotal, orderId]);

    return NextResponse.json({ message: "Item removed from cart", newTotal }, { status: 200 });
  } catch (error) {
    console.error('Remove cart item error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

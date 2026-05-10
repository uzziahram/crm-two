import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId, quantity } = await request.json();
    if (!itemId || quantity === undefined) {
      return NextResponse.json({ error: "Item ID and quantity are required" }, { status: 400 });
    }

    if (quantity < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
    }

    // 1. Verify item belongs to user's active cart
    const [items] = await pool.query(
      `SELECT oi.item_id, oi.order_id, p.stock_quantity 
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.item_id = ? AND o.customer_id = ? AND o.order_status = "CART"`,
      [itemId, user.userId]
    );

    const itemList = items as any[];
    if (itemList.length === 0) {
      return NextResponse.json({ error: "Item not found in active cart" }, { status: 404 });
    }

    if (quantity > itemList[0].stock_quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const orderId = itemList[0].order_id;

    // 2. Update quantity
    await pool.query('UPDATE order_items SET quantity = ? WHERE item_id = ?', [quantity, itemId]);

    // 3. Recalculate order total
    const [totals] = await pool.query(
      'SELECT SUM(quantity * unit_price) as total FROM order_items WHERE order_id = ?',
      [orderId]
    );
    const newTotal = (totals as any[])[0].total || 0;

    await pool.query('UPDATE orders SET total_amount = ? WHERE order_id = ?', [newTotal, orderId]);

    return NextResponse.json({ message: "Quantity updated", newTotal }, { status: 200 });
  } catch (error) {
    console.error('Update cart item error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

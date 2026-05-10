import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch orders with their items to check if each item has been reviewed
    const query = `
      SELECT 
        o.order_id,
        o.total_amount,
        o.order_status,
        o.payment_status,
        o.payment_method,
        o.created_at,
        oi.product_id,
        oi.quantity,
        oi.unit_price,
        p.name as product_name,
        p.image_url,
        (SELECT COUNT(*) FROM reviews r WHERE r.order_id = o.order_id AND r.product_id = oi.product_id) as is_reviewed
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      WHERE o.customer_id = ? AND o.order_status != 'CART'
      ORDER BY o.created_at DESC
    `;

    const [rows] = await pool.query(query, [user.userId]);
    
    // Group items by order_id
    const ordersMap = new Map();
    (rows as any[]).forEach(row => {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          order_id: row.order_id,
          total_amount: row.total_amount,
          order_status: row.order_status,
          payment_status: row.payment_status,
          payment_method: row.payment_method,
          created_at: row.created_at,
          items: []
        });
      }
      ordersMap.get(row.order_id).items.push({
        product_id: row.product_id,
        name: row.product_name,
        image_url: row.image_url,
        quantity: row.quantity,
        unit_price: row.unit_price,
        is_reviewed: row.is_reviewed > 0
      });
    });

    return NextResponse.json(Array.from(ordersMap.values()), { status: 200 });
  } catch (error) {
    console.error('Fetch detailed orders error:', error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId: customerIdStr } = await params;
    const customerId = parseInt(customerIdStr);

    // 1. Fetch all unique products purchased by this user (from delivered orders)
    const itemsQuery = `
      SELECT 
        DISTINCT p.product_id,
        p.name,
        p.image_url,
        oi.unit_price,
        o.created_at as purchase_date,
        o.order_id
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      WHERE o.customer_id = ? AND o.order_status = 'DELIVERED'
      ORDER BY o.created_at DESC
    `;

    // 2. Fetch all reviews by this user
    const reviewsQuery = `
      SELECT 
        r.review_id,
        r.rating,
        r.comment,
        r.created_at,
        p.name as product_name,
        r.order_id
      FROM reviews r
      JOIN products p ON r.product_id = p.product_id
      WHERE r.customer_id = ?
      ORDER BY r.created_at DESC
    `;

    const [[items], [reviews]] = await Promise.all([
      pool.query(itemsQuery, [customerId]),
      pool.query(reviewsQuery, [customerId])
    ]);

    return NextResponse.json({
      items: items,
      reviews: reviews
    }, { status: 200 });
  } catch (error) {
    console.error('Fetch customer activity error:', error);
    return NextResponse.json({ error: "Failed to fetch customer activity" }, { status: 500 });
  }
}

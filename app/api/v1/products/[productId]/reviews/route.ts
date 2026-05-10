import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId: productIdStr } = await params;
    const productId = parseInt(productIdStr);

    const query = `
      SELECT 
        r.review_id,
        r.rating,
        r.comment,
        r.created_at,
        c.first_name,
        c.last_name
      FROM reviews r
      JOIN customers c ON r.customer_id = c.customer_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `;

    const [rows] = await pool.query(query, [productId]);

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

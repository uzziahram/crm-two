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
    const query = searchParams.get('query');

    let reviewsQuery = `
      SELECT 
        r.review_id,
        r.rating,
        r.comment,
        r.created_at,
        p.name as product_name,
        p.product_id,
        c.first_name,
        c.last_name,
        c.email,
        r.order_id
      FROM reviews r
      JOIN products p ON r.product_id = p.product_id
      JOIN customers c ON r.customer_id = c.customer_id
    `;
    const params: any[] = [];

    if (query) {
      reviewsQuery += ` WHERE (p.name LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR r.comment LIKE ?)`;
      const searchPattern = `%${query}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    reviewsQuery += ` ORDER BY r.created_at DESC`;

    let summaryQuery = `
      SELECT 
        r.rating,
        COUNT(*) as count
      FROM reviews r
      JOIN products p ON r.product_id = p.product_id
      JOIN customers c ON r.customer_id = c.customer_id
    `;

    if (query) {
      summaryQuery += ` WHERE (p.name LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR r.comment LIKE ?)`;
    }

    summaryQuery += ` GROUP BY r.rating ORDER BY r.rating DESC`;

    const [[reviews], [summary]] = await Promise.all([
      pool.query(reviewsQuery, params),
      pool.query(summaryQuery, params)
    ]);

    // Format summary into a cleaner object
    const ratingStats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (summary as any[]).forEach(row => {
      ratingStats[row.rating] = row.count;
    });

    return NextResponse.json({
      reviews: reviews,
      summary: ratingStats
    }, { status: 200 });
  } catch (error) {
    console.error('Fetch admin reviews error:', error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

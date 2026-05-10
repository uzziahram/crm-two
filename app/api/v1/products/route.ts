import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort'); // 'newest', 'price-asc', 'price-desc'

    let sql = 'SELECT * FROM products WHERE is_visible = TRUE';
    const params: any[] = [];

    if (query) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR specifications LIKE ?)';
      const searchPattern = `%${query}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (minPrice) {
      sql += ' AND price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      sql += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }

    if (sort === 'price-asc') {
      sql += ' ORDER BY price ASC';
    } else if (sort === 'price-desc') {
      sql += ' ORDER BY price DESC';
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    const [rows] = await pool.query(sql, params);
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

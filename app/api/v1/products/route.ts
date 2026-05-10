import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE is_visible = TRUE ORDER BY created_at DESC');
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    // Verify against the `admins` table
    const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
    const admins = rows as any[];

    if (admins.length === 0) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    }

    const admin = admins[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    }

    const token = signToken({
      userId: admin.admin_id,
      email: admin.email,
      role: 'admin'
    });

    return NextResponse.json(
      { token, message: "Admin login successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

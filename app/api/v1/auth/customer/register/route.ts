import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const [existing] = await pool.query('SELECT email FROM customers WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into `customers` table
    const [result] = await pool.query(
      'INSERT INTO customers (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword]
    );

    const customerId = (result as any).insertId;

    const token = signToken({
      userId: customerId,
      email: email,
      role: 'customer'
    });

    return NextResponse.json(
      { 
        token, 
        message: "Registration successful",
        user: { id: customerId, email } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}

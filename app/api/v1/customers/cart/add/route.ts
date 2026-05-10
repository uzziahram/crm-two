import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity = 1 } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // 1. Verify product exists and has stock
    const [products] = await pool.query(
      'SELECT price, stock_quantity FROM products WHERE product_id = ?',
      [productId]
    );
    const productList = products as any[];
    if (productList.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = productList[0];
    if (product.stock_quantity < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    // 2. Find or create an active 'CART' order for this customer
    const [orders] = await pool.query(
      'SELECT order_id, total_amount FROM orders WHERE customer_id = ? AND order_status = "CART" LIMIT 1',
      [user.userId]
    );
    const cartOrders = orders as any[];
    
    let orderId: number;
    let currentTotal: number;

    if (cartOrders.length === 0) {
      // Create new cart
      const [newOrder] = await pool.query(
        'INSERT INTO orders (customer_id, total_amount, order_status) VALUES (?, 0, "CART")',
        [user.userId]
      );
      orderId = (newOrder as any).insertId;
      currentTotal = 0;
    } else {
      orderId = cartOrders[0].order_id;
      currentTotal = parseFloat(cartOrders[0].total_amount);
    }

    // 3. Check if item is already in cart
    const [existingItems] = await pool.query(
      'SELECT item_id, quantity FROM order_items WHERE order_id = ? AND product_id = ?',
      [orderId, productId]
    );
    const itemsList = existingItems as any[];

    if (itemsList.length > 0) {
      // Update quantity
      await pool.query(
        'UPDATE order_items SET quantity = quantity + ? WHERE item_id = ?',
        [quantity, itemsList[0].item_id]
      );
    } else {
      // Add new item
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, productId, quantity, product.price]
      );
    }

    // 4. Update order total
    const newTotal = currentTotal + (parseFloat(product.price) * quantity);
    await pool.query(
      'UPDATE orders SET total_amount = ? WHERE order_id = ?',
      [newTotal, orderId]
    );

    return NextResponse.json({ message: "Item added to cart", order_id: orderId }, { status: 200 });
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

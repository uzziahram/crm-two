import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';
import { ResultSetHeader } from 'mysql2';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const specifications = formData.get('specifications') as string;
    const price = parseFloat(formData.get('price') as string);
    const cost_price = parseFloat(formData.get('cost_price') as string);
    const stock_quantity = parseInt(formData.get('stock_quantity') as string);
    const image = formData.get('image') as File | null;

    if (!name || isNaN(price) || isNaN(stock_quantity)) {
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
    }

    // 1. Insert product into DB first to get the auto-incremented product_id
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO products 
        (name, description, specifications, price, cost_price, stock_quantity, is_visible) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description || '', specifications || '', price, isNaN(cost_price) ? 0 : cost_price, stock_quantity, true]
    );

    const productId = result.insertId;
    let imageUrl = '';

    // 2. If image is provided, handle file upload
    if (image && image.name && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      
      // Sanitize file name
      const fileName = image.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const dirPath = path.join(process.cwd(), 'public', 'product_images', productId.toString());
      const filePath = path.join(dirPath, fileName);
      
      // Ensure directory exists
      await fs.mkdir(dirPath, { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, buffer);
      
      // Set image URL relative to public folder
      imageUrl = `/product_images/${productId}/${fileName}`;
      
      // Update DB with the new image URL
      await pool.query(
        'UPDATE products SET image_url = ? WHERE product_id = ?',
        [imageUrl, productId]
      );
    }

    return NextResponse.json({ 
      message: "Product added successfully", 
      product_id: productId,
      image_url: imageUrl
    }, { status: 201 });

  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import database from "@/lib/database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Product } from "@/types/Product";

// GET: Fetch all products
export async function GET() {
  try {
    const [rows] = await database.query<RowDataPacket[]>(
      "SELECT * FROM products"
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST: Create a new product
export async function POST(request: Request) {
  try {
    const body: Product = await request.json();
    const {
      product_name,
      sku,
      category,
      size,
      price,
      stock_quantity,
      low_stock_alert,
    } = body;

    // Basic validation
    if (!product_name || !sku || price === undefined || stock_quantity === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO products 
      (product_name, sku, category, size, price, stock_quantity, low_stock_alert) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      product_name,
      sku,
      category || null,
      size || null,
      price,
      stock_quantity,
      low_stock_alert || 0,
    ];

    const [result] = await database.execute<ResultSetHeader>(query, values);

    return NextResponse.json(
      { 
        message: "Product created successfully", 
        product_id: result.insertId 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
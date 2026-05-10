import { NextResponse } from "next/server";
import database from "@/lib/database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

// POST: Create a new product with image upload
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const product_name = formData.get("product_name") as string;
    const sku = formData.get("sku") as string;
    const category = formData.get("category") as string;
    const size = formData.get("size") as string;
    const price = Number(formData.get("price"));
    const cost_price = Number(formData.get("cost_price"));
    const stock_quantity = Number(formData.get("stock_quantity"));
    const low_stock_alert = Number(formData.get("low_stock_alert"));
    const imageFile = formData.get("image") as File | null;

    // Basic validation
    if (!product_name || !sku || isNaN(price) || isNaN(cost_price) || isNaN(stock_quantity)) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    let image_url = null;

    // Handle image upload if provided
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Get extension from original filename
      const originalName = imageFile.name;
      const extension = path.extname(originalName);
      
      // Filename is product name + extension
      const fileName = `${product_name}${extension}`;
      const uploadDir = path.join(process.cwd(), "public", "productImages");
      const filePath = path.join(uploadDir, fileName);

      try {
        await mkdir(uploadDir, { recursive: true });
        await writeFile(filePath, buffer);
        image_url = `/productImages/${fileName}`;
      } catch (fsError) {
        console.error("Failed to save image file:", fsError);
        // Continue without image if saving fails
      }
    }

    const query = `
      INSERT INTO products 
      (product_name, sku, category, size, price, cost_price, stock_quantity, low_stock_alert, image_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      product_name,
      sku,
      category || null,
      size || null,
      price,
      cost_price || 0,
      stock_quantity,
      low_stock_alert || 0,
      image_url
    ];

    const [result] = await database.execute<ResultSetHeader>(query, values);

    return NextResponse.json(
      { 
        message: "Product created successfully", 
        product_id: result.insertId,
        image_url
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating product:", error);
    const errorMessage = error?.code === 'ER_DUP_ENTRY' 
      ? "Product with this SKU already exists." 
      : "Failed to create product";
    
    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: error?.code === 'ER_DUP_ENTRY' ? 409 : 500 }
    );
  }
}
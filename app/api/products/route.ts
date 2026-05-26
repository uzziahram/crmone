import { NextResponse } from "next/server";
import database from "@/lib/database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { z } from "zod";
import { errorResponse } from "@/lib/api-utils";

const productSchema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  price: z.number().min(0, "Price cannot be negative"),
  cost_price: z.number().min(0, "Cost price cannot be negative").default(0),
  stock_quantity: z.number().int().min(0, "Stock cannot be negative"),
  low_stock_alert: z.number().int().min(0).default(0),
});

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
    
    const rawData = {
      product_name: formData.get("product_name"),
      sku: formData.get("sku"),
      category: formData.get("category"),
      size: formData.get("size"),
      price: formData.get("price") ? Number(formData.get("price")) : undefined,
      cost_price: formData.get("cost_price") ? Number(formData.get("cost_price")) : undefined,
      stock_quantity: formData.get("stock_quantity") ? Number(formData.get("stock_quantity")) : undefined,
      low_stock_alert: formData.get("low_stock_alert") ? Number(formData.get("low_stock_alert")) : undefined,
    };

    const validation = productSchema.safeParse(rawData);

    if (!validation.success) {
      return errorResponse(
        validation.error.errors.map((e) => e.message).join(", "),
        400
      );
    }

    const { 
      product_name, 
      sku, 
      category, 
      size, 
      price, 
      cost_price, 
      stock_quantity, 
      low_stock_alert 
    } = validation.data;
    
    const imageFile = formData.get("image") as File | null;

    let image_url = null;

    // Handle image upload if provided
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Get extension from original filename
      const originalName = imageFile.name;
      const extension = path.extname(originalName).toLowerCase();
      
      // Sanitize filename: replace spaces with underscores, lowercase, remove non-alphanumeric
      const sanitizedName = product_name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      
      const fileName = `${sanitizedName}${extension}`;
      const uploadDir = path.join(process.cwd(), "public", "productImages");
      const filePath = path.join(uploadDir, fileName);

      try {
        await mkdir(uploadDir, { recursive: true });
        await writeFile(filePath, buffer);
        image_url = `/productImages/${fileName}`;
      } catch (fsError) {
        console.error("Failed to save image file:", fsError);
        // We throw so the catch block handles it and returns a 500
        throw new Error("Failed to save product image on server.");
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
    
    // Determine the error message
    let errorMessage = "Failed to create product";
    if (error?.code === 'ER_DUP_ENTRY') {
      errorMessage = "Product with this SKU already exists.";
    } else if (error.message === "Failed to save product image on server.") {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: error?.code === 'ER_DUP_ENTRY' ? 409 : 500 }
    );
  }
}

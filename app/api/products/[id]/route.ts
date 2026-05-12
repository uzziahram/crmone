import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { unlink } from "fs/promises";
import path from "path";
import { z } from "zod";

const updateProductSchema = z.object({
  product_name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  cost_price: z.number().min(0).optional(),
  stock_quantity: z.number().int().min(0).optional(),
  low_stock_alert: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = request.cookies.get("role")?.value;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: product_id_raw } = await params;
    const product_id = Number(product_id_raw);

    if (isNaN(product_id) || product_id <= 0) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const json = await request.json();
    const validation = updateProductSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const updates = validation.data;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(updates), product_id];

    const [result] = await database.execute<ResultSetHeader>(
      `UPDATE products SET ${fields} WHERE product_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth check
    const role = request.cookies.get("role")?.value;
    const token = request.cookies.get("token")?.value;

    if (!token || role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 2. Fetch product to get image_url
    const [products] = await database.query<RowDataPacket[]>(
      "SELECT image_url FROM products WHERE product_id = ?",
      [id]
    );

    if (products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const image_url = products[0].image_url;

    // 3. Delete from database
    await database.execute<ResultSetHeader>(
      "DELETE FROM products WHERE product_id = ?",
      [id]
    );

    // 4. Delete image file if it exists
    if (image_url) {
      const fileName = path.basename(image_url);
      const filePath = path.join(process.cwd(), "public", "productImages", fileName);
      try {
        await unlink(filePath);
      } catch (unlinkError) {
        console.error("Failed to delete image file:", unlinkError);
      }
    }

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { unlink } from "fs/promises";
import path from "path";

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

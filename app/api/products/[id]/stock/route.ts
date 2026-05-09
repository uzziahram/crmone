import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = req.cookies.get("role")?.value;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { stock_quantity, low_stock_alert } = await req.json();

    if (stock_quantity === undefined || Number(stock_quantity) < 0) {
      return NextResponse.json({ error: "Valid stock_quantity is required." }, { status: 400 });
    }

    await database.query(
      `UPDATE products
       SET stock_quantity = ?, low_stock_alert = COALESCE(?, low_stock_alert)
       WHERE product_id = ?`,
      [Number(stock_quantity), low_stock_alert ?? null, id]
    );

    return NextResponse.json({ message: "Stock updated." }, { status: 200 });
  } catch (error) {
    console.error("Failed to update stock", error);
    return NextResponse.json({ error: "Failed to update stock." }, { status: 500 });
  }
}

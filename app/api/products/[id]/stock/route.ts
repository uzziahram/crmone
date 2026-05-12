import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db";
import { z } from "zod";

const stockSchema = z.object({
  stock_quantity: z.number().min(0, "Stock quantity cannot be negative"),
  low_stock_alert: z.number().min(0).optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = req.cookies.get("role")?.value;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: product_id_raw } = await params;
    const product_id = Number(product_id_raw);

    if (isNaN(product_id) || product_id <= 0) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const json = await req.json();
    const validation = stockSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { stock_quantity, low_stock_alert } = validation.data;

    await database.query(
      `UPDATE products
       SET stock_quantity = ?, low_stock_alert = COALESCE(?, low_stock_alert)
       WHERE product_id = ?`,
      [stock_quantity, low_stock_alert ?? null, product_id]
    );

    return NextResponse.json({ message: "Stock updated." }, { status: 200 });
  } catch (error) {
    console.error("Failed to update stock", error);
    return NextResponse.json({ error: "Failed to update stock." }, { status: 500 });
  }
}

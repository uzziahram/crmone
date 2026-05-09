import { NextResponse } from "next/server";
import database from "@/lib/database/db";

export async function GET() {
  try {
    const [rows] = await database.query(
      `SELECT
        oi.order_item_id,
        oi.order_id,
        oi.product_id,
        oi.rating,
        oi.comments,
        p.product_name,
        c.full_name AS customer_name
      FROM order_items oi
      JOIN orders o ON o.order_id = oi.order_id
      JOIN customers c ON c.customer_id = o.customer_id
      JOIN products p ON p.product_id = oi.product_id
      WHERE oi.rating IS NOT NULL OR (oi.comments IS NOT NULL AND oi.comments <> '')
      ORDER BY oi.order_item_id DESC`
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch reviews", error);
    return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 });
  }
}

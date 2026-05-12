import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: order_id_raw } = await params;
  const orderId = Number(order_id_raw);

  if (isNaN(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  try {
    // 1. Fetch the Order details
    const [orderRows]: any = await database.query(
      `SELECT o.*, c.full_name, c.email 
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (orderRows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderRows[0];

    // 2. Fetch the Order Items with Product details
    const [itemsRows]: any = await database.query(
      `SELECT oi.*, p.product_name, p.sku, p.category, p.size
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    return NextResponse.json({
      ...order,
      items: itemsRows
    }, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch order details:", error);
    return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 });
  }
}

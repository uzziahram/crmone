import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerIdRaw = searchParams.get("customer_id");
    const customerId = customerIdRaw ? Number(customerIdRaw) : null;

    if (customerIdRaw && (isNaN(customerId!) || customerId! <= 0)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
    }

    const orderValues: Array<string | number> = [];
    let orderWhere = "";

    if (customerId) {
      orderWhere = "WHERE o.customer_id = ?";
      orderValues.push(customerId);
    }

    const [ordersRows] = await database.query(
      `SELECT 
        o.order_id,
        o.customer_id,
        o.order_date,
        o.total_amount,
        o.discount_applied,
        o.status,
        o.payment_method,
        c.full_name,
        c.email
      FROM orders o
      JOIN customers c ON c.customer_id = o.customer_id
      ${orderWhere}
      ORDER BY o.order_date DESC`,
      orderValues
    );

    const [itemsRows] = await database.query(
      `SELECT
        oi.order_item_id,
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.price_at_purchase,
        oi.rating,
        oi.comments,
        p.product_name,
        p.size
      FROM order_items oi
      JOIN products p ON p.product_id = oi.product_id`
    );

    const items = itemsRows as Array<{
      order_item_id: number;
      order_id: number;
      product_id: number;
      quantity: number;
      price_at_purchase: number;
      rating?: number;
      comments?: string;
      product_name: string;
      size?: string;
    }>;

    const grouped = (ordersRows as Array<Record<string, unknown>>).map((order) => ({
      ...order,
      items: items.filter((item) => item.order_id === Number(order.order_id)),
    }));

    return NextResponse.json(grouped, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch orders", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

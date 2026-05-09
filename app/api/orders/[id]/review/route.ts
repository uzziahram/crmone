import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { customer_id, product_id, rating, comments } = await req.json();

    if (!customer_id || !product_id || !rating) {
      return NextResponse.json(
        { error: "customer_id, product_id, and rating are required." },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5." }, { status: 400 });
    }

    const [orderRows] = await database.query(
      "SELECT order_id, customer_id, status FROM orders WHERE order_id = ?",
      [id]
    );
    const order = (orderRows as Array<{ order_id: number; customer_id: number; status: string }>)[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (Number(customer_id) !== order.customer_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "You can only review delivered orders." },
        { status: 400 }
      );
    }

    const [updateResult] = await database.query(
      `UPDATE order_items
       SET rating = ?, comments = ?
       WHERE order_id = ? AND product_id = ?`,
      [rating, comments || null, id, product_id]
    );

    const result = updateResult as { affectedRows?: number };
    if (!result.affectedRows) {
      return NextResponse.json(
        { error: "Order item not found for that product." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Review submitted." }, { status: 200 });
  } catch (error) {
    console.error("Failed to submit review", error);
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }
}

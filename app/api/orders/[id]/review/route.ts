import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db";
import { z } from "zod";
import { errorResponse } from "@/lib/api-utils";

const reviewSchema = z.object({
  customer_id: z.number().positive(),
  product_id: z.number().positive(),
  rating: z.number().min(1).max(5),
  comments: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: order_id_raw } = await params;
    const order_id = Number(order_id_raw);

    if (isNaN(order_id) || order_id <= 0) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const json = await req.json();
    const validation = reviewSchema.safeParse(json);

    if (!validation.success) {
      return errorResponse(
        validation.error.errors.map((e) => e.message).join(", "),
        400
      );
    }

    const { customer_id, product_id, rating, comments } = validation.data;

    const [orderRows] = await database.query(
      "SELECT order_id, customer_id, status FROM orders WHERE order_id = ?",
      [order_id]
    );
    const order = (orderRows as Array<{ order_id: number; customer_id: number; status: string }>)[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (customer_id !== order.customer_id) {
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
      [rating, comments || null, order_id, product_id]
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

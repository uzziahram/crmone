import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  customer_id: z.number().optional(),
  by_admin: z.boolean().optional(),
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
    const validation = statusSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { status, customer_id, by_admin } = validation.data;
    const role = req.cookies.get("role")?.value;

    const [rows] = await database.query(
      "SELECT order_id, customer_id, status FROM orders WHERE order_id = ?",
      [order_id]
    );
    const order = (rows as Array<{ order_id: number; customer_id: number; status: string }>)[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (by_admin) {
      if (role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (status === "cancelled") {
        return NextResponse.json(
          { error: "Admin cannot set cancelled via this flow." },
          { status: 400 }
        );
      }
    } else {
      if (role !== "customer") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (status !== "cancelled") {
        return NextResponse.json(
          { error: "Customer can only cancel pending orders." },
          { status: 400 }
        );
      }
      if (customer_id !== order.customer_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (order.status !== "pending") {
        return NextResponse.json(
          { error: "Only pending orders can be cancelled." },
          { status: 400 }
        );
      }
    }

    await database.query("UPDATE orders SET status = ? WHERE order_id = ?", [status, order_id]);
    return NextResponse.json({ message: "Order status updated." }, { status: 200 });
  } catch (error) {
    console.error("Failed to update order status", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}

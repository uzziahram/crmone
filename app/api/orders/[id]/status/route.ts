import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db";

const allowedStatus = ["pending", "processing", "shipped", "delivered", "cancelled"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, customer_id, by_admin } = await req.json();
    const role = req.cookies.get("role")?.value;

    if (!allowedStatus.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [rows] = await database.query(
      "SELECT order_id, customer_id, status FROM orders WHERE order_id = ?",
      [id]
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
      if (Number(customer_id) !== order.customer_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (order.status !== "pending") {
        return NextResponse.json(
          { error: "Only pending orders can be cancelled." },
          { status: 400 }
        );
      }
    }

    await database.query("UPDATE orders SET status = ? WHERE order_id = ?", [status, id]);
    return NextResponse.json({ message: "Order status updated." }, { status: 200 });
  } catch (error) {
    console.error("Failed to update order status", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}

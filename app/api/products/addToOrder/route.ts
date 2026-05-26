import { NextResponse } from "next/server";
import database from "@/lib/database/db"; 
import { z } from "zod";
import { errorResponse } from "@/lib/api-utils";

const checkoutSchema = z.object({
  customer_id: z.number().positive(),
  payment_method: z.string().min(1, "Payment method is required"),
});

export async function POST(request: Request) {
  // We need to get a dedicated connection from the pool to run a transaction
  const connection = await database.getConnection();

  try {
    const json = await request.json();
    const validation = checkoutSchema.safeParse(json);

    if (!validation.success) {
      return errorResponse(
        validation.error.errors.map((e) => e.message).join(", "),
        400
      );
    }

    const { customer_id, payment_method } = validation.data;

    // 1. Start the transaction
    await connection.beginTransaction();

    // 2. Fetch the customer's cart items AND join with products to get the current price and stock
    const [cartItems]: any = await connection.query(
      `SELECT c.product_id, c.quantity, p.price, p.cost_price, p.stock_quantity 
       FROM in_cart c
       JOIN products p ON c.product_id = p.product_id
       WHERE c.customer_id = ?`,
      [customer_id]
    );

    if (cartItems.length === 0) {
      await connection.rollback(); // Cancel transaction
      return NextResponse.json({ error: "Cannot create order: Cart is empty." }, { status: 400 });
    }

    // 3. Calculate the total amount and verify stock availability
    let totalAmount = 0;
    for (const item of cartItems) {
      if (item.quantity > item.stock_quantity) {
        await connection.rollback(); // Cancel transaction
        return NextResponse.json(
          { error: `Insufficient stock for product ID ${item.product_id}.` }, 
          { status: 400 }
        );
      }
      totalAmount += item.quantity * item.price;
    }

    // 4. Create the main Order record
    // Assuming 'PENDING' is one of the ENUM values for your status column
    const [orderResult]: any = await connection.query(
      `INSERT INTO orders (customer_id, order_date, total_amount, discount_applied, status, payment_method) 
       VALUES (?, NOW(), ?, 0.00, 'PENDING', ?)`,
      [customer_id, totalAmount, payment_method]
    );
    const orderId = orderResult.insertId;

    // 5. Transfer items to order_items and update product stock
    for (const item of cartItems) {
      // Insert the line item
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) 
         VALUES (?, ?, ?, ?, ?, NULL, NULL)`,
        [orderId, item.product_id, item.quantity, item.price, item.cost_price]
      );

      // Deduct the purchased quantity from the products table
      await connection.query(
        `UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // 6. Delete all items from the customer's cart
    await connection.query(
      `DELETE FROM in_cart WHERE customer_id = ?`,
      [customer_id]
    );

    // 7. Commit the transaction (save all changes permanently)
    await connection.commit();

    return NextResponse.json(
      { message: "Order successfully placed!", orderId, totalAmount },
      { status: 201 }
    );

  } catch (error) {
    // If anything fails during the process, undo all database changes
    await connection.rollback();
    console.error("Checkout transaction failed:", error);
    return NextResponse.json(
      { error: "Internal server error during checkout." },
      { status: 500 }
    );
  } finally {
    // ALWAYS release the connection back to the pool so other requests can use it
    connection.release();
  }
}
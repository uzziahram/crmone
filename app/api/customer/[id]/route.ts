import { NextResponse } from "next/server";
import database from "@/lib/database/db"; 
import { Customer } from "@/types/Customer";
import { Order } from "@/types/Order";
import { InCart } from "@/types/InCart";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: customer_id_raw } = await params;
  const customerId = Number(customer_id_raw);

  if (isNaN(customerId) || customerId <= 0) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  try {
    // 1. Fetch Basic Customer Info (Omit password for security)
    const customerQuery = `
      SELECT customer_id, full_name, email, contact_number, address, created_at 
      FROM customers WHERE customer_id = ?
    `;
    
    // 2. Fetch Orders
    const ordersQuery = `SELECT * FROM orders WHERE customer_id = ?`;

    // 3. Fetch Cart Items with Product details (using a JOIN)
    const cartQuery = `
      SELECT ic.*, p.product_name, p.price, p.sku, p.image_url, p.size
      FROM in_cart ic
      JOIN products p ON ic.product_id = p.product_id
      WHERE ic.customer_id = ?
    `;

    // Execute all queries in parallel for better performance
    const [
      [customerRows],
      [orderRows],
      [cartRows]
    ] = await Promise.all([
      database.query(customerQuery, [customerId]),
      database.query(ordersQuery, [customerId]),
      database.query(cartQuery, [customerId])
    ]);

    const customerBase = (customerRows as any[])[0];

    if (!customerBase) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // 4. Combine data into the Customer interface structure
    const fullCustomer: Customer = {
      ...customerBase,
      orders: orderRows as Order[],
      cart_items: (cartRows as any[]).map(row => ({
        cart_item_id: row.cart_item_id,
        customer_id: row.customer_id,
        product_id: row.product_id,
        quantity: row.quantity,
        added_at: row.added_at,
        product: {
          product_id: row.product_id,
          product_name: row.product_name,
          price: row.price,
          sku: row.sku,
          image_url: row.image_url,
          size: row.size
        }
      }))
    };

    return NextResponse.json(fullCustomer, { status: 200 });
    
  } catch (error) {
    console.error("Failed to fetch full customer profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

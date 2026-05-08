import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db"; // Update with your actual db connection path
import { Customer } from "@/types/Customer"; // Update with your interface paths
import Order from "@/types/Order";
import { OrderItem } from "@/types/Order_item";
import { Product } from "@/types/Product";
import { RowDataPacket } from "mysql2";

export async function GET(
  request: NextRequest,
  { params }: { params: { customer_id: string } }
) {
  const customerId = parseInt(params.customer_id, 10);

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  try {
    // 1. Fetch the Customer
    const [customerRows] = await database.query<RowDataPacket[]>(
      "SELECT * FROM customers WHERE customer_id = ?",
      [customerId]
    );

    if (customerRows.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customerData = customerRows[0];

    // 2. Fetch the Customer's Orders
    const [orderRows] = await database.query<RowDataPacket[]>(
      "SELECT * FROM orders WHERE customer_id = ?",
      [customerId]
    );

    let ordersWithItems: Order[] = [];

    // 3. Fetch Order Items and JOIN with Products (if there are orders)
    if (orderRows.length > 0) {
      const orderIds = orderRows.map((o) => o.order_id);
      const placeholders = orderIds.map(() => "?").join(",");

      const [itemRows] = await database.query<RowDataPacket[]>(
        `
        SELECT 
          oi.*, 
          p.product_name, p.sku, p.category, p.size, p.price, 
          p.stock_quantity, p.low_stock_alert, p.created_at AS product_created_at
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id IN (${placeholders})
        `,
        orderIds
      );

      // Assemble the nested order array
      ordersWithItems = orderRows.map((orderRow) => {
        const itemsForOrder = itemRows.filter((item) => item.order_id === orderRow.order_id);

        const formattedItems: OrderItem[] = itemsForOrder.map((item) => {
          // Construct the optional Product object
          let product: Product | undefined = undefined;
          
          if (item.product_name) {
            product = {
              product_id: item.product_id,
              product_name: item.product_name,
              sku: item.sku,
              category: item.category,
              size: item.size,
              price: item.price,
              stock_quantity: item.stock_quantity,
              low_stock_alert: item.low_stock_alert,
              created_at: item.product_created_at,
            };
          }

          return {
            order_item_id: item.order_item_id,
            order_id: item.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase,
            rating: item.rating,
            comments: item.comments,
            product: product,
          };
        });

        return {
          order_id: orderRow.order_id,
          customer_id: orderRow.customer_id,
          order_date: orderRow.order_date,
          total_amount: orderRow.total_amount,
          discount_applied: orderRow.discount_applied,
          status: orderRow.status,
          items: formattedItems,
        };
      });
    }

    // 4. Assemble the final Customer object matching the interface
    const customer: Customer = {
      customer_id: customerData.customer_id,
      full_name: customerData.full_name,
      email: customerData.email,
      // Map 'password_hash' from the database to the 'password' interface property
      password: customerData.password_hash, 
      contact_number: customerData.contact_number,
      address: customerData.address,
      created_at: customerData.created_at,
      orders: ordersWithItems,
    };

    return NextResponse.json(customer, { status: 200 });

  } catch (error) {
    console.error("Database query error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import database from "@/lib/database/db"; 
import { z } from "zod";
import { errorResponse } from "@/lib/api-utils";

const addToCartSchema = z.object({
  customer_id: z.number().positive(),
  product_id: z.number().positive(),
  quantity: z.number().positive(),
});

const updateCartSchema = z.object({
  cart_item_id: z.number().positive(),
  quantity: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validation = addToCartSchema.safeParse(json);

    if (!validation.success) {
      return errorResponse(
        validation.error.errors.map((e) => e.message).join(", "),
        400
      );
    }

    const { customer_id, product_id, quantity } = validation.data;

    // 3. Check if the product exists and has enough stock
    const [products]: any = await database.query(
      "SELECT stock_quantity FROM products WHERE product_id = ?",
      [product_id]
    );

    if (products.length === 0) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const currentStock = products[0].stock_quantity;
    if (currentStock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Only ${currentStock} left.` },
        { status: 400 }
      );
    }

    // 4. Check if the item is already in the customer's cart
    const [existingCartItem]: any = await database.query(
      "SELECT cart_item_id, quantity FROM in_cart WHERE customer_id = ? AND product_id = ?",
      [customer_id, product_id]
    );

    if (existingCartItem.length > 0) {
      // 5a. If it exists, update the quantity (ensuring it doesn't exceed stock)
      const newQuantity = existingCartItem[0].quantity + quantity;
      
      if (newQuantity > currentStock) {
        return NextResponse.json(
            { error: `Cannot add more. Total in cart would exceed available stock (${currentStock}).` },
            { status: 400 }
        );
      }

      await database.query(
        "UPDATE in_cart SET quantity = ? WHERE cart_item_id = ?",
        [newQuantity, existingCartItem[0].cart_item_id]
      );
    } else {
      // 5b. If it doesn't exist, insert a new row
      await database.query(
        "INSERT INTO in_cart (customer_id, product_id, quantity, added_at) VALUES (?, ?, ?, NOW())",
        [customer_id, product_id, quantity]
      );
    }

    // 6. Return success
    return NextResponse.json(
      { message: "Product successfully added to cart." },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const json = await request.json();
    const validation = updateCartSchema.safeParse(json);

    if (!validation.success) {
      return errorResponse(
        validation.error.errors.map((e) => e.message).join(", "),
        400
      );
    }

    const { cart_item_id, quantity } = validation.data;

    const [cartRows]: any = await database.query(
      `
        SELECT ic.cart_item_id, ic.product_id, p.stock_quantity
        FROM in_cart ic
        JOIN products p ON ic.product_id = p.product_id
        WHERE ic.cart_item_id = ?
      `,
      [cart_item_id]
    );

    if (cartRows.length === 0) {
      return NextResponse.json({ error: "Cart item not found." }, { status: 404 });
    }

    const { stock_quantity: stockQuantity } = cartRows[0];
    if (quantity > stockQuantity) {
      return NextResponse.json(
        { error: `Quantity exceeds available stock (${stockQuantity}).` },
        { status: 400 }
      );
    }

    await database.query("UPDATE in_cart SET quantity = ? WHERE cart_item_id = ?", [
      quantity,
      cart_item_id,
    ]);

    return NextResponse.json({ message: "Cart item quantity updated." }, { status: 200 });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let cart_item_id_raw: string | number | null = searchParams.get("cart_item_id");

    if (!cart_item_id_raw) {
      const contentType = request.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          const body = await request.json();
          cart_item_id_raw = body.cart_item_id;
        } catch (e) { /* ignore parse error */ }
      }
    }

    const cart_item_id = Number(cart_item_id_raw);

    if (isNaN(cart_item_id) || cart_item_id <= 0) {
      return NextResponse.json(
        { error: "Invalid input: cart_item_id must be a positive number." },
        { status: 400 }
      );
    }

    const [result]: any = await database.execute(
      "DELETE FROM in_cart WHERE cart_item_id = ?",
      [cart_item_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Cart item not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Cart item removed." }, { status: 200 });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
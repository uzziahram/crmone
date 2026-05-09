import { NextResponse } from "next/server";
import database from "@/lib/database/db"; 
import { Customer } from "@/types/Customer"; // Adjust path to where your interfaces are saved

export async function GET() {
  try {
    // We omit sensitive or relational fields that aren't part of this specific SELECT query
    type CustomerResponse = Omit<Customer, 'password' | 'orders' | 'cart_items'>;

    const query = `
      SELECT * FROM customers
    `;
    
    // Execute the query and cast the result to our interface type
    const [rows] = await database.query(query);
    const customers = rows as CustomerResponse[];

    return NextResponse.json(customers, { status: 200 });
    
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
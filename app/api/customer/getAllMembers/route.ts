import { NextResponse } from "next/server";
import database from "@/lib/database/db"; 
import { Customer } from "@/types/Customer"; // Adjust path to where your interfaces are saved

export async function GET() {
  try {
    const query = `
      SELECT customer_id, full_name, email, contact_number, address, created_at 
      FROM customers
    `;
    
    const [rows] = await database.query(query);
    return NextResponse.json(rows, { status: 200 });
    
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
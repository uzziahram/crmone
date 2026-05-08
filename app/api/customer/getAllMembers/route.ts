import { NextResponse } from "next/server";
import database from "@/lib/database/db"; // Adjust this import path to where your db file is located

export async function GET() {
  try {
    // We specify the columns to avoid sending the 'password' field to the client
    const query = `
      SELECT 
        customer_id, 
        full_name, 
        email, 
        contact_number, 
        address, 
        created_at 
      FROM customers
    `;
    
    // Execute the query
    const [customers] = await database.query(query);

    // Return the results as JSON
    return NextResponse.json(customers , { status: 200 });
    
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
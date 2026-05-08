import database from "@/lib/database/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Destructuring based on your provided schema fields
    const { 
      full_name, 
      email, 
      password, 
      contact_number, 
      address 
    } = body;

    // Basic check for required fields
    if (!full_name || !email || !password) {
      return NextResponse.json({ message: "Missing required information" }, { status: 400 });
    }

    // Database Insertion 
    // Using the table name 'customers' and column 'password_hash' from your image
    await database.query(
      "INSERT INTO customers (full_name, email, password_hash, contact_number, address) VALUES (?, ?, ?, ?, ?)",
      [full_name, email, password, contact_number, address]
    );

    return NextResponse.json({ message: "Customer added successfully" }, { status: 201 });

  } catch (error: any) {
    console.error("Database Error:", error);

    // Specific error handling for duplicate emails
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: "Email is already in use" }, { status: 409 });
    }

    return NextResponse.json({ message: "Failed to register customer" }, { status: 500 });
  }
}
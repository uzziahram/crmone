import database from "@/lib/database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth/auth";

export async function POST(req: NextRequest) {
  try {
    // 1. Extract customer fields based on your ERD
    const { full_name, email, password, contact_number, address } = await req.json();

    // Basic validation
    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required" },
        { status: 400 }
      );
    }

    // 2. Check if the customer already exists
    const [existing] = await database.execute<RowDataPacket[]>(
      "SELECT email FROM customers WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    // 3. Insert the new customer into the database
    // Note: To match your login code, this inserts the password as plain text. 
    // For production, you should hash this password (e.g., using bcrypt) before inserting.
    const [result] = await database.execute<ResultSetHeader>(
      `INSERT INTO customers (full_name, email, password, contact_number, address) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        full_name, 
        email, 
        password, 
        contact_number || null, 
        address || null
      ]
    );

    // 4. Create session data (Auto-login after registration)
    const token = signToken({
      userId: result.insertId, // Gets the newly created customer_id
      userName: full_name,
      email: email,
    });

    const response = NextResponse.json(
      { message: "Registration success" }, 
      { status: 201 }
    );
    
    // Set the cookie exactly like the login API
    response.cookies.set("token", token, {
      httpOnly: true,   // cannot be accessed by JS (more secure)
      secure: process.env.NODE_ENV === "production", // dynamically checks if in prod
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });
    response.cookies.set("role", "customer", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "An error occurred during registration", status: 500 }
    );
  }
}
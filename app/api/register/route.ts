import database from "@/lib/database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { successResponse, handleApiError, errorResponse } from "@/lib/api-utils";

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  contact_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { full_name, email, password, contact_number, address } = registerSchema.parse(json);

    // 2. Check if the customer already exists
    const [existing] = await database.execute<RowDataPacket[]>(
      "SELECT email FROM customers WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return errorResponse("Email is already registered", 409);
    }

    // 3. Hash the password before inserting
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert the new customer into the database
    const [result] = await database.execute<ResultSetHeader>(
      `INSERT INTO customers (full_name, email, password, contact_number, address) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        full_name, 
        email, 
        hashedPassword, 
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

    const response = successResponse({ message: "Registration success" }, 201);

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
    return handleApiError(err);
  }
}
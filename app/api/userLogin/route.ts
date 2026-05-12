import database from "@/lib/database/db";

import { Customer } from "@/types/Customer";
import { RowDataPacket } from "mysql2";
import { NextRequest, NextResponse } from "next/server";

import { signToken } from "@/lib/auth/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { successResponse, handleApiError, errorResponse } from "@/lib/api-utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest ) {
  try {
    const json = await req.json()
    const { email, password } = loginSchema.parse(json)

    const [rows] = await database.execute<RowDataPacket[]>(
      "SELECT * FROM customers WHERE email = ?",
      [email]
    )

    if (rows.length === 0) {
      return errorResponse("User not found", 400)
    }

    const Member = rows[0] as Customer;

    const isMatch = await bcrypt.compare(password, Member.password);

    if (!isMatch) {
      	return errorResponse("Invalid password", 400)
    }
        // ✅ create session data
    const token = signToken({
      userId: Member.customer_id as number,
      userName: Member.email,
      email: Member.email,
    })

    const response = successResponse({ message: "Login success" })

    response.cookies.set("token", token, {
      httpOnly: true,   // cannot be accessed by JS (more secure)
      secure: false,    // true in production (HTTPS)
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    })
    response.cookies.set("role", "customer", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    })

    return response;

  } catch (err) {
    return handleApiError(err);
  }
}
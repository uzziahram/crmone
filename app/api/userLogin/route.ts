import database from "@/lib/database/db";

import { Customer } from "@/types/Customer";
import { RowDataPacket } from "mysql2";
import { NextRequest, NextResponse } from "next/server";

import { signToken } from "@/lib/auth/auth";

export async function POST(req: NextRequest ) {
  try {
    const { email , password } = await req.json()

    const [rows] = await database.execute<RowDataPacket[]>(
      "SELECT * FROM customers WHERE email = ?",
      [email]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 400 })
    }

    const Member = rows[0] as Customer;

    console.log(Member)

    if (Member.password !== password) {
	console.log(Member.password, password)
      	return NextResponse.json({ error: "Invalid password" }, { status: 400 })
    }
        // ✅ create session data
    const token = signToken({
      userId: Member.customer_id as number,
      userName: Member.email,
      email: Member.email,
    })

    const response = NextResponse.json({ message: "Login success" })
    
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
    return NextResponse.json( { message: "Invalid credentials", status: 401  })
  }
}
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import database from "@/lib/database/db";
import { signToken } from "@/lib/auth/auth";

type AdminRow = RowDataPacket & {
  user_id: number;
  username: string;
  password: string;
};

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const [rows] = await database.execute<AdminRow[]>(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const member = rows[0];
    if (member.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    const token = signToken({
      userId: member.user_id,
      userName: member.username,
    });

    const response = NextResponse.json({ message: "Admin login success" });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    response.cookies.set("role", "admin", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}

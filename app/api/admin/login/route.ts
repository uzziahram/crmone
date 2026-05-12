import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import database from "@/lib/database/db";
import { signToken } from "@/lib/auth/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { successResponse, handleApiError, errorResponse } from "@/lib/api-utils";

const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type AdminRow = RowDataPacket & {
  user_id: number;
  username: string;
  password: string;
};

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { username, password } = adminLoginSchema.parse(json);

    const [rows] = await database.execute<AdminRow[]>(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return errorResponse("Admin not found", 404);
    }

    const member = rows[0];
    const isMatch = await bcrypt.compare(password, member.password);

    if (!isMatch) {
      return errorResponse("Invalid password", 400);
    }

    const token = signToken({
      userId: member.user_id,
      userName: member.username,
    });

    const response = successResponse({ message: "Admin login success" });
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
    return handleApiError(error);
  }
}

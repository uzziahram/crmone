import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status: number = 400, details?: any) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleApiError(error: any) {
  console.error("API Error:", error);

  if (error instanceof ZodError) {
    return errorResponse(error.errors[0].message, 400, error.errors);
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return errorResponse("Record already exists.", 409);
  }

  const message = error instanceof Error ? error.message : "Internal Server Error";
  return errorResponse(message, 500);
}

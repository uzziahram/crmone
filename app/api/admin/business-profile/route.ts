import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db";
import { z } from "zod";

const businessProfileSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  address: z.string().optional().nullable(),
  contact_email: z.string().email("Invalid contact email").optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  currency: z.string().length(3).optional().default("USD"),
});

export async function GET() {
  try {
    const [rows]: any = await database.query("SELECT * FROM business_profile LIMIT 1");
    return NextResponse.json(rows[0] || {}, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const validation = businessProfileSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { company_name, address, contact_email, contact_phone, tax_id, currency } = validation.data;

    const [rows]: any = await database.query("SELECT id FROM business_profile LIMIT 1");
    
    if (rows.length > 0) {
      await database.query(
        `UPDATE business_profile 
         SET company_name = ?, address = ?, contact_email = ?, contact_phone = ?, tax_id = ?, currency = ?
         WHERE id = ?`,
        [company_name, address, contact_email, contact_phone, tax_id, currency, rows[0].id]
      );
    } else {
      await database.query(
        `INSERT INTO business_profile (company_name, address, contact_email, contact_phone, tax_id, currency)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [company_name, address, contact_email, contact_phone, tax_id, currency]
      );
    }

    return NextResponse.json({ message: "Profile updated" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

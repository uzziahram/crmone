import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db";

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
    const body = await req.json();
    const { company_name, address, contact_email, contact_phone, tax_id, currency } = body;

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

import { NextResponse } from "next/server";
import { resetDatabase } from "@/lib/db";

export async function POST() {
  try {
    resetDatabase();
    return NextResponse.json({ success: true, message: "Database reset to enterprise demo seed" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

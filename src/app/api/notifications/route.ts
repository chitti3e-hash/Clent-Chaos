import { NextRequest, NextResponse } from "next/server";
import { getAllNotifications, markNotificationRead } from "@/lib/db";

export async function GET() {
  try {
    const notifications = getAllNotifications();
    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;
    if (id) {
      markNotificationRead(id);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

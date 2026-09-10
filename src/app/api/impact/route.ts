import { NextRequest, NextResponse } from "next/server";
import { getImpactMetrics, updateImpactSettings } from "@/lib/db";

export async function GET() {
  try {
    const impact = getImpactMetrics();
    return NextResponse.json({ success: true, impact });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    updateImpactSettings(body);
    const updated = getImpactMetrics();
    return NextResponse.json({ success: true, impact: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

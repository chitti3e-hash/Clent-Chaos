import { NextRequest, NextResponse } from "next/server";
import { parseOperationalRequest, parseWithHeuristics } from "@/lib/aiParser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, apiKey, provider } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { success: false, error: "Text prompt is required" },
        { status: 400 }
      );
    }

    try {
      const result = await parseOperationalRequest(text, { apiKey, provider });
      return NextResponse.json({ success: true, data: result });
    } catch (parseErr) {
      console.warn("Primary parsing encountered an issue, using fallback heuristic:", parseErr);
      const fallbackResult = parseWithHeuristics(text);
      return NextResponse.json({ success: true, data: fallbackResult, isFallback: true });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

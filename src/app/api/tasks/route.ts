import { NextRequest, NextResponse } from "next/server";
import { getAllTasks, createTask } from "@/lib/db";
import { TaskStatus, Priority } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bucket = searchParams.get("bucket") || undefined;
    const status = searchParams.get("status") || undefined;
    const ownerId = searchParams.get("ownerId") || undefined;
    const search = searchParams.get("search") || undefined;

    const tasks = getAllTasks({ bucket, status, ownerId, search });
    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      title, description, rawInput, sourceType, category, 
      status, priority, dueDate, ownerId, customerId, isBlocked, 
      blockerReason, waitingReason, clarificationNotes,
      subActions, confidenceScore, actorName 
    } = body;

    if (!title || !rawInput) {
      return NextResponse.json(
        { success: false, error: "Title and rawInput are required" },
        { status: 400 }
      );
    }

    const newTask = createTask({
      title,
      description,
      rawInput,
      sourceType: sourceType || "whatsapp",
      category: category || "Operations",
      status: status as TaskStatus,
      priority: (priority as Priority) || "HIGH",
      dueDate,
      ownerId: ownerId || null,
      customerId: customerId || null,
      isBlocked: Boolean(isBlocked),
      blockerReason,
      waitingReason,
      clarificationNotes,
      subActions: subActions || [],
      confidenceScore,
      actorName: actorName || "Operator",
    });

    return NextResponse.json({ success: true, task: newTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

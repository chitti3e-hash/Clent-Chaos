import { NextRequest, NextResponse } from "next/server";
import { getTeamWorkload, updateTask } from "@/lib/db";

export async function GET() {
  try {
    const workload = getTeamWorkload();
    return NextResponse.json({ success: true, workload });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, newOwnerId, actorName } = body;

    if (!taskId || !newOwnerId) {
      return NextResponse.json({ success: false, error: "taskId and newOwnerId are required" }, { status: 400 });
    }

    const updated = updateTask(taskId, { owner_id: newOwnerId }, actorName || "Manager");
    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

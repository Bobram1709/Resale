import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { subscriptionStatus } = body;
  const valid = ["ACTIVE", "INACTIVE", "CANCELLED", "PAST_DUE"];
  if (!valid.includes(subscriptionStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const vendor = await db.vendorProfile.update({
    where: { id },
    data: { subscriptionStatus },
  });
  return NextResponse.json(vendor);
}

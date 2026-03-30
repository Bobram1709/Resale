import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const vendor = await db.vendorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, createdAt: true } },
      products: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  return NextResponse.json(vendor);
}

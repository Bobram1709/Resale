import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const includeInactive = searchParams.get("includeInactive") === "true";

  const where: Record<string, unknown> = {};

  if (!includeInactive) {
    where.subscriptionStatus = "ACTIVE";
  }

  if (search) {
    where.OR = [
      { shopName: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [vendors, total] = await Promise.all([
    db.vendorProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { products: { where: { isPublished: true } } } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.vendorProfile.count({ where }),
  ]);

  return NextResponse.json({ vendors, total, page, limit });
}

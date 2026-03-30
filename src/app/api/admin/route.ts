import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalUsers,
    totalVendors,
    activeVendors,
    totalProducts,
    publishedProducts,
    totalConversations,
    totalMessages,
  ] = await Promise.all([
    db.user.count(),
    db.vendorProfile.count(),
    db.vendorProfile.count({ where: { subscriptionStatus: "ACTIVE" } }),
    db.product.count(),
    db.product.count({ where: { isPublished: true } }),
    db.conversation.count(),
    db.message.count(),
  ]);

  return NextResponse.json({
    totalUsers,
    totalVendors,
    activeVendors,
    totalProducts,
    publishedProducts,
    totalConversations,
    totalMessages,
  });
}

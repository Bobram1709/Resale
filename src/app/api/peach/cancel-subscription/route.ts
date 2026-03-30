import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendorProfile = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!vendorProfile) {
    return NextResponse.json(
      { error: "Vendor profile not found" },
      { status: 404 }
    );
  }

  if (vendorProfile.subscriptionStatus !== "ACTIVE") {
    return NextResponse.json(
      { error: "No active subscription to cancel" },
      { status: 400 }
    );
  }

  // Cancel at end of period - mark as CANCELLED and unpublish products
  await db.vendorProfile.update({
    where: { id: vendorProfile.id },
    data: {
      subscriptionStatus: "CANCELLED",
      peachRegistrationId: null,
    },
  });

  await db.product.updateMany({
    where: { vendorId: vendorProfile.id },
    data: { isPublished: false },
  });

  return NextResponse.json({ success: true, message: "Subscription cancelled" });
}

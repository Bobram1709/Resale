import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCheckoutSession, PEACH_PLANS } from "@/lib/peach-payments";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json();

  if (!plan || !["monthly", "yearly"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
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

  // Validate plan type
  const selectedPlan = PEACH_PLANS[plan as keyof typeof PEACH_PLANS];
  if (!selectedPlan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const { redirectUrl } = await createCheckoutSession({
      vendorId: vendorProfile.id,
      plan: plan as "monthly" | "yearly",
      vendorEmail: session.user.email,
      vendorName: session.user.name,
    });

    return NextResponse.json({ url: redirectUrl });
  } catch (error) {
    console.error("Peach Payments checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

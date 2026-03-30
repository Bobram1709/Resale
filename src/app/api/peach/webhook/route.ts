import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isSuccessCode } from "@/lib/peach-payments";

interface PeachWebhookPayload {
  id: string;
  paymentType: string;
  amount: string;
  currency: string;
  merchantTransactionId: string;
  registrationId?: string;
  result: {
    code: string;
    description: string;
  };
  customParameters?: {
    vendorId?: string;
    plan?: string;
  };
}

export async function POST(req: NextRequest) {
  let body: PeachWebhookPayload;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("Peach Payments webhook received:", JSON.stringify(body, null, 2));

  // Optionally verify webhook secret via header
  const webhookSecret = process.env.PEACH_PAYMENTS_WEBHOOK_SECRET;
  if (webhookSecret) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      console.warn("Peach webhook: invalid or missing authorization header");
      // In production you may want to return 401 here
      // For now, we log and continue
    }
  }

  const { result, merchantTransactionId, registrationId, customParameters } =
    body;

  if (!result?.code) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    if (isSuccessCode(result.code)) {
      // Extract vendorId and plan from merchantTransactionId or customParameters
      let vendorId: string | undefined;
      let plan: string | undefined;

      if (customParameters?.vendorId) {
        vendorId = customParameters.vendorId;
        plan = customParameters.plan;
      } else if (merchantTransactionId) {
        // Format: sub_{vendorId}_{plan}_{timestamp}
        const parts = merchantTransactionId.split("_");
        if (parts.length >= 3 && parts[0] === "sub") {
          vendorId = parts[1];
          plan = parts[2];
        }
      }

      if (vendorId) {
        const now = new Date();
        let subscriptionEndsAt: Date;

        if (plan === "yearly") {
          subscriptionEndsAt = new Date(
            now.getTime() + 365 * 24 * 60 * 60 * 1000
          );
        } else {
          // default monthly
          subscriptionEndsAt = new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000
          );
        }

        await db.vendorProfile.update({
          where: { id: vendorId },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionPlan: plan || "monthly",
            peachRegistrationId: registrationId || null,
            peachMerchantTransId: merchantTransactionId,
            subscriptionEndsAt,
          },
        });

        console.log(
          `Vendor ${vendorId} subscription activated via Peach Payments`
        );
      }
    } else {
      // Payment failed or pending
      console.log(
        `Peach Payments: non-success result code ${result.code}: ${result.description}`
      );

      // If we can identify the vendor and the payment was a failure (not just pending)
      // we might want to mark as PAST_DUE
      const failureCodes = ["800.100.155", "800.300.101", "100.396.104"];
      if (failureCodes.includes(result.code) && merchantTransactionId) {
        const parts = merchantTransactionId.split("_");
        if (parts.length >= 3 && parts[0] === "sub") {
          const vendorId = parts[1];
          const vendorProfile = await db.vendorProfile.findUnique({
            where: { id: vendorId },
          });
          if (
            vendorProfile &&
            vendorProfile.subscriptionStatus === "ACTIVE"
          ) {
            await db.vendorProfile.update({
              where: { id: vendorId },
              data: { subscriptionStatus: "PAST_DUE" },
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Peach webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

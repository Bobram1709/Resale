import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const vendorProfileId = session.metadata?.vendorProfileId;
        const plan = session.metadata?.plan;

        if (vendorProfileId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await db.vendorProfile.update({
            where: { id: vendorProfileId },
            data: {
              subscriptionStatus: "ACTIVE",
              subscriptionPlan: plan,
              stripeSubscriptionId: subscription.id,
              subscriptionEndsAt: new Date(
                subscription.current_period_end * 1000
              ),
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          const vendorProfile = await db.vendorProfile.findFirst({
            where: { stripeSubscriptionId: subscription.id },
          });

          if (vendorProfile) {
            await db.vendorProfile.update({
              where: { id: vendorProfile.id },
              data: {
                subscriptionStatus: "ACTIVE",
                subscriptionEndsAt: new Date(
                  subscription.current_period_end * 1000
                ),
              },
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const vendorProfile = await db.vendorProfile.findFirst({
            where: { stripeSubscriptionId: invoice.subscription as string },
          });

          if (vendorProfile) {
            await db.vendorProfile.update({
              where: { id: vendorProfile.id },
              data: { subscriptionStatus: "PAST_DUE" },
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const vendorProfile = await db.vendorProfile.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (vendorProfile) {
          await db.vendorProfile.update({
            where: { id: vendorProfile.id },
            data: {
              subscriptionStatus: "CANCELLED",
              stripeSubscriptionId: null,
            },
          });

          // Unpublish all products
          await db.product.updateMany({
            where: { vendorId: vendorProfile.id },
            data: { isPublished: false },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const vendorProfile = await db.vendorProfile.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (vendorProfile) {
          const status =
            subscription.status === "active"
              ? "ACTIVE"
              : subscription.status === "past_due"
              ? "PAST_DUE"
              : subscription.status === "canceled"
              ? "CANCELLED"
              : "INACTIVE";

          await db.vendorProfile.update({
            where: { id: vendorProfile.id },
            data: {
              subscriptionStatus: status,
              subscriptionEndsAt: new Date(
                subscription.current_period_end * 1000
              ),
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

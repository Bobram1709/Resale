import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

export const STRIPE_PLANS = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    amount: 2999,
    interval: "month" as const,
    label: "Monthly",
    price: "Rs.299/mo",
  },
  yearly: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID!,
    amount: 29900,
    interval: "year" as const,
    label: "Yearly",
    price: "Rs.2,999/yr",
  },
};

export const PEACH_BASE_URL =
  process.env.PEACH_BASE_URL || "https://testsecure.peachpayments.com";

export const PEACH_ENTITY_ID = process.env.PEACH_PAYMENTS_ENTITY_ID!;
export const PEACH_SECRET_KEY = process.env.PEACH_PAYMENTS_SECRET_KEY!;
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const PEACH_PLANS = {
  monthly: {
    amount: "299.00",
    amountCents: 29900,
    interval: "month" as const,
    label: "Monthly",
    price: "R299/mo",
    description: "Resale Vendor Subscription - Monthly Plan",
  },
  yearly: {
    amount: "2999.00",
    amountCents: 299900,
    interval: "year" as const,
    label: "Yearly",
    price: "R2,999/yr",
    description: "Resale Vendor Subscription - Yearly Plan",
  },
};

export interface PeachCheckoutResponse {
  checkoutId: string;
  [key: string]: unknown;
}

export async function createCheckoutSession({
  vendorId,
  plan,
  vendorEmail,
  vendorName,
}: {
  vendorId: string;
  plan: "monthly" | "yearly";
  vendorEmail: string;
  vendorName: string;
}): Promise<{ checkoutId: string; redirectUrl: string }> {
  const selectedPlan = PEACH_PLANS[plan];
  const merchantTransactionId = `sub_${vendorId}_${plan}_${Date.now()}`;

  const body = {
    authentication: {
      entityId: PEACH_ENTITY_ID,
    },
    amount: selectedPlan.amount,
    currency: "ZAR",
    paymentType: "DB",
    merchantTransactionId,
    billing: {
      street1: "",
      city: "",
      country: "ZA",
    },
    customer: {
      email: vendorEmail,
      givenName: vendorName,
    },
    shopperResultUrl: `${APP_URL}/dashboard/subscription/success`,
    cancelUrl: `${APP_URL}/dashboard/subscription`,
    notificationUrl: `${APP_URL}/api/peach/webhook`,
    description: selectedPlan.description,
    createRegistration: true,
    recurringType: "INITIAL",
    customParameters: {
      vendorId,
      plan,
    },
  };

  const response = await fetch(`${PEACH_BASE_URL}/v2/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PEACH_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Peach Payments API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as PeachCheckoutResponse;

  if (!data.checkoutId) {
    throw new Error("No checkoutId returned from Peach Payments");
  }

  return {
    checkoutId: data.checkoutId,
    redirectUrl: `${PEACH_BASE_URL}/v2/checkout/${data.checkoutId}/payment`,
  };
}

export function isSuccessCode(code: string): boolean {
  // Peach Payments success codes
  return code === "000.000.000" || code === "000.100.110";
}

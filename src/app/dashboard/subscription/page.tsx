import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, XCircle, AlertCircle, CreditCard, ArrowLeft } from "lucide-react";
import SubscriptionCard from "@/components/SubscriptionCard";
import CancelSubscriptionButton from "./CancelSubscriptionButton";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const vendorProfile = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendorProfile) redirect("/");

  const isActive = vendorProfile.subscriptionStatus === "ACTIVE";

  const statusMap = {
    ACTIVE: { icon: CheckCircle, label: "Active", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
    INACTIVE: { icon: Clock, label: "Inactive — No Subscription", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" },
    CANCELLED: { icon: XCircle, label: "Cancelled", color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
    PAST_DUE: { icon: AlertCircle, label: "Past Due", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  };
  const status = statusMap[vendorProfile.subscriptionStatus] ?? statusMap.INACTIVE;
  const StatusIcon = status.icon;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your vendor subscription via Peach Payments</p>
      </div>

      {/* Current status */}
      <div className={`rounded-2xl border p-6 mb-8 ${status.bg} ${status.border}`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-6 h-6 ${status.color}`} />
          <div>
            <p className={`font-bold ${status.color}`}>{status.label}</p>
            {vendorProfile.subscriptionPlan && (
              <p className={`text-sm mt-0.5 ${status.color} opacity-80`}>
                Plan: {vendorProfile.subscriptionPlan.charAt(0).toUpperCase() + vendorProfile.subscriptionPlan.slice(1)}
              </p>
            )}
            {vendorProfile.subscriptionEndsAt && (
              <p className={`text-sm mt-0.5 ${status.color} opacity-80`}>
                {isActive ? "Renews" : "Expired"}:{" "}
                {new Date(vendorProfile.subscriptionEndsAt).toLocaleDateString("en-MU", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
        {isActive && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <CancelSubscriptionButton />
          </div>
        )}
      </div>

      {!isActive && (
        <>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a Plan</h2>
            <p className="text-gray-500">Subscribe to activate your store and start publishing products</p>
          </div>
          <SubscriptionCard />
          <div className="mt-6 bg-gray-50 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-800 mb-3">What&apos;s included in every plan:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                "Unlimited product listings",
                "Public vendor store page",
                "Direct customer chat",
                "No commission on sales",
                "Peach Payments secure checkout",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

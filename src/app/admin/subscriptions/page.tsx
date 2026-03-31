import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const vendors = await db.vendorProfile.findMany({
    where: { subscriptionStatus: { not: "INACTIVE" } },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const activeCount = vendors.filter((v) => v.subscriptionStatus === "ACTIVE").length;
  const monthlyCount = vendors.filter((v) => v.subscriptionPlan === "monthly" && v.subscriptionStatus === "ACTIVE").length;
  const yearlyCount = vendors.filter((v) => v.subscriptionPlan === "yearly" && v.subscriptionStatus === "ACTIVE").length;
  const estMRR = monthlyCount * 299 + yearlyCount * Math.round(2999 / 12);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-500 mt-1">Peach Payments subscription overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active", value: activeCount, color: "green" },
          { label: "Monthly Plan", value: monthlyCount, color: "blue" },
          { label: "Yearly Plan", value: yearlyCount, color: "purple" },
          { label: "Est. MRR", value: `Rs.${estMRR.toLocaleString()}`, color: "amber" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500 font-medium mb-2">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">All Subscriptions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Vendor</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Plan</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Renews / Ended</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 text-sm">{v.shopName}</p>
                    <p className="text-xs text-gray-400">{v.user.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm capitalize text-gray-700">{v.subscriptionPlan || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      v.subscriptionStatus === "ACTIVE" ? "bg-green-100 text-green-700"
                      : v.subscriptionStatus === "PAST_DUE" ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                    }`}>
                      {v.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {v.subscriptionEndsAt
                      ? new Date(v.subscriptionEndsAt).toLocaleDateString("en-MU")
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {v.subscriptionPlan === "yearly" ? "Rs.2,999/yr" : "Rs.299/mo"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

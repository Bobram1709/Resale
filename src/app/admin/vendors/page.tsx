import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Store, ExternalLink } from "lucide-react";
import AdminVendorActions from "./AdminVendorActions";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const vendors = await db.vendorProfile.findMany({
    include: {
      user: { select: { name: true, email: true, createdAt: true } },
      _count: { select: { products: true, conversations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
        <p className="text-gray-500 mt-1">{vendors.length} registered vendor{vendors.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Vendor</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Plan</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Products</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Chats</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Store className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{vendor.shopName}</p>
                        <p className="text-xs text-gray-400">{vendor.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 capitalize">{vendor.subscriptionPlan || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{vendor._count.products}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{vendor._count.conversations}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      vendor.subscriptionStatus === "ACTIVE" ? "bg-green-100 text-green-700"
                      : vendor.subscriptionStatus === "PAST_DUE" ? "bg-amber-100 text-amber-700"
                      : vendor.subscriptionStatus === "CANCELLED" ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                    }`}>
                      {vendor.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/vendors/${vendor.id}`}
                        target="_blank"
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View store"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <AdminVendorActions vendorId={vendor.id} currentStatus={vendor.subscriptionStatus} />
                    </div>
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

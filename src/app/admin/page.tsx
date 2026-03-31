import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Store, Package, MessageCircle, Shield, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const [
    totalUsers,
    totalVendors,
    activeVendors,
    totalProducts,
    publishedProducts,
    totalMessages,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "VENDOR" } }),
    db.vendorProfile.count({ where: { subscriptionStatus: "ACTIVE" } }),
    db.product.count(),
    db.product.count({ where: { isPublished: true } }),
    db.message.count(),
  ]);

  const recentVendors = await db.vendorProfile.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-500">Platform overview</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {[
          { label: "Total Users", value: totalUsers, sub: `${totalVendors} vendors`, icon: Users, color: "blue" },
          { label: "Active Vendors", value: activeVendors, sub: `${totalVendors} total`, icon: Store, color: "green" },
          { label: "Products", value: totalProducts, sub: `${publishedProducts} published`, icon: Package, color: "purple" },
          { label: "Messages", value: totalMessages, sub: "platform-wide", icon: MessageCircle, color: "pink" },
          { label: "Revenue (subscriptions)", value: activeVendors, sub: `Rs.${(activeVendors * 299).toLocaleString()}/mo est.`, icon: TrendingUp, color: "amber" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <div className={`w-8 h-8 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <Link href="/admin/vendors" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-blue-200 hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
            <Store className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-gray-900">Manage Vendors</h3>
          <p className="text-sm text-gray-500 mt-1">View and manage vendor accounts and subscriptions</p>
        </Link>
        <Link href="/admin/subscriptions" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-purple-200 hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
            <TrendingUp className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-gray-900">Subscriptions</h3>
          <p className="text-sm text-gray-500 mt-1">Monitor subscription statuses and revenue</p>
        </Link>
      </div>

      {/* Recent vendors */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Recent Vendors</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentVendors.map((v) => (
            <div key={v.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{v.shopName}</p>
                <p className="text-sm text-gray-500">{v.user.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                v.subscriptionStatus === "ACTIVE" ? "bg-green-100 text-green-700"
                : v.subscriptionStatus === "PAST_DUE" ? "bg-amber-100 text-amber-700"
                : v.subscriptionStatus === "CANCELLED" ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
              }`}>
                {v.subscriptionStatus}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Package,
  MessageCircle,
  CreditCard,
  Plus,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  const vendorProfile = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: {
          products: true,
          conversations: true,
        },
      },
    },
  });

  if (!vendorProfile) redirect("/");

  const publishedCount = await db.product.count({
    where: { vendorId: vendorProfile.id, isPublished: true },
  });

  const unreadMessages = await db.message.count({
    where: {
      receiverId: session.user.id,
      isRead: false,
    },
  });

  const subscriptionActive = vendorProfile.subscriptionStatus === "ACTIVE";

  const statusInfo = {
    ACTIVE: {
      icon: CheckCircle,
      label: "Active",
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    INACTIVE: {
      icon: Clock,
      label: "Inactive",
      color: "text-gray-500",
      bg: "bg-gray-50",
      border: "border-gray-200",
    },
    CANCELLED: {
      icon: XCircle,
      label: "Cancelled",
      color: "text-red-500",
      bg: "bg-red-50",
      border: "border-red-200",
    },
    PAST_DUE: {
      icon: AlertCircle,
      label: "Past Due",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
  };

  const status = statusInfo[vendorProfile.subscriptionStatus] ?? statusInfo.INACTIVE;
  const StatusIcon = status.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session.user.name}
        </h1>
        <p className="text-gray-500 mt-1">{vendorProfile.shopName}</p>
      </div>

      {/* Subscription warning */}
      {!subscriptionActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Subscription Required</p>
            <p className="text-amber-700 text-sm mt-1">
              You need an active subscription to publish products and appear in search results.
            </p>
            <Link
              href="/dashboard/subscription"
              className="inline-block mt-3 bg-amber-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              Subscribe via Peach Payments
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500 font-medium">Total Products</p>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{vendorProfile._count.products}</p>
          <p className="text-xs text-gray-400 mt-1">{publishedCount} published</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500 font-medium">Conversations</p>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{vendorProfile._count.conversations}</p>
          {unreadMessages > 0 && (
            <p className="text-xs text-purple-600 font-medium mt-1">{unreadMessages} unread</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500 font-medium">Published</p>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{publishedCount}</p>
          <p className="text-xs text-gray-400 mt-1">active listings</p>
        </div>

        <div className={`rounded-2xl border shadow-sm p-5 ${status.bg} ${status.border}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm font-medium ${status.color}`}>Subscription</p>
            <StatusIcon className={`w-5 h-5 ${status.color}`} />
          </div>
          <p className={`text-lg font-bold ${status.color}`}>{status.label}</p>
          {vendorProfile.subscriptionPlan && (
            <p className={`text-xs mt-1 ${status.color} opacity-70`}>
              {vendorProfile.subscriptionPlan} plan
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/dashboard/products/new"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-blue-200 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
            <Plus className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-gray-900">Add Product</h3>
          <p className="text-sm text-gray-500 mt-1">List a new product for sale</p>
        </Link>

        <Link
          href="/dashboard/products"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-purple-200 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
            <ShoppingBag className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-gray-900">My Products</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your product listings</p>
        </Link>

        <Link
          href="/dashboard/messages"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-green-200 hover:shadow-md transition-all group relative"
        >
          {unreadMessages > 0 && (
            <span className="absolute top-5 right-5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </span>
          )}
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
            <MessageCircle className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-gray-900">Messages</h3>
          <p className="text-sm text-gray-500 mt-1">
            {unreadMessages > 0 ? `${unreadMessages} unread messages` : "View customer conversations"}
          </p>
        </Link>

        <Link
          href="/dashboard/subscription"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
            <CreditCard className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-gray-900">Subscription</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your Peach Payments subscription</p>
        </Link>
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle, ArrowLeft, Package, User } from "lucide-react";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") redirect("/");

  const vendorProfile = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendorProfile) redirect("/");

  const conversations = await db.conversation.findMany({
    where: { vendorId: vendorProfile.id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true, imageUrl: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { name: true } } },
      },
      _count: {
        select: {
          messages: { where: { isRead: false, receiverId: session.user.id } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-500 mt-1">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No messages yet</h3>
          <p className="text-gray-400">Customers will be able to contact you from your store page</p>
        </div>
      ) : (
        <MessagesClient
          conversations={conversations.map((c) => ({
            id: c.id,
            customer: c.customer,
            product: c.product,
            lastMessage: c.messages[0] ?? null,
            unreadCount: c._count.messages,
            createdAt: c.createdAt.toISOString(),
          }))}
          currentUserId={session.user.id}
        />
      )}
    </div>
  );
}

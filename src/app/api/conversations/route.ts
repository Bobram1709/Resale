import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let conversations;

  if (session.user.role === "VENDOR" && session.user.vendorProfileId) {
    conversations = await db.conversation.findMany({
      where: { vendorId: session.user.vendorProfileId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        vendor: { select: { id: true, shopName: true, logoUrl: true } },
        product: { select: { id: true, name: true, imageUrl: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: { where: { isRead: false, receiverId: session.user.id } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    conversations = await db.conversation.findMany({
      where: { customerId: session.user.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        vendor: { select: { id: true, shopName: true, logoUrl: true } },
        product: { select: { id: true, name: true, imageUrl: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: { where: { isRead: false, receiverId: session.user.id } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json(conversations);
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only customers can initiate conversations
  if (session.user.role === "VENDOR") {
    return NextResponse.json(
      { error: "Vendors cannot initiate conversations" },
      { status: 403 }
    );
  }

  const { vendorId, productId } = await req.json();

  if (!vendorId) {
    return NextResponse.json(
      { error: "vendorId is required" },
      { status: 400 }
    );
  }

  // Check vendor exists
  const vendor = await db.vendorProfile.findUnique({ where: { id: vendorId } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  // Find or create conversation
  const conversation = await db.conversation.upsert({
    where: {
      vendorId_customerId_productId: {
        vendorId,
        customerId: session.user.id,
        productId: productId ?? null,
      },
    },
    update: {},
    create: {
      vendorId,
      customerId: session.user.id,
      productId: productId ?? null,
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      vendor: { select: { id: true, shopName: true, logoUrl: true } },
      product: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  return NextResponse.json(conversation);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        include: {
          sender: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  // Check user has access to this conversation
  const isParticipant =
    conversation.customerId === session.user.id ||
    (session.user.vendorProfileId &&
      conversation.vendorId === session.user.vendorProfileId) ||
    session.user.role === "ADMIN";

  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mark messages as read
  await db.message.updateMany({
    where: {
      conversationId: id,
      receiverId: session.user.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  return NextResponse.json(conversation.messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      vendor: { select: { userId: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const isCustomer = conversation.customerId === session.user.id;
  const isVendor = conversation.vendor.userId === session.user.id;

  if (!isCustomer && !isVendor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const receiverId = isCustomer
    ? conversation.vendor.userId
    : conversation.customerId;

  const message = await db.message.create({
    data: {
      conversationId: id,
      senderId: session.user.id,
      receiverId,
      content: content.trim(),
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(message, { status: 201 });
}

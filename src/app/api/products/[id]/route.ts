import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getVendorProduct(productId: string, userId: string) {
  const vendorProfile = await db.vendorProfile.findUnique({ where: { userId } });
  if (!vendorProfile) return null;
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || product.vendorId !== vendorProfile.id) return null;
  return { product, vendorProfile };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const result = await getVendorProduct(id, session.user.id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, description, price, imageUrl, category, stock } = body;

  if (!name || !description || price === undefined || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const updated = await db.product.update({
    where: { id },
    data: {
      name: String(name),
      description: String(description),
      price: Number(price),
      imageUrl: imageUrl ? String(imageUrl) : null,
      category: String(category),
      stock: Number(stock) || 0,
    },
  });
  return NextResponse.json(updated);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const result = await getVendorProduct(id, session.user.id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Check subscription before publishing
  if (body.isPublished === true && result.vendorProfile.subscriptionStatus !== "ACTIVE") {
    return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
  }

  const updated = await db.product.update({
    where: { id },
    data: { isPublished: Boolean(body.isPublished) },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const result = await getVendorProduct(id, session.user.id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

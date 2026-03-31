import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import EditProductForm from "./EditProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const vendorProfile = await db.vendorProfile.findUnique({ where: { userId: session.user.id } });
  if (!vendorProfile) redirect("/");

  const product = await db.product.findUnique({ where: { id } });
  if (!product || product.vendorId !== vendorProfile.id) notFound();

  return <EditProductForm product={product} />;
}

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ChatBox from "@/components/ChatBox";
import { ShoppingBag, MapPin, Package, Store, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    include: {
      vendor: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!product || !product.isPublished) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product details */}
        <div className="lg:col-span-2">
          {/* Image */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm aspect-video flex items-center justify-center mb-6">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-300">
                <ShoppingBag className="w-20 h-20" />
                <p className="text-sm">No image available</p>
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-3">
                  {product.category}
                </span>
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-bold text-blue-600">Rs.{product.price.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  {product.stock > 0 ? (
                    <span className="text-sm text-green-600 font-medium">{product.stock} in stock</span>
                  ) : (
                    <span className="text-sm text-red-500 font-medium">Out of stock</span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-gray-600 mt-4 leading-relaxed">{product.description}</p>

            {/* Vendor info */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <Link
                href={`/vendors/${product.vendor.id}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                  {product.vendor.logoUrl ? (
                    <img src={product.vendor.logoUrl} alt={product.vendor.shopName} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    product.vendor.shopName[0]
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                    <Store className="w-4 h-4" />
                    {product.vendor.shopName}
                  </p>
                  {product.vendor.location && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {product.vendor.location}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              Contact Vendor
            </h3>
            <ChatBox
              vendorId={product.vendor.id}
              vendorName={product.vendor.shopName}
              productId={product.id}
              productName={product.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

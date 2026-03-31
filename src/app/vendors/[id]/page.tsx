import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ChatBox from "@/components/ChatBox";
import { MapPin, Package, Calendar, Store, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VendorStorePage({ params }: PageProps) {
  const { id } = await params;

  const vendor = await db.vendorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, createdAt: true } },
      products: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { products: { where: { isPublished: true } } } },
    },
  });

  if (!vendor) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store banner */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 h-40 md:h-56 relative">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Store header */}
        <div className="-mt-12 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white flex-shrink-0">
              {vendor.logoUrl ? (
                <img src={vendor.logoUrl} alt={vendor.shopName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Store className="w-10 h-10 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{vendor.shopName}</h1>
                {vendor.subscriptionStatus === "ACTIVE" && (
                  <span className="flex items-center gap-1.5 text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Verified Vendor
                  </span>
                )}
              </div>
              {vendor.description && (
                <p className="text-gray-600 mt-2 max-w-2xl">{vendor.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-gray-500">
                {vendor.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {vendor.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  {vendor._count.products} products
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(vendor.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Products section */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              Products
              <span className="ml-2 text-sm font-normal text-gray-500">({vendor.products.length})</span>
            </h2>

            {vendor.products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No products listed yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {vendor.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200"
                  >
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                        {product.category}
                      </span>
                      <h3 className="font-semibold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-blue-600">
                          Rs.{product.price.toFixed(2)}
                        </span>
                        {product.stock > 0 ? (
                          <span className="text-xs text-green-600 font-medium">{product.stock} in stock</span>
                        ) : (
                          <span className="text-xs text-red-500 font-medium">Out of stock</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Chat box */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Contact Vendor</h2>
            <ChatBox vendorId={vendor.id} vendorName={vendor.shopName} />
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ShoppingBag, Store, MessageCircle, CreditCard, ArrowRight, CheckCircle } from "lucide-react";
import { db } from "@/lib/db";

async function getStats() {
  const [vendorCount, productCount] = await Promise.all([
    db.vendorProfile.count({ where: { subscriptionStatus: "ACTIVE" } }),
    db.product.count({ where: { isPublished: true } }),
  ]);
  return { vendorCount, productCount };
}

async function getFeaturedProducts() {
  return db.product.findMany({
    where: {
      isPublished: true,
      vendor: { subscriptionStatus: "ACTIVE" },
    },
    include: {
      vendor: { select: { id: true, shopName: true, logoUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
}

export default async function HomePage() {
  const [stats, featuredProducts] = await Promise.all([
    getStats(),
    getFeaturedProducts(),
  ]);

  return (
    <div className="flex flex-col min-h-full">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <ShoppingBag className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
            South Africa&apos;s Marketplace
            <br />
            <span className="text-blue-200">for Independent Vendors</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Discover unique products from local sellers. Chat directly with vendors, find great deals, and support local businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
            >
              <ShoppingBag className="w-5 h-5" />
              Shop Now
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-white/20 text-white border border-white/30 px-8 py-3.5 rounded-xl font-bold hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              <Store className="w-5 h-5" />
              Become a Vendor
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-2 gap-6 max-w-md mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">{stats.vendorCount}+</p>
              <p className="text-blue-200 text-sm mt-1">Active Vendors</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">{stats.productCount}+</p>
              <p className="text-blue-200 text-sm mt-1">Products Listed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Why Choose Resale?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Store className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Local Vendors</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Discover and support South African independent sellers with unique, quality products.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Direct Chat</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Message vendors directly to ask questions, negotiate, and build relationships.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Secure Payments</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Vendor subscriptions powered by Peach Payments — South Africa&apos;s trusted payment gateway.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
              <Link
                href="/products"
                className="flex items-center gap-1 text-blue-600 font-medium hover:text-blue-700 transition-colors text-sm"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`} className="group">
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium text-gray-600">
                        {product.category}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-base font-bold text-blue-600 mt-1">
                        R{product.price.toFixed(2)}
                      </p>
                      {product.vendor && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{product.vendor.shopName}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA for vendors */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Sell?</h2>
          <p className="text-purple-100 text-lg mb-8">
            Join Resale and start selling your products to thousands of customers. Simple subscription, no commission.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-white/10 rounded-xl p-5 text-left backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span className="font-semibold">Monthly Plan</span>
              </div>
              <p className="text-2xl font-bold">Rs.299<span className="text-sm font-normal text-purple-200">/mo</span></p>
            </div>
            <div className="bg-white/10 rounded-xl p-5 text-left backdrop-blur-sm border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span className="font-semibold">Yearly Plan</span>
              </div>
              <p className="text-2xl font-bold">Rs.2,999<span className="text-sm font-normal text-purple-200">/yr</span></p>
              <p className="text-xs text-green-300 mt-1">Save Rs.588/yr</p>
            </div>
          </div>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 mt-8 bg-white text-purple-700 px-8 py-3.5 rounded-xl font-bold hover:bg-purple-50 transition-colors shadow-lg"
          >
            Start Selling Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}

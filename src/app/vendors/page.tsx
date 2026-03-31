import { db } from "@/lib/db";
import VendorCard from "@/components/VendorCard";
import { Store, Search } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function VendorsPage({ searchParams }: PageProps) {
  const { search } = await searchParams;

  const where: Record<string, unknown> = {
    subscriptionStatus: "ACTIVE",
  };

  if (search) {
    where.OR = [
      { shopName: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const vendors = await db.vendorProfile.findMany({
    where,
    include: {
      _count: { select: { products: { where: { isPublished: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Vendors</h1>
        </div>
        <p className="text-gray-500">Discover {vendors.length} active stores</p>
      </div>

      {/* Search */}
      <form method="get" className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search vendors..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Vendors grid */}
      {vendors.length === 0 ? (
        <div className="text-center py-24">
          <Store className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No vendors found</h3>
          <p className="text-gray-500 text-sm">
            {search ? `No vendors match "${search}"` : "No active vendors yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
}

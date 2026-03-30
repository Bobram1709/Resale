import Link from "next/link";
import { Store, MapPin, Package, CheckCircle } from "lucide-react";

interface VendorCardProps {
  vendor: {
    id: string;
    shopName: string;
    description?: string | null;
    logoUrl?: string | null;
    location?: string | null;
    subscriptionStatus: string;
    _count?: {
      products: number;
    };
  };
}

export default function VendorCard({ vendor }: VendorCardProps) {
  return (
    <Link href={`/vendors/${vendor.id}`} className="group">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
        </div>

        {/* Logo */}
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-8 mb-3">
            <div className="w-16 h-16 rounded-xl border-4 border-white shadow-md overflow-hidden bg-white">
              {vendor.logoUrl ? (
                <img
                  src={vendor.logoUrl}
                  alt={vendor.shopName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <Store className="w-7 h-7 text-white" />
                </div>
              )}
            </div>
            {vendor.subscriptionStatus === "ACTIVE" && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Active
              </div>
            )}
          </div>

          <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
            {vendor.shopName}
          </h3>

          {vendor.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{vendor.description}</p>
          )}

          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            {vendor.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {vendor.location}
              </div>
            )}
            {vendor._count !== undefined && (
              <div className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                {vendor._count.products} products
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

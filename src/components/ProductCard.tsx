import Link from "next/link";
import { ShoppingBag, Package } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string | null;
    category: string;
    stock: number;
    vendor?: {
      id: string;
      shopName: string;
      logoUrl?: string | null;
    };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200">
        {/* Product image */}
        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
            </div>
          )}
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-600">
            {product.category}
          </div>
        </div>

        {/* Product info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-blue-600">
              R{product.price.toFixed(2)}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Package className="w-3.5 h-3.5" />
              {product.stock > 0 ? (
                <span className="text-green-600 font-medium">{product.stock} left</span>
              ) : (
                <span className="text-red-500 font-medium">Out of stock</span>
              )}
            </div>
          </div>

          {product.vendor && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {product.vendor.shopName[0]}
              </div>
              <span className="text-xs text-gray-500">{product.vendor.shopName}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

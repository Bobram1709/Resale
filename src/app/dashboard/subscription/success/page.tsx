import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SubscriptionSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">You&apos;re Live!</h1>
        <p className="text-gray-500 mb-8">
          Your subscription is now active. Your store is live and you can start publishing products.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard/products/new"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Add Your First Product
          </Link>
          <Link
            href="/dashboard"
            className="text-gray-500 hover:text-gray-700 font-medium py-2"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

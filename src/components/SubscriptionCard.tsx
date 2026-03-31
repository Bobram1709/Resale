"use client";

import { useState } from "react";
import { Check, Loader2, Zap } from "lucide-react";
import toast from "react-hot-toast";

const features = [
  "Unlimited product listings",
  "Direct customer chat",
  "Store customization",
  "Analytics dashboard",
  "Priority support",
];

export default function SubscriptionCard() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    setLoading(plan);
    try {
      const res = await fetch("/api/peach/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
      {/* Monthly Plan */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-300 transition-colors">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">Monthly</h3>
          <div className="mt-2">
            <span className="text-4xl font-bold text-gray-900">Rs.299</span>
            <span className="text-gray-500 ml-1">/mo</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Billed monthly, cancel anytime</p>
        </div>

        <ul className="space-y-2 mb-6">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <button
          onClick={() => handleSubscribe("monthly")}
          disabled={loading !== null}
          className="w-full py-2.5 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading === "monthly" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : null}
          Get Started Monthly
        </button>
      </div>

      {/* Yearly Plan */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
          BEST VALUE
        </div>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/10 rounded-full" />

        <div className="relative mb-4">
          <h3 className="text-lg font-bold text-white">Yearly</h3>
          <div className="mt-2">
            <span className="text-4xl font-bold text-white">Rs.2,999</span>
            <span className="text-blue-200 ml-1">/yr</span>
          </div>
          <p className="text-blue-200 text-sm mt-1">Save Rs.588 vs monthly</p>
        </div>

        <ul className="space-y-2 mb-6 relative">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-blue-100">
              <Check className="w-4 h-4 text-blue-200 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <button
          onClick={() => handleSubscribe("yearly")}
          disabled={loading !== null}
          className="relative w-full py-2.5 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading === "yearly" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Get Started Yearly
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  vendorId: string;
  currentStatus: string;
}

export default function AdminVendorActions({ vendorId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const update = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionStatus: status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Vendor status updated to ${status}`);
      router.refresh();
    } catch {
      toast.error("Failed to update vendor");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;

  return (
    <div className="flex gap-1">
      {currentStatus !== "ACTIVE" && (
        <button onClick={() => update("ACTIVE")} className="p-1.5 text-gray-400 hover:text-green-600 transition-colors" title="Activate">
          <CheckCircle className="w-4 h-4" />
        </button>
      )}
      {currentStatus === "ACTIVE" && (
        <button onClick={() => update("INACTIVE")} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Deactivate">
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

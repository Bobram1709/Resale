"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  productId: string;
  isPublished: boolean;
  canPublish: boolean;
}

export default function PublishToggle({ productId, isPublished, canPublish }: Props) {
  const [published, setPublished] = useState(isPublished);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!canPublish && !published) {
      toast.error("Active subscription required to publish products");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !published }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setPublished(!published);
      toast.success(published ? "Product unpublished" : "Product published");
    } catch {
      toast.error("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${
        published
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : published ? (
        <Eye className="w-3 h-3" />
      ) : (
        <EyeOff className="w-3 h-3" />
      )}
      {published ? "Published" : "Draft"}
    </button>
  );
}

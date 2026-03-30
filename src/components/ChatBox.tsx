"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
  };
}

interface ChatBoxProps {
  vendorId: string;
  vendorName: string;
  productId?: string;
  productName?: string;
}

export default function ChatBox({ vendorId, vendorName, productId, productName }: ChatBoxProps) {
  const { data: session } = useSession();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      // Silently fail during polling
    }
  }, []);

  const startPolling = useCallback((convId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => fetchMessages(convId), 2000);
  }, [fetchMessages]);

  const initConversation = useCallback(async () => {
    if (!session?.user) return;
    if (session.user.role === "VENDOR") return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, productId }),
      });

      if (!res.ok) throw new Error("Failed to create conversation");

      const conv = await res.json();
      setConversationId(conv.id);
      await fetchMessages(conv.id);
      startPolling(conv.id);
    } catch {
      setError("Failed to start conversation");
    } finally {
      setLoading(false);
    }
  }, [session, vendorId, productId, fetchMessages, startPolling]);

  useEffect(() => {
    if (session?.user && session.user.role !== "VENDOR") {
      initConversation();
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [session, initConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">{vendorName}</p>
              <p className="text-blue-100 text-xs">Online</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Sign in to chat with {vendorName}</p>
          <Link
            href="/auth/login"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Sign In to Chat
          </Link>
        </div>
      </div>
    );
  }

  if (session.user.role === "VENDOR") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Only customers can initiate chats</p>
        <Link href="/dashboard/messages" className="text-blue-600 text-sm hover:underline mt-2 block">
          View your messages →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: "480px" }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">{vendorName[0]}</span>
          </div>
          <div>
            <p className="text-white font-semibold">{vendorName}</p>
            {productName && (
              <p className="text-blue-100 text-xs">Re: {productName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">Start the conversation!</p>
            <p className="text-gray-400 text-xs mt-1">
              {productName
                ? `Ask about "${productName}"`
                : `Send a message to ${vendorName}`}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === session.user.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isOwn
                      ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium text-blue-600 mb-0.5">
                      {message.sender.name}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? "text-blue-200" : "text-gray-400"}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {error && (
          <p className="text-center text-xs text-red-500">{error}</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-300 transition-all"
            disabled={sending || loading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || loading}
            className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

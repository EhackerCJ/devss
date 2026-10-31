"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/navigation/header";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { MessageItem } from "@/components/chat/message-item";
import { ChatInput } from "@/components/chat/chat-input";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import type { Message, UserProfile, Conversation } from "@/types";

export default function DirectMessagePage() {
  const params = useParams();
  const router = useRouter();
  const convId = params?.id as string;

  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [otherUser, setOtherUser] = React.useState<UserProfile | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch current user session
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      });
  }, [router]);

  // 2. Fetch conversation messages
  const loadMessages = React.useCallback(async () => {
    if (!convId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json.messages || []);

        // Also fetch conversation details to identify the other participant
        const convRes = await fetch("/api/conversations");
        if (convRes.ok) {
          const convData = await convRes.json();
          const currentConv = (convData.conversations as Conversation[]).find(
            (c) => c.id === convId
          );
          if (currentConv && currentConv.members && currentUser) {
            const other = currentConv.members.find(
              (m) => m.user_id !== currentUser.id
            );
            if (other?.profile) setOtherUser(other.profile);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [convId, currentUser]);

  React.useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Connect to Realtime Server-Sent Events (SSE)
  React.useEffect(() => {
    if (!convId) return;

    const eventSource = new EventSource(`/api/realtime?targetId=${convId}`);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "new_message" && parsed.payload) {
          const newMsg = parsed.payload as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        } else if (parsed.type === "reaction_added" && parsed.payload) {
          const { messageId, userId, emoji } = parsed.payload;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== messageId) return m;
              const reactions = m.reactions ? [...m.reactions] : [];
              const idx = reactions.findIndex(
                (r) => r.user_id === userId && r.emoji === emoji
              );
              if (idx >= 0) reactions.splice(idx, 1);
              else reactions.push({ message_id: messageId, user_id: userId, emoji, created_at: new Date().toISOString() });
              return { ...m, reactions };
            })
          );
        }
      } catch (e) {
        console.error("SSE parse error", e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [convId]);

  // 4. Send Message Handler
  const handleSendMessage = async (content: string) => {
    if (!convId) return;
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        <Header
          title={otherUser ? otherUser.display_name : "Direct Message"}
          subtitle={otherUser ? `@${otherUser.username}` : undefined}
          type="dm"
          icon={<MessageSquare className="h-5 w-5 text-indigo-400" />}
          currentUser={currentUser}
        />

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-500">
              <Avatar
                src={otherUser?.avatar_url}
                fallback={otherUser?.display_name || "U"}
                size="lg"
                className="mb-3"
              />
              <h3 className="text-base font-bold text-zinc-200">
                Beginning of your conversation with {otherUser?.display_name || "User"}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Say hello, share code snippets with syntax highlighting, or prompt @AI!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                currentUserId={currentUser?.id}
                onReact={(emoji) => handleReact(msg.id, emoji)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <ChatInput onSendMessage={handleSendMessage} />
      </div>

      <MobileNav currentUser={currentUser} />
    </div>
  );
}

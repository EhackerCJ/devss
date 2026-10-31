"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Bell, 
  CheckCheck, 
  UserPlus, 
  Crown, 
  Sparkles, 
  MessageSquare, 
  Info, 
  Loader2,
  ArrowRight
} from "lucide-react";
import { Header } from "@/components/navigation/header";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import type { NotificationItem, UserProfile } from "@/types";

export default function NotificationsPage() {
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      });

    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
      case "friend_accepted":
      case "follow":
        return <UserPlus className="h-4 w-4 text-emerald-400" />;
      case "role_change":
        return <Crown className="h-4 w-4 text-amber-400" />;
      case "premium_update":
        return <Sparkles className="h-4 w-4 text-purple-400" />;
      case "dm":
      case "reply":
      case "mention":
        return <MessageSquare className="h-4 w-4 text-indigo-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const filtered = notifications.filter((n) =>
    filter === "unread" ? !n.is_read : true
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        <Header
          title="Notification Center"
          subtitle="Updates, invitations, mentions, and system notices"
          type="page"
          icon={<Bell className="h-5 w-5 text-indigo-400" />}
          currentUser={currentUser}
        />

        <main className="max-w-3xl w-full mx-auto p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filter === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filter === "unread" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Unread ({notifications.filter((n) => !n.is_read).length})
              </button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleMarkAllRead}
              className="text-xs text-zinc-400 hover:text-white"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              Mark All as Read
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-12 text-zinc-500">
              No notifications to display.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex items-start justify-between transition-colors ${
                    !item.is_read
                      ? "border-indigo-500/30 bg-indigo-950/20"
                      : "border-zinc-800/80 bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-zinc-800/80 shrink-0 mt-0.5">
                      {getNotificationIcon(item.type)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                      <p className="text-xs text-zinc-300 mt-0.5">{item.content}</p>
                      <span className="text-[10px] text-zinc-500 mt-1 block">
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                  </div>

                  {item.link_url && (
                    <Link href={item.link_url}>
                      <Button size="sm" variant="ghost" className="text-xs">
                        View
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <MobileNav currentUser={currentUser} />
    </div>
  );
}

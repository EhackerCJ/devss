"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Search, 
  Check, 
  X, 
  Loader2, 
  Sparkles, 
  Compass,
  Circle
} from "lucide-react";
import { Header } from "@/components/navigation/header";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { UserProfile, Conversation } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = React.useState<"online" | "all" | "pending" | "add">("online");
  const [friends, setFriends] = React.useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = React.useState<any[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [searchUsername, setSearchUsername] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);

  // 1. Load Session
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

  // 2. Load Friends & Conversations
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [friendsRes, requestsRes, convsRes] = await Promise.all([
        fetch("/api/social/friends/list"),
        fetch("/api/social/friends/requests"),
        fetch("/api/conversations"),
      ]);

      if (friendsRes.ok) {
        const json = await friendsRes.json();
        setFriends(json.friends || []);
      }
      if (requestsRes.ok) {
        const json = await requestsRes.json();
        setPendingRequests(json.requests || []);
      }
      if (convsRes.ok) {
        const json = await convsRes.json();
        setConversations(json.conversations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Friend Request Actions
  const handleRespondRequest = async (requestId: string, action: "accept" | "reject") => {
    try {
      const res = await fetch("/api/social/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Search users to add
  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchUsername)}`);
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      const res = await fetch("/api/social/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        alert("Friend request sent!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartDM = async (targetUserId: string) => {
    try {
      const res = await fetch("/api/conversations/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        const conv = await res.json();
        router.push(`/dms/${conv.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar currentUser={currentUser} />

      {/* Main Home Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        <Header
          title="Friends & Direct Messages"
          subtitle="Connect, chat, and collaborate with developers"
          type="page"
          currentUser={currentUser}
        />

        {/* Sub-Header Tabs */}
        <div className="flex items-center space-x-2 border-b border-zinc-800/80 px-4 py-2 bg-zinc-950 select-none overflow-x-auto">
          <button
            onClick={() => setActiveTab("online")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "online"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Online
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "all"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`relative px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "pending"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Pending
            {pendingRequests.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px]">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "add"
                ? "bg-emerald-600 text-white"
                : "text-emerald-400 hover:bg-emerald-950/60"
            }`}
          >
            Add Friend
          </button>
        </div>

        {/* Body Split: Conversations & Friends */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left: Recent Conversations */}
          <div className="w-full md:w-80 border-r border-zinc-800/80 flex flex-col bg-zinc-950/60">
            <div className="p-3 border-b border-zinc-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Direct Messages
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500">
                  No active conversations yet. Start chatting with a friend below!
                </div>
              ) : (
                conversations.map((c) => {
                  const otherMember = c.members?.find((m) => m.user_id !== currentUser?.id);
                  const otherUser = otherMember?.profile;

                  return (
                    <Link
                      key={c.id}
                      href={`/dms/${c.id}`}
                      className="flex items-center space-x-3 p-2.5 rounded-xl hover:bg-zinc-900 transition-colors group"
                    >
                      <Avatar
                        src={otherUser?.avatar_url}
                        fallback={otherUser?.display_name || "U"}
                        size="md"
                        status="online"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate">
                          {otherUser?.display_name || "Direct Message"}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {c.last_message?.content || "No messages yet"}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Friends & Interactions */}
          <div className="hidden md:flex flex-1 flex-col overflow-y-auto p-6 bg-zinc-900/30">
            {activeTab === "pending" ? (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                  Pending Friend Requests ({pendingRequests.length})
                </h3>

                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-zinc-500">No pending friend requests.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/80"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar
                            src={req.sender?.avatar_url}
                            fallback={req.sender?.display_name || "U"}
                            size="md"
                          />
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {req.sender?.display_name}
                            </p>
                            <p className="text-xs text-zinc-400">@{req.sender?.username}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleRespondRequest(req.id, "accept")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRespondRequest(req.id, "reject")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "add" ? (
              <div className="space-y-4 max-w-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                  Add Friend by Username
                </h3>
                <form onSubmit={handleSearchUsers} className="flex gap-2">
                  <Input
                    placeholder="Search username or email..."
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                  />
                  <Button type="submit" disabled={searching}>
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </form>

                <div className="space-y-2 pt-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/80"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar src={user.avatar_url} fallback={user.display_name} size="md" />
                        <div>
                          <p className="text-sm font-semibold text-white">{user.display_name}</p>
                          <p className="text-xs text-zinc-400">@{user.username}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSendFriendRequest(user.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Send Request
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                  {activeTab === "online" ? "Online Friends" : "All Friends"}
                </h3>

                {friends.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    You haven&apos;t added any friends yet. Click &quot;Add Friend&quot; to connect!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700 transition-all"
                      >
                        <Link
                          href={`/profile/${friend.username}`}
                          className="flex items-center space-x-3 truncate"
                        >
                          <Avatar
                            src={friend.avatar_url}
                            fallback={friend.display_name}
                            size="md"
                            status="online"
                          />
                          <div className="truncate">
                            <p className="text-sm font-semibold text-white hover:underline truncate">
                              {friend.display_name}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">@{friend.username}</p>
                          </div>
                        </Link>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartDM(friend.id)}
                          className="text-zinc-400 hover:text-white"
                          title="Message"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileNav currentUser={currentUser} />
    </div>
  );
}

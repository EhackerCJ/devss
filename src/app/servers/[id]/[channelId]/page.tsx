"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  Hash, 
  Volume2, 
  Bot, 
  Megaphone, 
  FolderGit2, 
  Plus, 
  Users, 
  Settings, 
  Crown, 
  ShieldCheck, 
  ShieldAlert,
  Loader2,
  ChevronDown
} from "lucide-react";
import { Header } from "@/components/navigation/header";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { MessageItem } from "@/components/chat/message-item";
import { ChatInput } from "@/components/chat/chat-input";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { 
  CommunityServer, 
  ServerChannel, 
  ServerMember, 
  Message, 
  UserProfile 
} from "@/types";

export default function ServerChannelPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params?.id as string;
  const channelId = params?.channelId as string;

  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [server, setServer] = React.useState<CommunityServer | null>(null);
  const [members, setMembers] = React.useState<ServerMember[]>([]);
  const [channels, setChannels] = React.useState<ServerChannel[]>([]);
  const [activeChannel, setActiveChannel] = React.useState<ServerChannel | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showMemberList, setShowMemberList] = React.useState(true);
  const [createChannelOpen, setCreateChannelOpen] = React.useState(false);
  const [newChannelName, setNewChannelName] = React.useState("");
  const [newChannelType, setNewChannelType] = React.useState<"text" | "announcement" | "ai-help" | "project">("text");

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // 1. Fetch Session
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      });
  }, []);

  // 2. Fetch Server & Channels
  const loadServer = React.useCallback(async () => {
    if (!serverId) return;
    try {
      const res = await fetch(`/api/servers/${serverId}`);
      if (res.ok) {
        const json = await res.json();
        setServer(json.server);
        setMembers(json.members || []);
        const chs = json.server.channels || [];
        setChannels(chs);
        const cur = chs.find((c: ServerChannel) => c.id === channelId) || chs[0];
        setActiveChannel(cur);
      }
    } catch (err) {
      console.error(err);
    }
  }, [serverId, channelId]);

  React.useEffect(() => {
    loadServer();
  }, [loadServer]);

  // 3. Fetch Messages for this Channel
  const loadMessages = React.useCallback(async () => {
    if (!serverId || !channelId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/servers/${serverId}/channels/${channelId}/messages`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [serverId, channelId]);

  React.useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Realtime SSE for Channel
  React.useEffect(() => {
    if (!channelId) return;

    const eventSource = new EventSource(`/api/realtime?targetId=${channelId}`);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "new_message" && parsed.payload) {
          const newMsg = parsed.payload as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      } catch (e) {
        console.error("SSE parse error", e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [channelId]);

  // 5. Send Message Handler
  const handleSendMessage = async (content: string) => {
    if (!serverId || !channelId) return;
    try {
      const res = await fetch(`/api/servers/${serverId}/channels/${channelId}/messages`, {
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

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "announcement":
        return <Megaphone className="h-4 w-4 text-amber-400" />;
      case "ai-help":
        return <Bot className="h-4 w-4 text-cyan-400" />;
      case "project":
        return <FolderGit2 className="h-4 w-4 text-purple-400" />;
      default:
        return <Hash className="h-4 w-4 text-zinc-400" />;
    }
  };

  const isOwnerOrAdmin = currentUser && server && (
    server.owner_id === currentUser.id ||
    currentUser.platform_role === "SUPREME_OWNER"
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar currentUser={currentUser} />

      {/* Secondary Channels Sidebar */}
      <div className="hidden md:flex w-60 flex-col bg-zinc-900/90 border-r border-zinc-800/80 select-none">
        {/* Server Header */}
        <div className="h-14 border-b border-zinc-800/80 px-4 flex items-center justify-between font-bold text-white shadow-sm">
          <span className="truncate">{server?.name || "Server"}</span>
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Text Channels</span>
              {isOwnerOrAdmin && (
                <button
                  onClick={() => setCreateChannelOpen(true)}
                  className="text-zinc-400 hover:text-white"
                  title="Create Channel"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-0.5">
              {channels.map((ch) => {
                const isActive = ch.id === channelId;
                return (
                  <Link
                    key={ch.id}
                    href={`/servers/${serverId}/${ch.id}`}
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-800 text-white font-semibold"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    }`}
                  >
                    {getChannelIcon(ch.type)}
                    <span className="truncate">{ch.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        <Header
          title={activeChannel?.name || "channel"}
          subtitle={activeChannel?.topic}
          type="channel"
          icon={activeChannel ? getChannelIcon(activeChannel.type) : undefined}
          currentUser={currentUser}
          onToggleMemberList={() => setShowMemberList(!showMemberList)}
        />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-500">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-indigo-400 mb-3">
                    {activeChannel && getChannelIcon(activeChannel.type)}
                  </div>
                  <h3 className="text-base font-bold text-zinc-200">
                    Welcome to #{activeChannel?.name}!
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                    This is the start of the #{activeChannel?.name} channel. Send a message, share code blocks, or mention @AI!
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

            <ChatInput onSendMessage={handleSendMessage} />
          </div>

          {/* Right Member List */}
          {showMemberList && (
            <div className="hidden lg:flex w-56 flex-col bg-zinc-950/80 border-l border-zinc-800/80 p-3 overflow-y-auto select-none">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 px-2">
                Members ({members.length})
              </h4>
              <div className="space-y-1">
                {members.map((m) => {
                  const p = m.profile;
                  const isOwner = m.server_role === "SERVER_OWNER";
                  const isAdmin = m.server_role === "SERVER_ADMIN";
                  const isSupreme = p?.platform_role === "SUPREME_OWNER";

                  return (
                    <Link
                      key={m.user_id}
                      href={p ? `/profile/${p.username}` : "#"}
                      className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-zinc-900 transition-colors group"
                    >
                      <Avatar
                        src={p?.avatar_url}
                        fallback={p?.display_name || "U"}
                        size="sm"
                        isSupreme={isSupreme}
                        status="online"
                      />
                      <div className="truncate flex items-center space-x-1">
                        <span className="text-xs font-medium text-zinc-300 group-hover:text-white truncate">
                          {p?.display_name || "Member"}
                        </span>
                        {isSupreme && (
                          <span title="Supreme Owner">
                            <Crown className="h-3 w-3 text-amber-400 shrink-0" />
                          </span>
                        )}
                        {!isSupreme && isOwner && (
                          <span title="Server Owner">
                            <Crown className="h-3 w-3 text-yellow-400 shrink-0" />
                          </span>
                        )}
                        {!isSupreme && isAdmin && (
                          <span title="Server Admin">
                            <ShieldAlert className="h-3 w-3 text-red-400 shrink-0" />
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Channel Modal */}
      <Dialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        title="Create Channel"
        description="Add a new discussion or AI channel to this server."
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Channel Name</label>
            <Input
              placeholder="e.g. rust-architecture"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Channel Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "text", label: "Text", icon: <Hash className="h-4 w-4" /> },
                { id: "ai-help", label: "AI Help", icon: <Bot className="h-4 w-4" /> },
                { id: "announcement", label: "Announcement", icon: <Megaphone className="h-4 w-4" /> },
                { id: "project", label: "Project", icon: <FolderGit2 className="h-4 w-4" /> },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setNewChannelType(t.id as any)}
                  className={`flex items-center space-x-2 p-2.5 rounded-lg border text-xs transition-all ${
                    newChannelType === t.id
                      ? "border-primary bg-primary/10 text-white font-semibold"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => setCreateChannelOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!newChannelName.trim()) return;
                // Add channel locally to state
                const newCh: ServerChannel = {
                  id: Math.random().toString(36).substring(2, 9),
                  server_id: serverId,
                  name: newChannelName.toLowerCase().replace(/\s+/g, "-"),
                  type: newChannelType,
                  position: channels.length,
                  is_private: false,
                  slow_mode_seconds: 0,
                  created_at: new Date().toISOString(),
                };
                setChannels((prev) => [...prev, newCh]);
                setCreateChannelOpen(false);
                setNewChannelName("");
                router.push(`/servers/${serverId}/${newCh.id}`);
              }}
            >
              Create Channel
            </Button>
          </div>
        </div>
      </Dialog>

      <MobileNav currentUser={currentUser} />
    </div>
  );
}

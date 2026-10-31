"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Compass, 
  Plus, 
  MessageSquare, 
  Bot, 
  Crown, 
  Settings, 
  ShieldAlert, 
  Sparkles,
  Users,
  LogOut
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CommunityServer, UserProfile } from "@/types";

interface SidebarProps {
  currentUser?: UserProfile | null;
  servers?: CommunityServer[];
  onOpenCreateServer?: () => void;
  onLogout?: () => void;
}

export function Sidebar({
  currentUser,
  servers = [],
  onOpenCreateServer,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();

  const isHome = pathname === "/" || pathname === "/home" || pathname.startsWith("/dms");
  const isAI = pathname.startsWith("/ai");
  const isDiscover = pathname.startsWith("/discover");
  const isPremium = pathname.startsWith("/premium");
  const isSupreme = pathname.startsWith("/supreme");

  const isSupremeUser = currentUser?.platform_role === "SUPREME_OWNER";
  const isAdminUser = currentUser?.platform_role === "PLATFORM_ADMIN" || isSupremeUser;

  return (
    <aside className="hidden md:flex h-screen w-[76px] flex-col items-center py-3 bg-zinc-950 border-r border-zinc-900 select-none z-40">
      {/* DevSphere Logo / Home Direct Messages */}
      <Link
        href="/home"
        className={cn(
          "group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 transition-all hover:rounded-xl hover:bg-primary text-zinc-300 hover:text-white mb-2 shadow-md",
          isHome && "rounded-xl bg-primary text-white"
        )}
        title="Direct Messages & Social"
      >
        <span
          className={cn(
            "absolute -left-3 h-2 w-1.5 rounded-r-full bg-white transition-all",
            isHome ? "h-10" : "group-hover:h-5"
          )}
        />
        <MessageSquare className="h-6 w-6" />
      </Link>

      {/* AI Coding Studio */}
      <Link
        href="/ai"
        className={cn(
          "group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 transition-all hover:rounded-xl hover:bg-cyan-600 text-cyan-400 hover:text-white mb-2 shadow-md",
          isAI && "rounded-xl bg-cyan-600 text-white"
        )}
        title="AI Coding Assistant Studio"
      >
        <span
          className={cn(
            "absolute -left-3 h-2 w-1.5 rounded-r-full bg-cyan-400 transition-all",
            isAI ? "h-10" : "group-hover:h-5"
          )}
        />
        <Bot className="h-6 w-6" />
      </Link>

      <div className="h-[2px] w-8 rounded-full bg-zinc-800/80 my-2" />

      {/* Server List */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-2 py-1">
        {servers.map((server) => {
          const isActive = pathname.startsWith(`/servers/${server.id}`);
          const initials = server.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <Link
              key={server.id}
              href={`/servers/${server.id}`}
              className={cn(
                "group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 transition-all hover:rounded-xl hover:bg-indigo-600 text-zinc-300 hover:text-white shadow-sm",
                isActive && "rounded-xl bg-indigo-600 text-white font-bold"
              )}
              title={server.name}
            >
              <span
                className={cn(
                  "absolute -left-3 h-2 w-1.5 rounded-r-full bg-white transition-all",
                  isActive ? "h-10" : "group-hover:h-5"
                )}
              />
              {server.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={server.icon_url}
                  alt={server.name}
                  className="h-full w-full rounded-inherit object-cover"
                />
              ) : (
                <span className="text-sm font-semibold">{initials}</span>
              )}
            </Link>
          );
        })}

        {/* Create Server Action */}
        <button
          onClick={onOpenCreateServer}
          className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-emerald-500 hover:bg-emerald-600 hover:text-white hover:rounded-xl transition-all shadow-sm"
          title="Create a Server"
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Discover Public Communities */}
        <Link
          href="/discover"
          className={cn(
            "group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white hover:rounded-xl transition-all shadow-sm",
            isDiscover && "rounded-xl bg-zinc-800 text-white"
          )}
          title="Discover Public Servers"
        >
          <Compass className="h-6 w-6" />
        </Link>
      </div>

      <div className="h-[2px] w-8 rounded-full bg-zinc-800/80 my-2" />

      {/* Supreme / Admin / Staff shortcuts */}
      {isSupremeUser && (
        <Link
          href="/supreme"
          className={cn(
            "group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black hover:rounded-xl transition-all mb-2 border border-amber-500/30 shadow-supreme-glow",
            isSupreme && "rounded-xl bg-amber-500 text-black font-extrabold"
          )}
          title="Supreme Owner Command Center"
        >
          <Crown className="h-6 w-6" />
        </Link>
      )}

      {isAdminUser && !isSupremeUser && (
        <Link
          href="/admin"
          className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white hover:rounded-xl transition-all mb-2 border border-red-500/30"
          title="Platform Admin Panel"
        >
          <ShieldAlert className="h-6 w-6" />
        </Link>
      )}

      {/* Premium Hub */}
      <Link
        href="/premium"
        className={cn(
          "group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 hover:bg-purple-600 hover:text-white hover:rounded-xl transition-all mb-2 shadow-purple-glow",
          isPremium && "rounded-xl bg-purple-600 text-white"
        )}
        title="DevSphere Premium Plans"
      >
        <Sparkles className="h-5 w-5" />
      </Link>

      {/* Settings / User Footer */}
      <Link
        href="/settings"
        className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors mb-1"
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </Link>

      {currentUser && (
        <div className="relative mt-1">
          <Link href={`/profile/${currentUser.username}`}>
            <Avatar
              src={currentUser.avatar_url}
              fallback={currentUser.display_name || currentUser.username}
              size="sm"
              isSupreme={isSupremeUser}
              status="online"
            />
          </Link>
        </div>
      )}
    </aside>
  );
}

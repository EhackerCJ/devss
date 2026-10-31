"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Bot, Compass, Bell, User, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";

interface MobileNavProps {
  currentUser?: UserProfile | null;
  unreadCount?: number;
}

export function MobileNav({ currentUser, unreadCount = 0 }: MobileNavProps) {
  const pathname = usePathname();

  const isHome = pathname === "/" || pathname === "/home" || pathname.startsWith("/dms");
  const isAI = pathname.startsWith("/ai");
  const isDiscover = pathname.startsWith("/discover");
  const isNotifications = pathname.startsWith("/notifications");
  const isProfile = pathname.startsWith("/profile");
  const isSupreme = pathname.startsWith("/supreme");

  const isSupremeUser = currentUser?.platform_role === "SUPREME_OWNER";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-lg px-2 flex items-center justify-around select-none">
      {/* Home / Chat */}
      <Link
        href="/home"
        className={cn(
          "flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-colors",
          isHome && "text-primary font-semibold"
        )}
      >
        <MessageSquare className="h-5 w-5" />
        <span className="text-[10px] mt-1">Chats</span>
      </Link>

      {/* AI Assistant */}
      <Link
        href="/ai"
        className={cn(
          "flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-cyan-400 transition-colors",
          isAI && "text-cyan-400 font-semibold"
        )}
      >
        <Bot className="h-5 w-5" />
        <span className="text-[10px] mt-1">AI Studio</span>
      </Link>

      {/* Discover Servers */}
      <Link
        href="/discover"
        className={cn(
          "flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-colors",
          isDiscover && "text-indigo-400 font-semibold"
        )}
      >
        <Compass className="h-5 w-5" />
        <span className="text-[10px] mt-1">Explore</span>
      </Link>

      {/* Notifications */}
      <Link
        href="/notifications"
        className={cn(
          "relative flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-colors",
          isNotifications && "text-white font-semibold"
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        )}
        <span className="text-[10px] mt-1">Alerts</span>
      </Link>

      {/* Supreme shortcut (if Supreme) or User Profile */}
      {isSupremeUser ? (
        <Link
          href="/supreme"
          className={cn(
            "flex flex-col items-center justify-center w-12 h-12 text-amber-500 hover:text-amber-400 transition-colors",
            isSupreme && "text-amber-300 font-bold"
          )}
        >
          <Crown className="h-5 w-5" />
          <span className="text-[10px] mt-1">Supreme</span>
        </Link>
      ) : (
        <Link
          href={currentUser ? `/profile/${currentUser.username}` : "/settings"}
          className={cn(
            "flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-colors",
            isProfile && "text-white font-semibold"
          )}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] mt-1">Profile</span>
        </Link>
      )}
    </nav>
  );
}

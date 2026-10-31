"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Bell, 
  Search, 
  Hash, 
  Users, 
  Pin, 
  ShieldCheck, 
  Sparkles,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";

interface HeaderProps {
  title: string;
  subtitle?: string;
  type?: "channel" | "dm" | "group" | "page";
  icon?: React.ReactNode;
  currentUser?: UserProfile | null;
  onToggleMemberList?: () => void;
  onOpenSearch?: () => void;
}

export function Header({
  title,
  subtitle,
  type = "channel",
  icon,
  currentUser,
  onToggleMemberList,
  onOpenSearch,
}: HeaderProps) {
  const isSupreme = currentUser?.platform_role === "SUPREME_OWNER";
  const isPro = currentUser?.premium_tier && currentUser.premium_tier !== "free";

  return (
    <header className="h-14 min-h-[56px] border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Title & context */}
      <div className="flex items-center space-x-3 overflow-hidden">
        {icon ? (
          <div className="text-zinc-400">{icon}</div>
        ) : type === "channel" ? (
          <Hash className="h-5 w-5 text-zinc-400 shrink-0" />
        ) : null}

        <div className="flex items-baseline space-x-2 truncate">
          <h1 className="text-sm md:text-base font-bold text-zinc-100 truncate">
            {title}
          </h1>
          {subtitle && (
            <span className="hidden sm:inline text-xs text-zinc-400 truncate border-l border-zinc-700 pl-2">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        {/* User Badges */}
        {isSupreme && (
          <Badge variant="supreme" className="hidden sm:flex space-x-1 items-center">
            <Crown className="h-3 w-3" />
            <span>Supreme</span>
          </Badge>
        )}
        {isPro && !isSupreme && (
          <Badge variant="pro" className="hidden sm:flex space-x-1 items-center">
            <Sparkles className="h-3 w-3" />
            <span>Pro</span>
          </Badge>
        )}

        {/* Global Search Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSearch}
          className="text-zinc-400 hover:text-white"
          title="Search (Ctrl + K)"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications Shortcut */}
        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
        </Link>

        {/* Members toggle for servers and groups */}
        {onToggleMemberList && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMemberList}
            className="text-zinc-400 hover:text-white"
            title="Toggle Member List"
          >
            <Users className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { Smile, Reply, Crown, ShieldCheck, Sparkles, MoreHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { CodeBlock } from "@/components/chat/code-block";
import { timeAgo, getRoleBadgeStyle } from "@/lib/utils";
import type { Message, UserProfile } from "@/types";

interface MessageItemProps {
  message: Message;
  currentUserId?: string;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
}

export function MessageItem({
  message,
  currentUserId,
  onReact,
  onReply,
}: MessageItemProps) {
  const [showReactionsBar, setShowReactionsBar] = React.useState(false);
  const sender = message.sender;
  const isSupreme = sender?.platform_role === "SUPREME_OWNER";
  const badgeStyle = sender ? getRoleBadgeStyle(sender.platform_role) : null;

  // Group reactions by emoji
  const reactionMap = React.useMemo(() => {
    const map = new Map<string, { count: number; reactedByMe: boolean }>();
    if (message.reactions) {
      for (const r of message.reactions) {
        const item = map.get(r.emoji) || { count: 0, reactedByMe: false };
        item.count += 1;
        if (r.user_id === currentUserId) item.reactedByMe = true;
        map.set(r.emoji, item);
      }
    }
    return map;
  }, [message.reactions, currentUserId]);

  // Parse markdown code blocks
  const renderContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex} className="whitespace-pre-wrap">
            {formatMentions(content.slice(lastIndex, match.index))}
          </span>
        );
      }

      const language = match[1] || "text";
      const code = match[2];
      parts.push(
        <CodeBlock key={match.index} language={language} code={code} />
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <span key={lastIndex} className="whitespace-pre-wrap">
          {formatMentions(content.slice(lastIndex))}
        </span>
      );
    }

    return parts;
  };

  const formatMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const isAI = part.toLowerCase() === "@ai";
        return (
          <span
            key={i}
            className={`font-semibold px-1 rounded ${
              isAI
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "bg-indigo-500/20 text-indigo-300"
            }`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const quickEmojis = ["👍", "❤️", "🚀", "🔥", "👀", "💡"];

  return (
    <div
      className="group relative flex space-x-3 p-2.5 px-4 rounded-xl hover:bg-zinc-900/50 transition-colors"
      onMouseEnter={() => setShowReactionsBar(true)}
      onMouseLeave={() => setShowReactionsBar(false)}
    >
      {/* Floating Action Bar */}
      {showReactionsBar && (
        <div className="absolute right-4 -top-3 z-20 flex items-center bg-zinc-900 border border-zinc-700/80 rounded-lg p-0.5 shadow-xl space-x-0.5">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact?.(emoji)}
              className="h-7 w-7 rounded hover:bg-zinc-800 text-sm flex items-center justify-center transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
          {onReply && (
            <button
              onClick={onReply}
              className="h-7 w-7 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              title="Reply"
            >
              <Reply className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Avatar */}
      <Link href={sender ? `/profile/${sender.username}` : "#"}>
        <Avatar
          src={sender?.avatar_url}
          fallback={sender?.display_name || "User"}
          size="md"
          isSupreme={isSupreme}
        />
      </Link>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2">
          <Link
            href={sender ? `/profile/${sender.username}` : "#"}
            className="text-sm font-bold text-white hover:underline truncate"
          >
            {sender?.display_name || "User"}
          </Link>

          {/* Badge */}
          {badgeStyle && sender && sender.platform_role !== "USER" && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full border ${badgeStyle.bg}`}
            >
              {badgeStyle.label}
            </span>
          )}

          <span className="text-[11px] text-zinc-500">
            {timeAgo(message.created_at)}
          </span>
          {message.is_edited && (
            <span className="text-[10px] text-zinc-600">(edited)</span>
          )}
        </div>

        {/* Content */}
        <div className="text-sm text-zinc-200 mt-1 leading-relaxed break-words">
          {renderContent(message.content)}
        </div>

        {/* Reactions List */}
        {reactionMap.size > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {Array.from(reactionMap.entries()).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(emoji)}
                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg border text-xs transition-colors ${
                  data.reactedByMe
                    ? "bg-indigo-950/70 border-indigo-500 text-indigo-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <span>{emoji}</span>
                <span className="font-semibold text-[11px]">{data.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

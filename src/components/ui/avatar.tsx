import * as React from "react";
import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/types";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: PresenceStatus;
  isSupreme?: boolean;
}

export function Avatar({
  src,
  alt = "User Avatar",
  fallback = "U",
  size = "md",
  status,
  isSupreme = false,
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl font-bold",
  }[size];

  const statusSize = {
    sm: "h-2.5 w-2.5 bottom-0 right-0 border-[1.5px]",
    md: "h-3 w-3 bottom-0 right-0 border-2",
    lg: "h-4 w-4 bottom-0.5 right-0.5 border-2",
    xl: "h-5 w-5 bottom-1 right-1 border-[3px]",
  }[size];

  const statusColors = {
    online: "bg-emerald-500",
    idle: "bg-amber-500",
    dnd: "bg-red-500",
    offline: "bg-zinc-500",
  };

  return (
    <div className={cn("relative inline-block select-none", className)} {...props}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700/60 shadow-sm",
          sizeClasses,
          isSupreme && "border-2 border-amber-400 shadow-supreme-glow ring-2 ring-amber-500/20"
        )}
      >
        {src && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-semibold uppercase tracking-wider text-zinc-300">
            {fallback.slice(0, 2)}
          </span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            "absolute rounded-full border-zinc-950",
            statusSize,
            statusColors[status] || statusColors.offline
          )}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
}

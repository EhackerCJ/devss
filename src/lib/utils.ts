import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function timeAgo(dateInput: string | Date | number): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return "just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getRoleBadgeStyle(role: string): { bg: string; text: string; border: string; label: string } {
  switch (role) {
    case 'SUPREME_OWNER':
      return {
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-supreme-glow',
        text: 'text-amber-400 font-extrabold tracking-wide uppercase',
        border: 'border-amber-500',
        label: 'Supreme Owner',
      };
    case 'PLATFORM_ADMIN':
      return {
        bg: 'bg-red-500/20 text-red-300 border-red-500/40',
        text: 'text-red-400 font-bold',
        border: 'border-red-500',
        label: 'Platform Admin',
      };
    case 'PLATFORM_MODERATOR':
      return {
        bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        text: 'text-blue-400 font-medium',
        border: 'border-blue-500',
        label: 'Platform Mod',
      };
    case 'SUPPORT':
      return {
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        text: 'text-emerald-400 font-medium',
        border: 'border-emerald-500',
        label: 'Support Staff',
      };
    case 'PREMIUM_USER':
      return {
        bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-glow',
        text: 'text-purple-400 font-semibold',
        border: 'border-purple-500',
        label: 'Premium Pro',
      };
    default:
      return {
        bg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        text: 'text-zinc-400',
        border: 'border-zinc-700',
        label: 'Member',
      };
  }
}

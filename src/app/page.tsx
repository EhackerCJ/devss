import Link from "next/link";
import { 
  Crown, 
  MessageSquare, 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  Compass, 
  Users, 
  ArrowRight, 
  Terminal,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[350px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto p-6 flex items-center justify-between z-20">
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm shadow-md">
            DS
          </span>
          <span>Dev<span className="text-indigo-400">Sphere</span></span>
        </Link>

        <div className="flex items-center space-x-3">
          <Link href="/login">
            <Button variant="ghost" className="text-xs md:text-sm text-zinc-300 hover:text-white">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="text-xs md:text-sm font-semibold">
              Get Started
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl w-full mx-auto px-6 py-12 md:py-20 text-center space-y-8 z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>The Supreme Social + Community + AI Platform for Developers</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Where Software Architects <span className="supreme-gradient-text">Chat, Build & Prompt AI</span>.
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          High-velocity direct messaging, Discord-style community servers, rich code blocks, Instagram-grade social graphs, and autonomous Gemini AI engineering.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto font-bold px-8 h-12 text-base">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>

          <Link href="/discover">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-8 h-12 text-base border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800"
            >
              <Compass className="mr-2 h-4 w-4 text-emerald-400" />
              Explore Communities
            </Button>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left pt-14">
          {[
            {
              icon: <MessageSquare className="h-5 w-5 text-indigo-400" />,
              title: "Realtime DMs & Chats",
              desc: "1-on-1 and group chats with emoji reactions, syntax-highlighted code blocks, and instant Server-Sent Events delivery.",
            },
            {
              icon: <Compass className="h-5 w-5 text-emerald-400" />,
              title: "Community Servers",
              desc: "Discord-style servers with channels (text, announcements, AI-help, project showcase), roles, and custom invites.",
            },
            {
              icon: <Bot className="h-5 w-5 text-cyan-400" />,
              title: "Autonomous AI Studio",
              desc: "Built-in Google Gemini AI coding companion for debugging, refactoring, and in-chat @AI summonings.",
            },
            {
              icon: <Crown className="h-5 w-5 text-amber-400" />,
              title: "Supreme Sovereign Tier",
              desc: "Dedicated protected Supreme Panel for platform administration, feature flags, role delegation, and audit trails.",
            },
            {
              icon: <Users className="h-5 w-5 text-purple-400" />,
              title: "Rich Social Graph",
              desc: "Instagram-style follow/followers, mutual friends calculations, activity presence, and customizable developer profiles.",
            },
            {
              icon: <Sparkles className="h-5 w-5 text-pink-400" />,
              title: "Premium Subscriptions",
              desc: "Pro and Supreme Dev tiers with expanded AI quotas, 500MB uploads, server cosmetics, and contact-to-purchase workflow.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all group shadow-sm"
            >
              <div className="p-2.5 rounded-xl bg-zinc-800 w-fit mb-3 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto p-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4 z-20">
        <div>
          © 2026 DevSphere Platform. All rights reserved. Supreme Sovereign Authorized.
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="hover:text-zinc-300">Sign In</Link>
          <Link href="/premium" className="hover:text-zinc-300">Premium Plans</Link>
          <Link href="/appeals" className="hover:text-zinc-300">Appeals</Link>
          <Link href="/supreme" className="hover:text-amber-400 text-amber-500/80">Supreme Panel</Link>
        </div>
      </footer>
    </div>
  );
}

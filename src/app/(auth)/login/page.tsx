"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Mail,
  Loader2,
  Code2,
  MessageSquare,
  Bot,
  Users,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customCreds?: { id: string; pass: string }) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const loginId = customCreds ? customCreds.id : identifier;
    const loginPass = customCreds ? customCreds.pass : password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginId, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // If Supreme Owner, redirect directly to Supreme Sovereign Command Center
      if (data.isSupreme) {
        router.push("/supreme");
      } else {
        router.push("/home");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 py-12 relative overflow-hidden">
      {/* Ambient glowing background */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 items-center">
        {/* Left Column: Secure Login Form */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center space-x-2 text-xl font-bold tracking-tight text-white mb-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-500/20">
                DS
              </span>
              <span className="text-xl">Dev<span className="text-indigo-400">Sphere</span></span>
            </Link>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Sign in to access your developer servers, channels, realtime chats, and the AI Studio.
            </p>
          </div>

          <Card className="border-zinc-800/90 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-200 text-xs flex items-center space-x-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Email or Username</label>
                  <Input
                    placeholder="name@domain.com or @username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Password</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    type="password"
                    placeholder="Enter your secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !identifier.trim() || !password.trim()}
                  className="w-full mt-2"
                  variant="default"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to DevSphere
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3 border-t border-zinc-800/80 pt-4 pb-5">
                <p className="text-xs text-zinc-400 text-center">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-indigo-400 hover:underline font-semibold">
                    Create a free account
                  </Link>
                </p>

                <div className="flex items-center justify-center space-x-4 text-[11px] text-zinc-500 pt-1">
                  <span className="flex items-center">
                    <ShieldCheck className="h-3 w-3 mr-1 text-emerald-400" />
                    End-to-End Encrypted Sessions
                  </span>
                  <span>•</span>
                  <span>PostgreSQL / RLS Secured</span>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right Column: Production Showcase (No passwords, pure platform highlights) */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6 lg:pl-6">
          <div className="space-y-2">
            <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 bg-indigo-950/30 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
              Production Ready v1.0
            </Badge>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              The Sovereign Social & AI Collaboration Platform
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Designed from first principles for software architects, engineering teams, and AI builders.
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm flex items-start space-x-3.5 hover:border-zinc-700 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Live Gemini AI Assistant</h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Interactive multi-turn AI Studio, in-channel <span className="text-indigo-300 font-mono">@AI</span> bot summons, and automated code generation with multi-model resilience.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm flex items-start space-x-3.5 hover:border-zinc-700 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Realtime Messaging & Syntax Highlighting</h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Server-Sent Events (SSE) streaming, 1-on-1 direct messaging, emoji reactions, and copyable syntax-highlighted code blocks.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm flex items-start space-x-3.5 hover:border-zinc-700 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Community Servers & Topic Channels</h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Discord-style multi-server architecture with dedicated text, announcement, AI-help, and project showcase channels.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm flex items-start space-x-3.5 hover:border-zinc-700 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Sovereign Administrative Architecture</h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Strict anti-escalation security, re-authenticated Supreme Sovereign command center, staff delegation, and immutable audit logs.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-zinc-400 px-1 border-t border-zinc-900">
            <span className="flex items-center text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mr-1.5" />
              100% Production Ready
            </span>
            <Link href="/discover" className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center">
              Explore Public Communities
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

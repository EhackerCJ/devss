"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, User, AtSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username,
          display_name: displayName,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/home");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold tracking-tight text-white mb-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-base">
              DS
            </span>
            <span>Dev<span className="text-indigo-400">Sphere</span></span>
          </Link>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Create an account
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Join the supreme social, community & AI engineering network.
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4 pt-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-200 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Display Name</label>
                <Input
                  placeholder="e.g. Satoshi Nakamoto"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  icon={<User className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Username (@handle)</label>
                <Input
                  placeholder="e.g. satoshi"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  icon={<AtSign className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Email Address</label>
                <Input
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Password (min 8 chars)</label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2 font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Join DevSphere
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>

            <CardFooter className="flex justify-center border-t border-zinc-800/80 pt-4">
              <p className="text-xs text-zinc-400">
                Already have an account?{" "}
                <Link href="/login" className="text-indigo-400 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

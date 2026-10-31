"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md z-10">
        <div className="mb-6 text-center">
          <Link href="/login" className="inline-flex items-center text-xs text-zinc-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to sign in
          </Link>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Reset Password
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Enter your account email to receive a secure recovery link.
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
          {submitted ? (
            <CardContent className="space-y-4 pt-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Reset Link Sent</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                If an account exists for <span className="text-zinc-200 font-medium">{email}</span>, a cryptographic reset token has been dispatched. Check your inbox and spam folder.
              </p>
              <Link href="/login" className="block pt-2">
                <Button variant="outline" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Account Email</label>
                  <Input
                    type="email"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Send Recovery Link
                </Button>
              </CardContent>
              <CardFooter className="flex justify-center border-t border-zinc-800/80 pt-4">
                <p className="text-xs text-zinc-400">
                  Remember your password?{" "}
                  <Link href="/login" className="text-indigo-400 hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function AppealsPage() {
  const [statement, setStatement] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement }),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 py-12">
      <div className="w-full max-w-lg">
        <Link href="/home" className="inline-flex items-center text-xs text-zinc-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to DevSphere
        </Link>

        <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <div className="flex items-center space-x-2 text-indigo-400 mb-1">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Trust & Safety</span>
            </div>
            <CardTitle className="text-xl font-bold text-white">
              Submit Moderation Appeal
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              If your account received a warning, restriction, or timeout, you may submit a formal appeal directly to platform staff and the Supreme Owner.
            </CardDescription>
          </CardHeader>

          {submitted ? (
            <CardContent className="space-y-3 pt-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white">Appeal Submitted</h4>
              <p className="text-xs text-zinc-400">
                Your statement has been securely logged to the platform audit queue. A staff member or the Supreme Owner will review it.
              </p>
              <Link href="/home" className="block pt-2">
                <Button variant="outline" className="w-full text-xs">
                  Return to Home
                </Button>
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Appeal Statement & Context
                  </label>
                  <Textarea
                    placeholder="Provide details regarding the moderation action, why it should be reconsidered, and any relevant context..."
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    rows={5}
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end space-x-2 pt-2 border-t border-zinc-800/80">
                <Link href="/home">
                  <Button type="button" variant="ghost" className="text-xs">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={submitting || !statement.trim()} className="text-xs">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Submit Appeal
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

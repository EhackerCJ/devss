"use client";

import * as React from "react";
import { 
  Sparkles, 
  Crown, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  MessageSquare, 
  Upload, 
  HelpCircle,
  Loader2
} from "lucide-react";
import { Header } from "@/components/navigation/header";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UserProfile, PremiumRequest } from "@/types";

export default function PremiumPage() {
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [myRequests, setMyRequests] = React.useState<PremiumRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedTier, setSelectedTier] = React.useState<"pro" | "supreme_dev">("pro");
  const [contactMessage, setContactMessage] = React.useState("");
  const [paymentRef, setPaymentRef] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submittedSuccess, setSubmittedSuccess] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      });

    fetch("/api/premium/request")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.requests) setMyRequests(data.requests);
        setLoading(false);
      });
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/premium/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierId: selectedTier,
          contactMessage,
          paymentReference: paymentRef,
        }),
      });

      if (res.ok) {
        const newReq = await res.json();
        setMyRequests((prev) => [newReq, ...prev]);
        setSubmittedSuccess(true);
        setTimeout(() => {
          setSubmittedSuccess(false);
          setDialogOpen(false);
          setContactMessage("");
          setPaymentRef("");
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const tiers = [
    {
      id: "free",
      name: "Community Member",
      price: "$0",
      description: "Standard developer access for open-source exploration.",
      features: [
        "Participate in public servers & channels",
        "Direct Messaging & group chats",
        "Standard Gemini 1.5 Flash AI quota (20 queries/day)",
        "Standard file uploads (up to 10MB)",
        "Create up to 5 community servers",
      ],
      current: !currentUser?.premium_tier || currentUser.premium_tier === "free",
    },
    {
      id: "pro",
      name: "Developer Pro",
      price: "$12 / mo",
      description: "High-speed AI quotas, larger attachments, and pro cosmetics.",
      badge: "pro",
      features: [
        "Pro Profile Badge & glowing avatar ring",
        "Expanded AI Studio Quota (500 queries/day)",
        "100MB high-fidelity file and code uploads",
        "Create up to 50 community servers & groups",
        "Exclusive Cyber Neon & Obsidian themes",
        "Priority community support",
      ],
      current: currentUser?.premium_tier === "pro",
      popular: true,
    },
    {
      id: "supreme_dev",
      name: "Supreme Developer",
      price: "$29 / mo",
      description: "Ultimate engineering power with maximum AI tokens and sovereign styling.",
      badge: "supreme",
      features: [
        "Supreme Developer Gold Badge & custom effects",
        "Unlimited Gemini 1.5 Pro AI Studio tokens",
        "500MB media, zip, and asset upload limits",
        "Unlimited community servers & channels",
        "Direct Contact-to-Supreme priority channel",
        "Early access to upcoming WebAssembly and voice features",
      ],
      current: currentUser?.premium_tier === "supreme_dev",
      supreme: true,
    },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        <Header
          title="DevSphere Premium"
          subtitle="Upgrade your account, unlock high-quota AI, and expand your community limits"
          type="page"
          icon={<Sparkles className="h-5 w-5 text-purple-400" />}
          currentUser={currentUser}
        />

        <main className="max-w-6xl w-full mx-auto p-4 md:p-8 space-y-10">
          {/* Hero */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-bold border border-purple-500/20 shadow-purple-glow">
              Elevate Your Developer Experience
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Unlock DevSphere Premium
            </h2>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
              Supercharge your workflow with high-quota AI code generation, extended file limits, custom cosmetics, and priority support.
            </p>
          </div>

          {/* Pricing Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <Card
                key={tier.id}
                className={`relative flex flex-col justify-between overflow-hidden transition-all ${
                  tier.supreme
                    ? "border-amber-500/40 bg-zinc-900/90 shadow-supreme-glow"
                    : tier.popular
                    ? "border-purple-500/40 bg-zinc-900/90 shadow-purple-glow"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                    Most Popular
                  </div>
                )}
                {tier.supreme && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-600 text-black text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                    Supreme Tier
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg font-bold">{tier.name}</CardTitle>
                  </div>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-black text-white tracking-tight">
                      {tier.price}
                    </span>
                  </div>
                  <CardDescription className="text-xs text-zinc-400 mt-2">
                    {tier.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  <div className="h-[1px] w-full bg-zinc-800" />
                  <ul className="space-y-2.5 text-xs text-zinc-300">
                    {tier.features.map((f, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4 border-t border-zinc-800/80">
                  {tier.current ? (
                    <Button variant="outline" className="w-full font-semibold" disabled>
                      Current Plan
                    </Button>
                  ) : tier.id === "free" ? (
                    <Button variant="ghost" className="w-full" disabled>
                      Default Plan
                    </Button>
                  ) : (
                    <Button
                      variant={tier.supreme ? "supreme" : "default"}
                      className="w-full font-semibold"
                      onClick={() => {
                        setSelectedTier(tier.id as any);
                        setDialogOpen(true);
                      }}
                    >
                      Request {tier.name}
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* User's Submitted Requests History */}
          {myRequests.length > 0 && (
            <div className="space-y-3 pt-6 max-w-4xl mx-auto">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Your Contact / Premium Requests
              </h3>
              <div className="space-y-2">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white uppercase">
                          Tier: {req.tier_id}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                            req.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : req.status === "rejected"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{req.contact_message}</p>
                      {req.payment_reference && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Reference: <code className="text-zinc-300">{req.payment_reference}</code>
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Request Modal */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={`Request ${selectedTier === "supreme_dev" ? "Supreme Developer" : "Developer Pro"}`}
        description="Submit your contact inquiry or payment reference to the Supreme Owner and Admin staff for manual review and activation."
      >
        {submittedSuccess ? (
          <div className="p-6 text-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mx-auto">
              <Check className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-white">Request Dispatched</h4>
            <p className="text-xs text-zinc-400">
              The Supreme Owner has been notified. Your account will be upgraded upon verification.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Message / Rationale</label>
              <Textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Explain what you are building or any purchase details..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">
                Payment Reference / Transaction ID (Optional)
              </label>
              <Input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. TXN-12345 or Stripe Receipt Ref"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !contactMessage.trim()}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit to Supreme Owner"
                )}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      <MobileNav currentUser={currentUser} />
    </div>
  );
}

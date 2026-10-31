"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Check, Loader2 } from "lucide-react";
import { Header } from "@/components/navigation/header";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { Button } from "@/components/ui/button";
import type { UserProfile, ModerationReport } from "@/types";

export default function ModeratorPanelPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [reports, setReports] = React.useState<ModerationReport[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.isModerator) {
          router.push("/home");
          return;
        }
        setCurrentUser(data.user);
        loadReports();
      });
  }, [router]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports");
      if (res.ok) {
        const json = await res.json();
        setReports(json.reports || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string, status: "resolved" | "dismissed") => {
    try {
      await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadReports();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        <Header
          title="Moderator Queue"
          subtitle="Community standards and report auditing"
          type="page"
          icon={<ShieldCheck className="h-5 w-5 text-blue-400" />}
          currentUser={currentUser}
        />

        <main className="max-w-4xl w-full mx-auto p-4 md:p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Open Reports Queue ({reports.filter(r => r.status === "pending").length})
          </h3>

          {reports.length === 0 ? (
            <p className="text-xs text-zinc-500">The moderation queue is completely clear!</p>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {rep.reason_category}
                    </span>
                    <p className="text-sm text-zinc-200 mt-1">{rep.explanation}</p>
                    <p className="text-[10px] text-zinc-500">Target: {rep.target_type}</p>
                  </div>

                  {rep.status === "pending" && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleResolve(rep.id, "resolved")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(rep.id, "dismissed")}
                        className="text-xs"
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <MobileNav currentUser={currentUser} />
    </div>
  );
}

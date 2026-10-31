"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Users, Server, AlertTriangle, Check, Loader2 } from "lucide-react";
import { Header } from "@/components/navigation/header";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { UserProfile, ModerationReport } from "@/types";

export default function AdminPanelPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [reports, setReports] = React.useState<ModerationReport[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.isAdmin) {
          router.push("/home");
          return;
        }
        setCurrentUser(data.user);
        loadData();
      });
  }, [router]);

  const loadData = async () => {
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

  const handleResolveReport = async (reportId: string, status: "resolved" | "dismissed") => {
    try {
      await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        <Header
          title="Platform Administration"
          subtitle="Community safety, trust enforcement, and user report adjudication"
          type="page"
          icon={<ShieldAlert className="h-5 w-5 text-red-400" />}
          currentUser={currentUser}
        />

        <main className="max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader className="p-4">
                <CardDescription className="text-xs">Open Reports</CardDescription>
                <CardTitle className="text-2xl font-bold text-white">
                  {reports.filter(r => r.status === "pending").length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader className="p-4">
                <CardDescription className="text-xs">Adjudicated Reports</CardDescription>
                <CardTitle className="text-2xl font-bold text-emerald-400">
                  {reports.filter(r => r.status === "resolved").length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader className="p-4">
                <CardDescription className="text-xs">Dismissed Inquiries</CardDescription>
                <CardTitle className="text-2xl font-bold text-zinc-400">
                  {reports.filter(r => r.status === "dismissed").length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Active Moderation Queue
            </h3>

            {reports.length === 0 ? (
              <p className="text-xs text-zinc-500">No reports in the moderation queue.</p>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                        {rep.reason_category}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Target Type: <strong className="text-white">{rep.target_type}</strong>
                      </span>
                    </div>
                    <p className="text-sm text-zinc-200 mt-1">{rep.explanation}</p>
                    <p className="text-[11px] text-zinc-500">
                      Reported by {rep.reporter?.display_name || rep.reporter_id}
                    </p>
                  </div>

                  {rep.status === "pending" && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleResolveReport(rep.id, "resolved")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveReport(rep.id, "dismissed")}
                        className="text-xs"
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      <MobileNav currentUser={currentUser} />
    </div>
  );
}

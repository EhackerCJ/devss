"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Crown, 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Sliders, 
  FileText, 
  Activity, 
  Search, 
  AlertTriangle, 
  Check, 
  X, 
  Loader2, 
  Lock,
  ArrowRight,
  RefreshCw,
  Server as ServerIcon,
  MessageSquare
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
import { Avatar } from "@/components/ui/avatar";
import { timeAgo, getRoleBadgeStyle } from "@/lib/utils";
import type { UserProfile, AuditLogEntry, FeatureFlag, PremiumRequest } from "@/types";

export default function SupremePanelPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"overview" | "users" | "staff" | "premium" | "features" | "audit">("overview");

  // Data states
  const [stats, setStats] = React.useState<any>(null);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [premiumRequests, setPremiumRequests] = React.useState<PremiumRequest[]>([]);
  const [featureFlags, setFeatureFlags] = React.useState<FeatureFlag[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogEntry[]>([]);

  // Action Dialog states
  const [userSearchQuery, setUserSearchQuery] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);
  const [actionType, setActionType] = React.useState<string | null>(null);
  const [actionReason, setActionReason] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  // Re-auth state
  const [reauthOpen, setReauthOpen] = React.useState(false);
  const [reauthPassword, setReauthPassword] = React.useState("");
  const [reauthLoading, setReauthLoading] = React.useState(false);
  const [reauthError, setReauthError] = React.useState<string | null>(null);

  // 1. Initial Verification
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data?.isSupreme) {
          router.push("/home");
          return;
        }
        setCurrentUser(data.user);
        loadDashboardData();
      });
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, premRes, flagsRes, auditRes] = await Promise.all([
        fetch("/api/supreme/stats"),
        fetch("/api/supreme/users"),
        fetch("/api/premium/requests"),
        fetch("/api/supreme/features"),
        fetch("/api/supreme/audit"),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s.stats);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u.users || []);
      }
      if (premRes.ok) {
        const p = await premRes.json();
        setPremiumRequests(p.requests || []);
      }
      if (flagsRes.ok) {
        const f = await flagsRes.json();
        setFeatureFlags(f.flags || []);
      }
      if (auditRes.ok) {
        const a = await auditRes.json();
        setAuditLogs(a.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Re-authentication submission
  const handleReauth = async (e: React.FormEvent) => {
    e.preventDefault();
    setReauthLoading(true);
    setReauthError(null);

    try {
      const res = await fetch("/api/auth/reauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: reauthPassword }),
      });
      if (!res.ok) throw new Error("Incorrect password");
      setReauthOpen(false);
      setReauthPassword("");
    } catch (err: any) {
      setReauthError(err.message || "Authentication failed");
    } finally {
      setReauthLoading(false);
    }
  };

  // Execute User Action (Ban, Suspend, Activate, Verify)
  const handleExecuteUserAction = async () => {
    if (!selectedUser || !actionType || !actionReason.trim()) return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/supreme/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          action: actionType,
          reason: actionReason,
        }),
      });

      if (res.ok) {
        await loadDashboardData();
        setSelectedUser(null);
        setActionType(null);
        setActionReason("");
      } else {
        const err = await res.json();
        alert(err.error || "Action failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Staff Delegation Action
  const handleDelegateRole = async (targetUserId: string, newRole: string) => {
    const reason = prompt(`Please specify administrative reason to assign ${newRole}:`);
    if (!reason) return;

    try {
      const res = await fetch("/api/supreme/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, newRole, reason }),
      });

      if (res.ok) {
        await loadDashboardData();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to update staff role");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Feature Flag Toggle
  const handleToggleFlag = async (key: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/supreme/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled }),
      });

      if (res.ok) {
        setFeatureFlags((prev) =>
          prev.map((f) => (f.key === key ? { ...f, enabled } : f))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Review Premium Request
  const handleReviewPremium = async (requestId: string, status: "approved" | "rejected") => {
    const note = prompt(`Enter internal reference note for ${status.toUpperCase()}:`, "Verified by Supreme Owner");
    if (note === null) return;

    try {
      const res = await fetch("/api/premium/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status, internalNote: note }),
      });

      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.display_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        {/* Supreme Header */}
        <div className="h-16 min-h-[64px] border-b border-amber-500/30 bg-zinc-950/90 backdrop-blur-md px-6 flex items-center justify-between z-30 select-none shadow-supreme-glow">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-supreme-glow">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black tracking-tight text-white flex items-center space-x-2">
                <span>Supreme Owner Command Center</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold">
                  SOVEREIGN
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Full-spectrum governance, audit trails, and platform infrastructure control.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReauthOpen(true)}
              className="border-zinc-800 text-xs text-zinc-300"
            >
              <Lock className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
              Re-Auth Session
            </Button>
            <Button
              size="sm"
              variant="supreme"
              onClick={loadDashboardData}
              className="text-xs"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Sync Data
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-zinc-800/80 px-6 py-2 bg-zinc-950/50 select-none overflow-x-auto">
          {[
            { id: "overview", label: "Dashboard Overview", icon: <Activity className="h-4 w-4" /> },
            { id: "users", label: `User Directory (${users.length})`, icon: <Users className="h-4 w-4" /> },
            { id: "staff", label: "Staff Delegation", icon: <ShieldAlert className="h-4 w-4" /> },
            { id: "premium", label: `Premium Requests (${premiumRequests.filter(r => r.status === 'pending').length})`, icon: <Sparkles className="h-4 w-4" /> },
            { id: "features", label: "Feature Flags & Limits", icon: <Sliders className="h-4 w-4" /> },
            { id: "audit", label: `Audit Trail (${auditLogs.length})`, icon: <FileText className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <main className="max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
          {/* 1. Overview Tab */}
          {activeTab === "overview" && stats && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardHeader className="p-4 pb-1">
                    <CardDescription className="text-xs">Total Users</CardDescription>
                    <CardTitle className="text-2xl font-black text-white">{stats.totalUsers}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-[11px] text-zinc-500">
                    {stats.activeUsers} active now
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardHeader className="p-4 pb-1">
                    <CardDescription className="text-xs">Community Servers</CardDescription>
                    <CardTitle className="text-2xl font-black text-white">{stats.totalServers}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-[11px] text-zinc-500">
                    Public & private channels
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardHeader className="p-4 pb-1">
                    <CardDescription className="text-xs">Realtime Messages</CardDescription>
                    <CardTitle className="text-2xl font-black text-white">{stats.totalMessages}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-[11px] text-zinc-500">
                    DMs + Channels
                  </CardContent>
                </Card>

                <Card className="border-amber-500/30 bg-zinc-900/70 shadow-supreme-glow">
                  <CardHeader className="p-4 pb-1">
                    <CardDescription className="text-xs text-amber-300">Pending Premium Inquiries</CardDescription>
                    <CardTitle className="text-2xl font-black text-amber-400">{stats.premiumRequests}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-[11px] text-amber-400/80">
                    Awaiting verification
                  </CardContent>
                </Card>
              </div>

              {/* System Infrastructure Health */}
              <Card className="border-zinc-800 bg-zinc-900/60">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                    System Health & Subsystem Telemetry
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: "PostgreSQL Database Layer", status: "Operational (100%)", ok: true },
                    { name: "Realtime SSE / Event Hub", status: "Active (0ms latency)", ok: true },
                    { name: "Gemini 1.5 AI Assistant", status: "Integrated & Ready", ok: true },
                    { name: "Supreme RLS Security Guards", status: "Enforced Server-Side", ok: true },
                  ].map((sys, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60">
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-white">{sys.name}</span>
                      </div>
                      <p className="text-[11px] text-emerald-400 mt-1">{sys.status}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 2. User Directory Tab */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Input
                  placeholder="Search user by username, email, or display name..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                  className="max-w-md bg-zinc-900"
                />
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Platform Role</th>
                      <th className="p-3">State</th>
                      <th className="p-3">Premium</th>
                      <th className="p-3 text-right">Supreme Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredUsers.map((u) => {
                      const badge = getRoleBadgeStyle(u.platform_role);
                      const isSupreme = u.platform_role === "SUPREME_OWNER";

                      return (
                        <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-3 flex items-center space-x-3">
                            <Avatar src={u.avatar_url} fallback={u.display_name} size="sm" isSupreme={isSupreme} />
                            <div>
                              <p className="font-bold text-white">{u.display_name}</p>
                              <p className="text-zinc-500 text-[11px]">@{u.username} • {u.email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                u.account_state === "active"
                                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                  : u.account_state === "banned"
                                  ? "text-red-400 bg-red-500/10 border border-red-500/20"
                                  : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                              }`}
                            >
                              {u.account_state}
                            </span>
                          </td>
                          <td className="p-3">
                            {u.premium_tier && u.premium_tier !== "free" ? (
                              <span className="text-purple-400 font-bold uppercase text-[10px]">
                                {u.premium_tier}
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-[10px]">Free</span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            {!isSupreme ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setActionType("toggle_verified");
                                  }}
                                  className="text-[10px] h-7 px-2"
                                >
                                  {u.is_verified ? "Unverify" : "Verify"}
                                </Button>

                                {u.account_state === "banned" ? (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setActionType("unban");
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-[10px] h-7 px-2"
                                  >
                                    Unban
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setActionType("ban");
                                    }}
                                    className="text-[10px] h-7 px-2"
                                  >
                                    Ban
                                  </Button>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-amber-400 font-extrabold tracking-wider">
                                SOVEREIGN
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Staff Delegation Tab */}
          {activeTab === "staff" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200">
                <strong>Sovereign Staff Hierarchy:</strong> As Supreme Owner, you can delegate Platform Admin, Platform Moderator, or Support authority. No delegated staff can elevate themselves or modify your Supreme role.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.filter(u => u.platform_role !== "USER").map((staff) => (
                  <div
                    key={staff.id}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={staff.avatar_url}
                        fallback={staff.display_name}
                        size="md"
                        isSupreme={staff.platform_role === "SUPREME_OWNER"}
                      />
                      <div>
                        <p className="text-sm font-bold text-white">{staff.display_name}</p>
                        <p className="text-xs text-zinc-400">@{staff.username}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 font-semibold text-zinc-300 mt-1 inline-block">
                          {staff.platform_role}
                        </span>
                      </div>
                    </div>

                    {staff.platform_role !== "SUPREME_OWNER" && (
                      <div className="flex flex-col space-y-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelegateRole(staff.id, "PLATFORM_ADMIN")}
                          className="text-[10px] h-6 px-2"
                        >
                          Make Admin
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelegateRole(staff.id, "PLATFORM_MODERATOR")}
                          className="text-[10px] h-6 px-2"
                        >
                          Make Mod
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelegateRole(staff.id, "USER")}
                          className="text-[10px] h-6 px-2"
                        >
                          Revoke Staff
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Premium Inquiries Tab */}
          {activeTab === "premium" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Contact-to-Purchase Inquiries ({premiumRequests.length})
              </h3>

              {premiumRequests.length === 0 ? (
                <p className="text-xs text-zinc-500">No premium inquiries pending review.</p>
              ) : (
                <div className="space-y-3">
                  {premiumRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-start justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-white uppercase">
                            Tier: {req.tier_id}
                          </span>
                          <span className="text-xs text-zinc-400">by {req.user?.display_name || req.user_id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold uppercase">
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300">{req.contact_message}</p>
                        {req.payment_reference && (
                          <p className="text-xs text-zinc-400">
                            Payment Ref: <code className="text-zinc-200">{req.payment_reference}</code>
                          </p>
                        )}
                        <p className="text-[10px] text-zinc-500">
                          Submitted {timeAgo(req.created_at)}
                        </p>
                      </div>

                      {req.status === "pending" && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleReviewPremium(req.id, "approved")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Grant Premium
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReviewPremium(req.id, "rejected")}
                            className="text-xs"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. Feature Flags Tab */}
          {activeTab === "features" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Platform-Wide Feature Flags & Safe Controls
              </h3>

              <div className="space-y-3">
                {featureFlags.map((flag) => (
                  <div
                    key={flag.key}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono">{flag.key}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{flag.description}</p>
                    </div>

                    <button
                      onClick={() => handleToggleFlag(flag.key, !flag.enabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        flag.enabled ? "bg-amber-500" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          flag.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Immutable Audit Trail Tab */}
          {activeTab === "audit" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Immutable Privileged Action Audit Trail
              </h3>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-800/30">
                        <td className="p-3 text-zinc-500 font-mono text-[11px]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 font-semibold text-white">{log.actor_name || log.actor_id}</td>
                        <td className="p-3">
                          <code className="text-[11px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {log.action}
                          </code>
                        </td>
                        <td className="p-3 text-zinc-300">{log.target_name || log.target_id || "N/A"}</td>
                        <td className="p-3 text-zinc-400">{log.reason || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Action Dialog (Ban, Suspend, Verify) */}
      <Dialog
        open={selectedUser !== null && actionType !== null}
        onOpenChange={() => {
          setSelectedUser(null);
          setActionType(null);
        }}
        title={`Confirm Action: ${actionType?.toUpperCase()}`}
        description={`Target user: @${selectedUser?.username} (${selectedUser?.display_name})`}
        isSupreme
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">
              Mandatory Administrative Rationale
            </label>
            <Textarea
              placeholder="Provide clear documented justification for this audit log..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedUser(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "ban" ? "destructive" : "supreme"}
              onClick={handleExecuteUserAction}
              disabled={actionLoading || !actionReason.trim()}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Execute"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Re-Auth Dialog */}
      <Dialog
        open={reauthOpen}
        onOpenChange={setReauthOpen}
        title="Re-Authenticate Session"
        description="Verify your Supreme Sovereign password to refresh administrative authorization."
        isSupreme
      >
        <form onSubmit={handleReauth} className="space-y-4">
          {reauthError && (
            <p className="text-xs text-red-400">{reauthError}</p>
          )}
          <Input
            type="password"
            placeholder="Supreme password"
            value={reauthPassword}
            onChange={(e) => setReauthPassword(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setReauthOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="supreme" disabled={reauthLoading}>
              {reauthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Identity"}
            </Button>
          </div>
        </form>
      </Dialog>

      <MobileNav currentUser={currentUser} />
    </div>
  );
}

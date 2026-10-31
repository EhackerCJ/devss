"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Palette, 
  Shield, 
  Lock, 
  LogOut, 
  Save, 
  Loader2, 
  Check, 
  Crown,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Header } from "@/components/navigation/header";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { Avatar } from "@/components/ui/avatar";
import type { UserProfile } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"profile" | "appearance" | "privacy" | "security">("profile");

  // Form states
  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [bannerUrl, setBannerUrl] = React.useState("");
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [theme, setTheme] = React.useState("dark");

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
        if (data?.user) {
          setCurrentUser(data.user);
          setDisplayName(data.user.display_name || "");
          setBio(data.user.bio || "");
          setAvatarUrl(data.user.avatar_url || "");
          setBannerUrl(data.user.banner_url || "");
          setIsPrivate(data.user.is_private || false);
        }
        setLoading(false);
      });
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/users/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          is_private: isPrivate,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        <Header
          title="Settings"
          subtitle="Manage your profile, theme, privacy, and account security"
          type="page"
          currentUser={currentUser}
        />

        <main className="max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setActiveTab("appearance")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "appearance"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Palette className="h-4 w-4" />
              <span>Appearance</span>
            </button>

            <button
              onClick={() => setActiveTab("privacy")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "privacy"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Privacy</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "security"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>Account & Security</span>
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Public Profile</CardTitle>
                <CardDescription>
                  This information is displayed publicly on your DevSphere profile and in channels.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSaveProfile}>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar
                      src={avatarUrl}
                      fallback={displayName || "U"}
                      size="lg"
                      isSupreme={currentUser?.platform_role === "SUPREME_OWNER"}
                    />
                    <div>
                      <h4 className="text-sm font-semibold">{displayName}</h4>
                      <p className="text-xs text-zinc-400">@{currentUser?.username}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Display Name</label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Bio</label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell the community about yourself, tech stack, and projects..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Avatar Image URL</label>
                    <Input
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Banner Image URL</label>
                    <Input
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between items-center">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : savedSuccess ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-emerald-400" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Theme & Interface</CardTitle>
                <CardDescription>Customize how DevSphere looks and feels on your devices.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "dark", label: "Dark (Default)", color: "bg-zinc-950 border-zinc-700" },
                    { id: "obsidian", label: "Obsidian", color: "bg-[#030712] border-indigo-900" },
                    { id: "cyber", label: "Cyber Neon", color: "bg-zinc-900 border-cyan-500/50" },
                    { id: "light", label: "Pure Light", color: "bg-white border-zinc-300 text-black" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${t.color} ${
                        theme === t.id ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <span className="text-xs font-bold block">{t.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Privacy & Interactions</CardTitle>
                <CardDescription>Control who can message you, send requests, or view your presence.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/40">
                  <div>
                    <h5 className="text-sm font-semibold">Private Account</h5>
                    <p className="text-xs text-zinc-400">Require approval for new followers.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Account & Security</CardTitle>
                <CardDescription>Manage active sessions, passwords, and account access.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400">Signed in as</p>
                    <p className="text-sm font-bold text-white">{currentUser?.email}</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <MobileNav currentUser={currentUser} />
    </div>
  );
}

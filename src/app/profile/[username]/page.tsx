"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Crown, 
  Sparkles, 
  UserPlus, 
  UserCheck, 
  MessageSquare, 
  Link as LinkIcon, 
  Calendar, 
  ShieldCheck, 
  ShieldAlert,
  ArrowLeft,
  Loader2,
  Users
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Header } from "@/components/navigation/header";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { getRoleBadgeStyle } from "@/lib/utils";
import type { UserProfile, PresenceStatus } from "@/types";

interface ProfileData {
  user: UserProfile;
  presence: PresenceStatus;
  stats: {
    followersCount: number;
    followingCount: number;
    friendsCount: number;
    mutualFriendsCount: number;
  };
  relationship: {
    isSelf: boolean;
    isFollowing: boolean;
    areFriends: boolean;
  };
  followers: UserProfile[];
  following: UserProfile[];
  mutualFriends: UserProfile[];
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [data, setData] = React.useState<ProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [listModal, setListModal] = React.useState<"followers" | "following" | "mutual" | null>(null);

  // Load current viewer session
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res?.user) setCurrentUser(res.user);
      });
  }, []);

  // Load profile data
  const loadProfile = React.useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error("Profile not found");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFollowToggle = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      const method = data.relationship.isFollowing ? "DELETE" : "POST";
      const res = await fetch("/api/social/follow", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: data.user.id }),
      });
      if (res.ok) {
        setData((prev) => {
          if (!prev) return null;
          const nextFollowing = !prev.relationship.isFollowing;
          return {
            ...prev,
            relationship: { ...prev.relationship, isFollowing: nextFollowing },
            stats: {
              ...prev.stats,
              followersCount: prev.stats.followersCount + (nextFollowing ? 1 : -1),
            },
          };
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFriendRequest = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/social/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: data.user.id }),
      });
      if (res.ok) {
        alert("Friend request dispatched successfully!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDM = async () => {
    if (!data) return;
    try {
      const res = await fetch("/api/conversations/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: data.user.id }),
      });
      if (res.ok) {
        const conv = await res.json();
        router.push(`/dms/${conv.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-950 text-white items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen bg-zinc-950 text-white flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-2">User Not Found</h2>
        <p className="text-sm text-zinc-400 mb-4">No account exists with username @{username}.</p>
        <Button onClick={() => router.push("/home")}>Return to Home</Button>
      </div>
    );
  }

  const { user, stats, relationship, presence } = data;
  const isSupreme = user.platform_role === "SUPREME_OWNER";
  const badgeStyle = getRoleBadgeStyle(user.platform_role);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        <Header
          title={`@${user.username}`}
          subtitle={user.display_name}
          type="page"
          currentUser={currentUser}
        />

        <main className="max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back
          </button>

          {/* Profile Card Header */}
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-900/60 shadow-xl">
            {/* Banner Image */}
            <div className="h-44 md:h-56 w-full bg-gradient-to-r from-zinc-800 via-indigo-950 to-zinc-900 relative">
              {user.banner_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.banner_url}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              )}
              {isSupreme && (
                <div className="absolute top-4 right-4 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 font-extrabold px-3 py-1 rounded-full text-xs flex items-center space-x-1.5 shadow-supreme-glow">
                  <Crown className="h-4 w-4" />
                  <span>SUPREME OWNER</span>
                </div>
              )}
            </div>

            {/* Profile Info Row */}
            <div className="p-6 pt-0 relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-4 gap-4">
                {/* Avatar with status and supreme glow */}
                <Avatar
                  src={user.avatar_url}
                  fallback={user.display_name || user.username}
                  size="xl"
                  isSupreme={isSupreme}
                  status={presence}
                  className="ring-4 ring-zinc-950"
                />

                {/* Relationship Action Buttons */}
                <div className="flex items-center space-x-2 pt-2 sm:pt-0">
                  {relationship.isSelf ? (
                    <Button
                      variant="outline"
                      onClick={() => router.push("/settings")}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      {/* Follow Button */}
                      <Button
                        variant={relationship.isFollowing ? "outline" : "default"}
                        onClick={handleFollowToggle}
                        disabled={actionLoading}
                      >
                        {relationship.isFollowing ? "Following" : "Follow"}
                      </Button>

                      {/* Friend Request Button */}
                      {!relationship.areFriends ? (
                        <Button
                          variant="secondary"
                          onClick={handleFriendRequest}
                          disabled={actionLoading}
                        >
                          <UserPlus className="mr-1.5 h-4 w-4" />
                          Add Friend
                        </Button>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500 text-emerald-400 py-1.5 px-3">
                          <UserCheck className="mr-1 h-3.5 w-3.5" />
                          Friends
                        </Badge>
                      )}

                      {/* Direct Message Button */}
                      <Button
                        variant="secondary"
                        onClick={handleOpenDM}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Name, Handle, Badges */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2.5 flex-wrap">
                  <h2 className="text-xl md:text-2xl font-black text-white">
                    {user.display_name}
                  </h2>
                  <span className="text-sm text-zinc-400">@{user.username}</span>

                  {/* Badges */}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${badgeStyle.bg}`}>
                    {badgeStyle.label}
                  </span>
                  {user.is_verified && (
                    <span title="Verified Account">
                      <ShieldCheck className="h-4 w-4 text-cyan-400" />
                    </span>
                  )}
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed pt-1">
                    {user.bio}
                  </p>
                )}

                {/* Social Counts */}
                <div className="flex items-center space-x-6 pt-3 text-xs md:text-sm text-zinc-400">
                  <button
                    onClick={() => setListModal("followers")}
                    className="hover:text-white transition-colors"
                  >
                    <span className="font-bold text-white mr-1">{stats.followersCount}</span>
                    Followers
                  </button>
                  <button
                    onClick={() => setListModal("following")}
                    className="hover:text-white transition-colors"
                  >
                    <span className="font-bold text-white mr-1">{stats.followingCount}</span>
                    Following
                  </button>
                  <span>
                    <span className="font-bold text-white mr-1">{stats.friendsCount}</span>
                    Friends
                  </span>
                  {stats.mutualFriendsCount > 0 && (
                    <button
                      onClick={() => setListModal("mutual")}
                      className="hover:text-indigo-400 text-indigo-400/90 font-medium"
                    >
                      <span className="font-bold mr-1">{stats.mutualFriendsCount}</span>
                      Mutual Friends
                    </button>
                  )}
                </div>

                {/* Meta: Member since and links */}
                <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-zinc-500 border-t border-zinc-800/60 mt-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                  </div>
                  {user.links?.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-indigo-400 hover:underline"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      <span>{link.replace(/^https?:\/\//, "")}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Followers / Following List Modal */}
      <Dialog
        open={listModal !== null}
        onOpenChange={() => setListModal(null)}
        title={listModal === "followers" ? "Followers" : listModal === "following" ? "Following" : "Mutual Friends"}
      >
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {((listModal === "followers" ? data.followers : listModal === "following" ? data.following : data.mutualFriends) || []).map((u) => (
            <div
              key={u.id}
              onClick={() => {
                setListModal(null);
                router.push(`/profile/${u.username}`);
              }}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Avatar src={u.avatar_url} fallback={u.display_name} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-white">{u.display_name}</p>
                  <p className="text-xs text-zinc-400">@{u.username}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost">View</Button>
            </div>
          ))}
        </div>
      </Dialog>

      <MobileNav currentUser={currentUser} />
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Search, Users, ArrowRight, Sparkles, Loader2, Check } from "lucide-react";
import { Header } from "@/components/navigation/header";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import type { CommunityServer, UserProfile } from "@/types";

export default function DiscoverPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [servers, setServers] = React.useState<CommunityServer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [joiningId, setJoiningId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      });

    fetch("/api/servers/discover")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.servers) setServers(data.servers);
        setLoading(false);
      });
  }, []);

  const handleJoinServer = async (serverId: string) => {
    setJoiningId(serverId);
    try {
      const res = await fetch(`/api/servers/${serverId}/join`, {
        method: "POST",
      });
      if (res.ok) {
        router.push(`/servers/${serverId}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJoiningId(null);
    }
  };

  const filteredServers = servers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar currentUser={currentUser} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        <Header
          title="Discover Communities"
          subtitle="Explore public developer servers, open-source teams, and AI labs"
          type="page"
          icon={<Compass className="h-5 w-5 text-indigo-400" />}
          currentUser={currentUser}
        />

        <main className="max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">
          {/* Hero Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-gradient-to-r from-indigo-950/80 via-zinc-900 to-purple-950/80 p-8 md:p-12 shadow-2xl">
            <div className="max-w-xl space-y-3 z-10 relative">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                Explore Communities
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                Find your community on DevSphere
              </h2>
              <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
                From deep systems programming to cutting-edge AI architectures, collaborate with top engineers in active servers.
              </p>

              <div className="pt-2 relative max-w-md">
                <Input
                  placeholder="Search servers by keyword or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                  className="bg-zinc-950/80 border-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Servers Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Featured Communities ({filteredServers.length})
            </h3>

            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredServers.length === 0 ? (
              <div className="text-center p-12 text-zinc-500">
                No public servers match your search criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredServers.map((server) => (
                  <Card
                    key={server.id}
                    className="border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700 transition-all flex flex-col justify-between overflow-hidden group shadow-lg"
                  >
                    <div>
                      {/* Banner */}
                      <div className="h-28 w-full bg-gradient-to-r from-zinc-800 to-zinc-900 relative">
                        {server.banner_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={server.banner_url}
                            alt={server.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute -bottom-5 left-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border-2 border-zinc-950 shadow-md overflow-hidden">
                          {server.icon_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={server.icon_url}
                              alt={server.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="font-bold text-white text-sm">
                              {server.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <CardContent className="pt-8 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {server.name}
                          </h4>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {server.description || "Active community of software engineers."}
                        </p>
                      </CardContent>
                    </div>

                    <CardFooter className="flex items-center justify-between border-t border-zinc-800/60 pt-3">
                      <div className="flex items-center space-x-1.5 text-xs text-zinc-400">
                        <Users className="h-3.5 w-3.5" />
                        <span>{server.member_count || 1} members</span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleJoinServer(server.id)}
                        disabled={joiningId === server.id}
                        className="font-semibold text-xs"
                      >
                        {joiningId === server.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            Enter Server
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <MobileNav currentUser={currentUser} />
    </div>
  );
}

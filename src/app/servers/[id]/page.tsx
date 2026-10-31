"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ServerRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params?.id as string;

  React.useEffect(() => {
    if (!serverId) return;
    fetch(`/api/servers/${serverId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.server?.channels && data.server.channels.length > 0) {
          router.replace(`/servers/${serverId}/${data.server.channels[0].id}`);
        } else {
          router.replace("/home");
        }
      })
      .catch(() => {
        router.replace("/home");
      });
  }, [serverId, router]);

  return (
    <div className="flex h-screen bg-zinc-950 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

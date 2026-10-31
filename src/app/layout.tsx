import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "DevSphere | Supreme Social + Community + Messaging + AI Platform",
  description: "Production-oriented mobile-first full-stack social communication and developer collaboration platform with autonomous AI coding assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

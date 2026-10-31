"use client";

import * as React from "react";
import { 
  Bot, 
  Plus, 
  Send, 
  Sparkles, 
  Terminal, 
  Code, 
  ShieldCheck, 
  Cpu, 
  Loader2, 
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { Header } from "@/components/navigation/header";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { CodeBlock } from "@/components/chat/code-block";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import type { AIConversation, AIMessage, UserProfile } from "@/types";

export default function AIStudioPage() {
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [conversations, setConversations] = React.useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<AIMessage[]>([]);
  const [prompt, setPrompt] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // 1. Fetch Session
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      });
  }, []);

  // 2. Fetch AI Conversations
  const loadConversations = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/conversations");
      if (res.ok) {
        const json = await res.json();
        const convs: AIConversation[] = json.conversations || [];
        setConversations(convs);
        if (convs.length > 0 && !activeConvId) {
          setActiveConvId(convs[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeConvId]);

  React.useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 3. Fetch Messages for Active Session
  const loadMessages = React.useCallback(async () => {
    if (!activeConvId) return;
    try {
      const res = await fetch(`/api/ai/conversations/${activeConvId}/messages`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeConvId]);

  React.useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generating]);

  // 4. Create New Session
  const handleNewSession = async () => {
    try {
      const res = await fetch("/api/ai/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Session #${conversations.length + 1}` }),
      });
      if (res.ok) {
        const newConv = await res.json();
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Submit Prompt
  const handleSendPrompt = async (textToSend?: string) => {
    const text = textToSend || prompt;
    if (!text.trim() || !activeConvId || generating) return;

    setPrompt("");
    setGenerating(true);

    // Optimistic user message
    const tempUserMsg: AIMessage = {
      id: "temp-user",
      conversation_id: activeConvId,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/ai/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

      if (res.ok) {
        const json = await res.json();
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "temp-user"),
          json.userMessage,
          json.assistantMessage,
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const renderAIMessageContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <div key={lastIndex} className="whitespace-pre-wrap leading-relaxed my-1">
            {content.slice(lastIndex, match.index)}
          </div>
        );
      }
      const lang = match[1] || "typescript";
      parts.push(<CodeBlock key={match.index} language={lang} code={match[2]} />);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <div key={lastIndex} className="whitespace-pre-wrap leading-relaxed my-1">
          {content.slice(lastIndex)}
        </div>
      );
    }

    return parts;
  };

  const templates = [
    {
      title: "React 19 Actions & Optimistic State",
      icon: <Code className="h-4 w-4 text-cyan-400" />,
      prompt: "Refactor a form with optimistic updates and useActionState in React 19.",
    },
    {
      title: "Hardened PostgreSQL RLS Policies",
      icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
      prompt: "Write production Row Level Security policies for user documents to prevent IDOR.",
    },
    {
      title: "High-Performance Rust Buffer",
      icon: <Cpu className="h-4 w-4 text-amber-400" />,
      prompt: "Write a zero-allocation byte buffer module in Rust for high throughput networking.",
    },
    {
      title: "Debug Async / Promise Error",
      icon: <Terminal className="h-4 w-4 text-purple-400" />,
      prompt: "Explain how to implement exponential backoff retry for resilient HTTP requests in TypeScript.",
    },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar currentUser={currentUser} />

      {/* Sessions Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-zinc-900/80 border-r border-zinc-800/80 select-none">
        <div className="p-3 border-b border-zinc-800/80">
          <Button
            onClick={handleNewSession}
            className="w-full justify-start space-x-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>New Coding Session</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Recent Sessions
          </div>
          {conversations.map((c) => {
            const isActive = c.id === activeConvId;
            return (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold shadow-md"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                <Bot className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{c.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        <Header
          title="AI Coding Studio"
          subtitle="Powered by Google Gemini 1.5 & autonomous software engineering engine"
          type="page"
          icon={<Bot className="h-5 w-5 text-cyan-400" />}
          currentUser={currentUser}
        />

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto my-auto text-center space-y-6 pt-8">
              <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-cyber-glow">
                <Bot className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-black text-white">
                  DevSphere Autonomous AI Engineer
                </h2>
                <p className="text-xs md:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Generate architectures, refactor codebases, write unit tests, or debug complex distributed systems.
                </p>
              </div>

              {/* Template Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendPrompt(tpl.prompt)}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/70 hover:border-zinc-700 transition-all flex items-start space-x-3 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                      {tpl.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">
                        {tpl.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                        {tpl.prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex space-x-3 p-4 rounded-2xl ${
                    m.role === "assistant"
                      ? "bg-zinc-900/70 border border-zinc-800/80 shadow-md"
                      : "bg-transparent"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-cyber-glow">
                      <Bot className="h-5 w-5" />
                    </div>
                  ) : (
                    <Avatar
                      src={currentUser?.avatar_url}
                      fallback={currentUser?.display_name || "U"}
                      size="sm"
                      className="shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-white">
                        {m.role === "assistant" ? "DevSphere AI" : currentUser?.display_name || "You"}
                      </span>
                      {m.role === "assistant" && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                          Assistant
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-zinc-200">
                      {m.role === "assistant"
                        ? renderAIMessageContent(m.content)
                        : <p className="whitespace-pre-wrap">{m.content}</p>}
                    </div>
                  </div>
                </div>
              ))}

              {generating && (
                <div className="flex space-x-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                  <div className="flex items-center text-xs text-cyan-400 font-medium">
                    DevSphere AI is reasoning and generating your solution...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Studio Input Area */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-900 max-w-4xl w-full mx-auto">
          <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2 focus-within:border-cyan-500/60 transition-all">
            <textarea
              rows={1}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPrompt();
                }
              }}
              placeholder="Ask anything or paste code to refactor / debug..."
              className="flex-1 max-h-32 resize-none bg-transparent px-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />
            <Button
              size="sm"
              onClick={() => handleSendPrompt()}
              disabled={!prompt.trim() || generating}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold h-9 px-4"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <MobileNav currentUser={currentUser} />
    </div>
  );
}

"use client";

import * as React from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  language?: string;
  code: string;
}

export function CodeBlock({ language = "typescript", code }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const lines = code.trim().split("\n");

  return (
    <div className="my-2 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden text-xs shadow-lg group">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-zinc-400 select-none">
        <div className="flex items-center space-x-2">
          <Terminal className="h-3.5 w-3.5 text-indigo-400" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-300">
            {language}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 text-zinc-400 hover:text-white transition-colors py-0.5 px-2 rounded hover:bg-zinc-800"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body with line numbers */}
      <div className="overflow-x-auto p-3 font-mono text-[13px] leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-zinc-900/40">
                <td className="w-8 pr-3 text-right select-none text-zinc-600 font-mono text-[11px]">
                  {idx + 1}
                </td>
                <td className="whitespace-pre text-zinc-200">
                  {line || "\n"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

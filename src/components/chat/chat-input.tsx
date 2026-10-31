"use client";

import * as React from "react";
import { Send, Code, Sparkles, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  placeholder?: string;
  onSendMessage: (content: string) => Promise<void> | void;
  disabled?: boolean;
}

export function ChatInput({
  placeholder = "Send a message... (Use @AI to summon assistant)",
  onSendMessage,
  disabled = false,
}: ChatInputProps) {
  const [content, setContent] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!content.trim() || disabled) return;
    const msg = content;
    setContent("");
    await onSendMessage(msg);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertCodeBlock = () => {
    setContent((prev) => `${prev}\n\`\`\`typescript\n// Write your code here\n\n\`\`\`\n`);
    textareaRef.current?.focus();
  };

  const insertAIMention = () => {
    setContent((prev) => (prev ? `${prev} @AI ` : "@AI "));
    textareaRef.current?.focus();
  };

  return (
    <div className="p-3 bg-zinc-950 border-t border-zinc-900 select-none">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/80 transition-all p-2 flex flex-col">
        {/* Quick Toolbar */}
        <div className="flex items-center space-x-1 mb-1.5 px-1 border-b border-zinc-800/60 pb-1 text-zinc-400">
          <button
            type="button"
            onClick={insertCodeBlock}
            className="flex items-center space-x-1 px-2 py-1 rounded text-xs hover:bg-zinc-800 hover:text-white transition-colors"
            title="Insert Code Snippet"
          >
            <Code className="h-3.5 w-3.5 text-indigo-400" />
            <span>Code</span>
          </button>

          <button
            type="button"
            onClick={insertAIMention}
            className="flex items-center space-x-1 px-2 py-1 rounded text-xs hover:bg-zinc-800 hover:text-cyan-300 transition-colors"
            title="Summon AI Coding Assistant"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>@AI</span>
          </button>
        </div>

        {/* Text Area Input */}
        <div className="flex items-end space-x-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 max-h-40 resize-none bg-transparent px-2 py-1 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />

          <Button
            size="sm"
            onClick={handleSend}
            disabled={!content.trim() || disabled}
            className="h-8 px-3 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

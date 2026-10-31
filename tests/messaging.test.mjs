import { test } from "node:test";
import assert from "node:assert";

test("Messaging: Detects and parses code fences and @AI mentions", () => {
  const content = "Here is the code block:\n```typescript\nconst x: number = 42;\n```\nHey @AI please review this!";

  const hasCodeBlock = /```(\w+)?\n([\s\S]*?)```/.test(content);
  assert.strictEqual(hasCodeBlock, true, "Should recognize markdown code fence");

  const hasAIMention = /@ai\b/i.test(content);
  assert.strictEqual(hasAIMention, true, "Should detect @AI mention");
});

test("Messaging: Emoji reaction toggle state machine", () => {
  let reactions = [
    { user_id: "user_1", emoji: "🚀" },
    { user_id: "user_2", emoji: "❤️" },
  ];

  const toggleReaction = (list, userId, emoji) => {
    const idx = list.findIndex((r) => r.user_id === userId && r.emoji === emoji);
    if (idx >= 0) {
      return list.filter((_, i) => i !== idx);
    } else {
      return [...list, { user_id: userId, emoji }];
    }
  };

  // Toggle user_1 adding '❤️'
  reactions = toggleReaction(reactions, "user_1", "❤️");
  assert.strictEqual(reactions.filter((r) => r.emoji === "❤️").length, 2);

  // Toggle user_1 removing '❤️'
  reactions = toggleReaction(reactions, "user_1", "❤️");
  assert.strictEqual(reactions.filter((r) => r.emoji === "❤️").length, 1);
});

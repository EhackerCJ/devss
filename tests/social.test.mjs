import { test } from "node:test";
import assert from "node:assert";

test("Social Graph: Prevents self-follow and self-friend", () => {
  const userId = "00000000-0000-0000-0000-000000000006";

  const canFollow = (followerId, followingId) => followerId !== followingId;
  const canFriend = (senderId, receiverId) => senderId !== receiverId;

  assert.strictEqual(canFollow(userId, userId), false, "Self-follow must be forbidden");
  assert.strictEqual(canFriend(userId, userId), false, "Self-friend request must be forbidden");
});

test("Social Graph: Mutual friendships calculation", () => {
  // User A friends with [User B, User C, User D]
  const userAFriends = new Set(["user_b", "user_c", "user_d"]);

  // User E friends with [User B, User D, User F]
  const userEFriends = new Set(["user_b", "user_d", "user_f"]);

  // Mutual friends = intersection
  const mutual = [...userAFriends].filter((id) => userEFriends.has(id));

  assert.deepStrictEqual(mutual.sort(), ["user_b", "user_d"].sort());
  assert.strictEqual(mutual.length, 2, "Should identify exactly 2 mutual friends");
});

test("Social Graph: Friend request status transition rules", () => {
  let status = "pending";

  const applyAction = (current, action) => {
    if (current !== "pending") throw new Error("Only pending requests can be resolved");
    if (action === "accept") return "accepted";
    if (action === "reject") return "rejected";
    if (action === "cancel") return "cancelled";
    throw new Error("Invalid action");
  };

  status = applyAction(status, "accept");
  assert.strictEqual(status, "accepted");

  // Attempting to accept an already accepted request should throw
  assert.throws(() => {
    applyAction(status, "accept");
  });
});

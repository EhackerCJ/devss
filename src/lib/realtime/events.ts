import { EventEmitter } from "events";

type RealtimeEventType = 
  | "new_message" 
  | "message_edited" 
  | "message_deleted" 
  | "reaction_added" 
  | "typing" 
  | "presence" 
  | "notification";

interface RealtimeEvent {
  type: RealtimeEventType;
  targetId: string; // conversationId, channelId, or userId
  payload: unknown;
  timestamp: string;
}

class RealtimeHub extends EventEmitter {
  public broadcast(type: RealtimeEventType, targetId: string, payload: unknown) {
    const event: RealtimeEvent = {
      type,
      targetId,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.emit("event", event);
    this.emit(`target:${targetId}`, event);
  }
}

// Global Singleton Hub
declare global {
  var __realtimeHub: RealtimeHub | undefined;
}

export const realtimeHub = global.__realtimeHub || new RealtimeHub();
if (process.env.NODE_ENV !== "production") {
  global.__realtimeHub = realtimeHub;
}

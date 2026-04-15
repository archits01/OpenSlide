import type { Slide, Outline } from "@/lib/redis";

// All typed events the agent can emit
export type AgentEvent =
  | { type: "thinking"; text: string }
  | { type: "text_delta"; text: string }
  | { type: "text_done"; text: string }
  | { type: "tool_call"; toolName: string; toolUseId: string; input: unknown }
  | { type: "tool_result"; toolName: string; toolUseId: string; result: unknown; isError: boolean }
  | { type: "tool_input_ready"; toolUseId: string; input: unknown }
  | { type: "outline_created"; outline: Outline }
  | { type: "slide_building"; toolUseId: string; title?: string; partialContent: string }
  | { type: "slide_created"; slide: Slide }
  | { type: "slide_updated"; slideId: string; changes: Partial<Slide> }
  | { type: "slide_deleted"; slideId: string }
  | { type: "slides_reordered"; order: string[] }
  | { type: "theme_changed"; theme: string; colors?: { bg: string; text: string; accent: string; secondary: string; dark: string; accentLight: string; border: string } }
  | { type: "logo_fetched"; logoUrl: string; colors: string[]; name?: string }
  | { type: "research_progress"; stage: string; agentId?: string; detail: string }
  | { type: "credits_update"; balance: number; used: number }
  | { type: "connection_required"; provider: string; connectUrl: string; message: string }
  | { type: "error"; message: string }
  | { type: "done"; stopReason: string };

export type AgentEventHandler = (event: AgentEvent) => void;

export class AgentEventBus {
  private subscribers: AgentEventHandler[] = [];

  subscribe(handler: AgentEventHandler): () => void {
    this.subscribers.push(handler);
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter((h) => h !== handler);
    };
  }

  emit(event: AgentEvent): void {
    for (const handler of this.subscribers) {
      try {
        handler(event);
      } catch (err) {
        console.error("[AgentEventBus] Subscriber threw:", err);
      }
    }
  }

  // Collect all events into an array (useful for testing)
  collect(): { events: AgentEvent[]; unsubscribe: () => void } {
    const events: AgentEvent[] = [];
    const unsubscribe = this.subscribe((e) => events.push(e));
    return { events, unsubscribe };
  }
}

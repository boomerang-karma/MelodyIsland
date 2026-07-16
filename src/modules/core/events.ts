/**
 * Lightweight event bus — modules communicate via domain events
 * without hard coupling. Enhance by swapping for RxJS / mitt later.
 */

export type DomainEventMap = {
  "note:detected": import("./types").NoteEvent;
  "attempt:result": import("./types").AttemptResult;
  "activity:started": { activityId: string; sessionId: string };
  "activity:completed": import("./types").ActivityResult;
  "skill:updated": { skillId: string; pMastery: number };
  "companion:mood": { mood: import("./types").CompanionMood };
  "session:ended": { sessionId: string; minutes: number };
  "frustration:triggered": { skillId: string; activityId: string };
  "island:unlocked": { islandId: number };
};

type Handler<T> = (payload: T) => void;

class EventBus {
  private listeners = new Map<string, Set<Handler<unknown>>>();

  on<K extends keyof DomainEventMap>(
    event: K,
    handler: Handler<DomainEventMap[K]>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as Handler<unknown>);
    return () => this.off(event, handler);
  }

  off<K extends keyof DomainEventMap>(
    event: K,
    handler: Handler<DomainEventMap[K]>,
  ): void {
    this.listeners.get(event)?.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof DomainEventMap>(
    event: K,
    payload: DomainEventMap[K],
  ): void {
    this.listeners.get(event)?.forEach((h) => h(payload));
  }

  clear(): void {
    this.listeners.clear();
  }
}

/** Singleton bus shared across client modules */
export const bus = new EventBus();

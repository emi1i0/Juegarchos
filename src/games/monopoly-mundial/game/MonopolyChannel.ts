import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "../../../shared/supabase";
import type { Action, GameState } from "./types";

/** Accion de un cliente hacia el host. */
export interface ActPayload {
  /** Nickname del que actua. */
  p: string;
  a: Action;
}

/** Arranque de partida: el host manda la lista final de jugadores. */
export interface GoPayload {
  players: string[];
}

/**
 * Canal efimero de la partida de Monopoly: broadcast puro (sin DB), separado
 * del RoomChannel para no mezclar el trafico del juego con el sync de salas.
 * Mismo patron que ArenaChannel de rocket-arena, pero turn-based: el host es
 * el unico que corre el motor y difunde el GameState completo (es chico) en
 * cada cambio; los clientes solo mandan acciones.
 */
export class MonopolyChannel {
  private readonly channel: RealtimeChannel | null;
  private readonly stateCbs: Array<(s: GameState) => void> = [];
  private readonly actCbs: Array<(p: ActPayload) => void> = [];
  private readonly goCbs: Array<(p: GoPayload) => void> = [];
  private readonly helloCbs: Array<(player: string) => void> = [];

  constructor(code: string, round: number) {
    const supabase = getSupabase();
    if (!supabase) {
      this.channel = null;
      return;
    }
    this.channel = supabase.channel(`monopoly:${code}:${round}`, {
      config: { broadcast: { self: false } },
    });
    this.channel.on("broadcast", { event: "st" }, ({ payload }) => {
      for (const cb of this.stateCbs) cb(payload as GameState);
    });
    this.channel.on("broadcast", { event: "act" }, ({ payload }) => {
      for (const cb of this.actCbs) cb(payload as ActPayload);
    });
    this.channel.on("broadcast", { event: "go" }, ({ payload }) => {
      for (const cb of this.goCbs) cb(payload as GoPayload);
    });
    this.channel.on("broadcast", { event: "hello" }, ({ payload }) => {
      for (const cb of this.helloCbs) cb((payload as { p: string }).p);
    });
    this.channel.subscribe();
  }

  sendState(state: GameState): void {
    if (this.channel) void this.channel.send({ type: "broadcast", event: "st", payload: state });
  }

  sendAction(payload: ActPayload): void {
    if (this.channel) void this.channel.send({ type: "broadcast", event: "act", payload });
  }

  sendGo(payload: GoPayload): void {
    if (this.channel) void this.channel.send({ type: "broadcast", event: "go", payload });
  }

  /** Un cliente que llega tarde pide el estado vigente. */
  sendHello(player: string): void {
    if (this.channel) void this.channel.send({ type: "broadcast", event: "hello", payload: { p: player } });
  }

  onState(cb: (s: GameState) => void): void {
    this.stateCbs.push(cb);
  }

  onAction(cb: (p: ActPayload) => void): void {
    this.actCbs.push(cb);
  }

  onGo(cb: (p: GoPayload) => void): void {
    this.goCbs.push(cb);
  }

  onHello(cb: (player: string) => void): void {
    this.helloCbs.push(cb);
  }

  dispose(): void {
    if (!this.channel) return;
    const supabase = getSupabase();
    if (supabase) void supabase.removeChannel(this.channel);
  }
}

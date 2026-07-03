import { GROUP_TILES, JAIL_FINE, TILES } from "./constants";
import { current, tradeValid } from "./engine";
import type { Action, Difficulty, GameState, TradeOffer } from "./types";

/**
 * IA de los rivales. Devuelve UNA accion por llamada; el Game la aplica con
 * una pausa y vuelve a consultar, asi los turnos del bot se leen en el log
 * como una secuencia y no como un teletipo instantaneo.
 *
 * La dificultad regula la reserva de efectivo y la agresividad compradora
 * (equivalente a First Time Buyer / Entrepreneur / Tycoon del Monopoly de
 * consola): el debutante compra poco y construye tarde, el campeon compra
 * todo lo que puede y construye apenas cierra un grupo.
 */

interface BotProfile {
  /** Efectivo que intenta no gastar. */
  reserve: number;
  /** Probabilidad de comprar una propiedad que puede pagar. */
  buyChance: number;
}

const PROFILES: Record<Difficulty, BotProfile> = {
  debutante: { reserve: 400, buyChance: 0.55 },
  profesional: { reserve: 200, buyChance: 0.85 },
  campeon: { reserve: 60, buyChance: 1 },
};

export function botAction(state: GameState, difficulty: Difficulty): Action | null {
  const me = current(state);
  const profile = PROFILES[difficulty];

  switch (state.phase) {
    case "roll": {
      if (me.inJail) {
        if (me.pardons > 0) return { type: "usePardon" };
        // Paga temprano si tiene espalda; si no, apuesta a los dobles.
        if (me.money > JAIL_FINE + profile.reserve && me.jailTurns < 2) return { type: "payJail" };
      }
      const build = buildTarget(state, profile);
      if (build !== null) return { type: "build", tile: build };
      const lift = unmortgageTarget(state, profile);
      if (lift !== null) return { type: "unmortgage", tile: lift };
      return { type: "roll" };
    }

    case "buy": {
      const tile = TILES[state.buying!];
      const price = tile.price ?? 0;
      const completes = tile.kind === "street" && tile.group
        ? GROUP_TILES[tile.group].every((i) => i === state.buying || state.own[i]?.owner === me.name)
        : false;
      const affordable = me.money - price >= (completes ? 0 : profile.reserve);
      if (me.money >= price && (completes || (affordable && Math.random() < profile.buyChance))) {
        return { type: "buy" };
      }
      return { type: "skip" };
    }

    case "manage": {
      const build = buildTarget(state, profile);
      if (build !== null) return { type: "build", tile: build };
      return { type: "end" };
    }

    case "debt": {
      const debt = state.debt!;
      if (me.money >= debt.amount) return { type: "payDebt" };
      // Liquida: primero tribunas, despues hipotecas (mas baratas primero).
      const sellable = ownTiles(state, me.name).filter((i) => (state.own[i].houses ?? 0) > 0);
      if (sellable.length > 0) {
        sellable.sort((a, b) => (state.own[b].houses - state.own[a].houses));
        return { type: "sellHouse", tile: sellable[0] };
      }
      const mortgageable = ownTiles(state, me.name).filter(
        (i) => !state.own[i].mortgaged && state.own[i].houses === 0,
      );
      if (mortgageable.length > 0) {
        mortgageable.sort((a, b) => (TILES[a].price ?? 0) - (TILES[b].price ?? 0));
        return { type: "mortgage", tile: mortgageable[0] };
      }
      return { type: "bankrupt" };
    }

    default:
      return null;
  }
}

/** Respuesta del bot a un canje que le proponen. */
export function botTradeResponse(state: GameState, offer: TradeOffer, difficulty: Difficulty): Action {
  if (!tradeValid(state, offer)) return { type: "tradeReject" };
  const factor = difficulty === "debutante" ? 1.1 : difficulty === "profesional" ? 1.25 : 1.4;

  // Lo que recibe el bot es lo que el proponente entrega.
  const gains = offer.giveMoney + offer.giveProps.reduce((sum, i) => sum + valueFor(state, i, offer.to), 0);
  const costs = offer.getMoney + offer.getProps.reduce((sum, i) => sum + valueFor(state, i, offer.from), 0);
  return gains >= costs * factor ? { type: "tradeAccept" } : { type: "tradeReject" };
}

/** Valor percibido de una propiedad para `who`: sube si le completa el grupo. */
function valueFor(state: GameState, tileIdx: number, who: string): number {
  const tile = TILES[tileIdx];
  const price = tile.price ?? 0;
  if (tile.kind !== "street" || !tile.group) return price;
  const completes = GROUP_TILES[tile.group].every(
    (i) => i === tileIdx || state.own[i]?.owner === who,
  );
  return completes ? price * 2 : price;
}

function ownTiles(state: GameState, name: string): number[] {
  return Object.keys(state.own).map(Number).filter((i) => state.own[i].owner === name);
}

/** Mejor casilla donde construir respetando reserva y construccion pareja. */
function buildTarget(state: GameState, profile: BotProfile): number | null {
  const me = current(state);
  for (const [group, tiles] of Object.entries(GROUP_TILES)) {
    void group;
    if (!tiles.every((i) => state.own[i]?.owner === me.name && !state.own[i].mortgaged)) continue;
    const sorted = [...tiles].sort((a, b) => (state.own[a].houses - state.own[b].houses) || ((TILES[b].rents?.[0] ?? 0) - (TILES[a].rents?.[0] ?? 0)));
    const target = sorted[0];
    const cost = TILES[target].houseCost ?? 0;
    if (state.own[target].houses < 5 && me.money - cost >= profile.reserve) return target;
  }
  return null;
}

/** Levanta hipotecas cuando sobra plata (prioriza grupos propios completos). */
function unmortgageTarget(state: GameState, profile: BotProfile): number | null {
  const me = current(state);
  const mortgaged = ownTiles(state, me.name).filter((i) => state.own[i].mortgaged);
  for (const idx of mortgaged) {
    const cost = Math.ceil(Math.floor((TILES[idx].price ?? 0) / 2) * 1.1);
    if (me.money - cost >= profile.reserve * 2) return idx;
  }
  return null;
}

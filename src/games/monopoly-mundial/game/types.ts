/** Dificultad de los bots (equivalente a First Time Buyer / Entrepreneur / Tycoon). */
export type Difficulty = "debutante" | "profesional" | "campeon";

/**
 * Fase del turno en curso:
 * - roll: el jugador de turno debe tirar (o resolver su suspension).
 * - buy: cayo en una propiedad libre y decide si la compra.
 * - manage: ya se movio y resolvio; puede construir / hipotecar / canjear / terminar.
 * - debt: debe mas dinero del que tiene; debe liquidar activos o quebrar.
 * - over: partida terminada.
 */
export type Phase = "roll" | "buy" | "manage" | "debt" | "over";

export interface PlayerState {
  name: string;
  /** Indice en TOKENS (color + sigla de la ficha). */
  token: number;
  money: number;
  pos: number;
  /** Suspendido (en el Vestuario). */
  inJail: boolean;
  /** Intentos de dobles consumidos estando suspendido. */
  jailTurns: number;
  /** Tarjetas "apelacion ganada" (salir de la suspension gratis). */
  pardons: number;
  bankrupt: boolean;
  isBot: boolean;
}

export interface TileOwnership {
  owner: string;
  /** 0-4 tribunas, 5 = estadio completo. */
  houses: number;
  mortgaged: boolean;
}

export interface TradeOffer {
  from: string;
  to: string;
  giveMoney: number;
  getMoney: number;
  /** Indices de casilla que entrega el proponente. */
  giveProps: number[];
  /** Indices de casilla que pide al otro. */
  getProps: number[];
}

export interface DebtState {
  amount: number;
  /** null = deuda con la banca. */
  to: string | null;
  /** Que sigue una vez pagada (para retomar el flujo del turno). */
  resume: "manage" | "roll";
}

export interface LogEntry {
  id: number;
  /** ms desde el inicio de la partida. */
  t: number;
  text: string;
}

/** Efecto de sonido/animacion emitido por el motor; los clientes lo reproducen por seq. */
export interface FxEvent {
  seq: number;
  kind: string;
}

export interface GameState {
  players: PlayerState[];
  /** Propiedad por indice de casilla; ausente = sin dueno. */
  own: Record<number, TileOwnership>;
  /** Indice del jugador de turno. */
  turn: number;
  phase: Phase;
  dice: [number, number] | null;
  /** Dobles encadenados en el turno actual. */
  doubles: number;
  /** Casilla pendiente de decision de compra (phase = buy). */
  buying: number | null;
  debt: DebtState | null;
  trade: TradeOffer | null;
  /** Mazos barajados de indices de tarjeta (se reponen al agotarse). */
  varDeck: number[];
  fifaDeck: number[];
  log: LogEntry[];
  logSeq: number;
  fx: FxEvent[];
  fxSeq: number;
  winner: string | null;
  startedAt: number;
}

export type Action =
  | { type: "roll" }
  | { type: "buy" }
  | { type: "skip" }
  | { type: "build"; tile: number }
  | { type: "sellHouse"; tile: number }
  | { type: "mortgage"; tile: number }
  | { type: "unmortgage"; tile: number }
  | { type: "payJail" }
  | { type: "usePardon" }
  | { type: "end" }
  | { type: "payDebt" }
  | { type: "bankrupt" }
  | { type: "trade"; offer: TradeOffer }
  | { type: "tradeAccept" }
  | { type: "tradeReject" }
  | { type: "tradeCancel" };

export type TileKind =
  | "go"
  | "street"
  | "stadium"
  | "utility"
  | "tax"
  | "var"
  | "fifa"
  | "jail"
  | "fanfest"
  | "gotojail";

export interface TileDef {
  kind: TileKind;
  name: string;
  /** Nombre corto para la casilla del tablero. */
  short: string;
  price?: number;
  /** Renta base, 1-4 tribunas, estadio (solo street). */
  rents?: number[];
  /** Grupo de color (solo street). */
  group?: string;
  /** Costo de cada tribuna (solo street). */
  houseCost?: number;
  /** Monto del impuesto (solo tax). */
  tax?: number;
}

export interface CardDef {
  text: string;
  effect: CardEffect;
}

export type CardEffect =
  | { type: "goto"; tile: number }
  | { type: "gotojail" }
  | { type: "pardon" }
  | { type: "money"; amount: number }
  | { type: "each"; amount: number }
  | { type: "repairs"; perHouse: number; perHotel: number }
  | { type: "back"; steps: number }
  | { type: "nearest"; kind: "stadium" | "utility" };

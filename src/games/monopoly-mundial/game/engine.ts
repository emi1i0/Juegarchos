import {
  FIFA_CARDS,
  GO_SALARY,
  GROUP_TILES,
  JAIL_FINE,
  JAIL_POS,
  STADIUM_TILES,
  STARTING_MONEY,
  TILES,
  UTILITY_TILES,
  VAR_CARDS,
} from "./constants";
import type {
  Action,
  CardDef,
  GameState,
  PlayerState,
  TileOwnership,
  TradeOffer,
} from "./types";

/**
 * Motor de reglas puro y host-autoritativo: una unica funcion applyAction que
 * muta el GameState y agrega log + fx. No toca DOM ni red; el mismo motor
 * corre la partida local contra bots y la partida online (solo en el host,
 * que difunde snapshots del estado).
 *
 * Reglas segun el reglamento clasico en espanol, con dos simplificaciones
 * documentadas en el CLAUDE.md del juego: no hay subastas (la propiedad
 * rechazada queda en la banca) y no hay tope de tribunas de la banca.
 */

const MAX_LOG = 60;
const MAX_FX = 10;

function shuffled(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createGame(players: { name: string; isBot: boolean }[]): GameState {
  return {
    players: players.map((p, i) => ({
      name: p.name,
      token: i,
      money: STARTING_MONEY,
      pos: 0,
      inJail: false,
      jailTurns: 0,
      pardons: 0,
      bankrupt: false,
      isBot: p.isBot,
    })),
    own: {},
    turn: 0,
    phase: "roll",
    dice: null,
    doubles: 0,
    buying: null,
    debt: null,
    trade: null,
    varDeck: shuffled(VAR_CARDS.length),
    fifaDeck: shuffled(FIFA_CARDS.length),
    log: [],
    logSeq: 0,
    fx: [],
    fxSeq: 0,
    winner: null,
    startedAt: Date.now(),
  };
}

export function current(state: GameState): PlayerState {
  return state.players[state.turn];
}

export function findPlayer(state: GameState, name: string): PlayerState | null {
  return state.players.find((p) => p.name === name) ?? null;
}

export function log(state: GameState, text: string): void {
  state.log.push({ id: state.logSeq++, t: Date.now() - state.startedAt, text });
  if (state.log.length > MAX_LOG) state.log.splice(0, state.log.length - MAX_LOG);
}

function fx(state: GameState, kind: string): void {
  state.fx.push({ seq: state.fxSeq++, kind });
  if (state.fx.length > MAX_FX) state.fx.splice(0, state.fx.length - MAX_FX);
}

/** Patrimonio: efectivo + valor de propiedades y tribunas (hipotecadas a mitad). */
export function netWorth(state: GameState, name: string): number {
  const player = findPlayer(state, name);
  if (!player || player.bankrupt) return 0;
  let total = player.money;
  for (const [tileStr, own] of Object.entries(state.own)) {
    if (own.owner !== name) continue;
    const tile = TILES[Number(tileStr)];
    const price = tile.price ?? 0;
    total += own.mortgaged ? Math.floor(price / 2) : price;
    total += own.houses * (tile.houseCost ?? 0);
  }
  return total;
}

/** Cantidad de estadios sede del dueno (para la renta 25/50/100/200). */
function stadiumsOwned(state: GameState, owner: string): number {
  return STADIUM_TILES.filter((i) => state.own[i]?.owner === owner).length;
}

function ownsFullGroup(state: GameState, owner: string, group: string): boolean {
  return GROUP_TILES[group].every((i) => state.own[i]?.owner === owner);
}

export function rentFor(state: GameState, tileIdx: number, diceTotal: number): number {
  const tile = TILES[tileIdx];
  const own = state.own[tileIdx];
  if (!own || own.mortgaged) return 0;

  if (tile.kind === "street") {
    const base = tile.rents![own.houses];
    if (own.houses === 0 && ownsFullGroup(state, own.owner, tile.group!)) return base * 2;
    return base;
  }
  if (tile.kind === "stadium") {
    return 25 * 2 ** (stadiumsOwned(state, own.owner) - 1);
  }
  if (tile.kind === "utility") {
    const count = UTILITY_TILES.filter((i) => state.own[i]?.owner === own.owner).length;
    return diceTotal * (count === 2 ? 10 : 4);
  }
  return 0;
}

function activePlayers(state: GameState): PlayerState[] {
  return state.players.filter((p) => !p.bankrupt);
}

function checkWinner(state: GameState): void {
  const alive = activePlayers(state);
  if (alive.length === 1) {
    state.winner = alive[0].name;
    state.phase = "over";
    log(state, `${alive[0].name} gana el torneo con $${netWorth(state, alive[0].name)} de patrimonio.`);
    fx(state, "win");
  }
}

/**
 * Cobra `amount` al jugador de turno. Si no le alcanza, entra en fase de
 * deuda (debe liquidar activos o quebrar). Devuelve true si pudo pagar ya.
 */
function charge(state: GameState, payer: PlayerState, amount: number, to: string | null, resume: "manage" | "roll"): boolean {
  if (payer.money >= amount) {
    payer.money -= amount;
    if (to) {
      const creditor = findPlayer(state, to);
      if (creditor) creditor.money += amount;
    }
    fx(state, "cash");
    return true;
  }
  state.debt = { amount, to, resume };
  state.phase = "debt";
  log(state, `${payer.name} debe $${amount}${to ? ` a ${to}` : " a la banca"} y no le alcanza: tiene que vender o hipotecar.`);
  fx(state, "alarm");
  return false;
}

function sendToJail(state: GameState, player: PlayerState): void {
  player.pos = JAIL_POS;
  player.inJail = true;
  player.jailTurns = 0;
  state.doubles = 0;
  state.phase = "manage";
  log(state, `${player.name} recibe la roja y queda suspendido en el Vestuario.`);
  fx(state, "whistle");
}

/** Avanza `steps` casillas cobrando salario al pasar por el Saque Inicial. */
function advance(state: GameState, player: PlayerState, steps: number): void {
  const next = (player.pos + steps + TILES.length) % TILES.length;
  if (steps > 0 && next < player.pos) {
    player.money += GO_SALARY;
    log(state, `${player.name} pasa por el Saque Inicial y cobra $${GO_SALARY}.`);
    fx(state, "goal");
  }
  player.pos = next;
}

function moveTo(state: GameState, player: PlayerState, tile: number, collectGo: boolean): void {
  if (collectGo && tile <= player.pos) {
    player.money += GO_SALARY;
    log(state, `${player.name} pasa por el Saque Inicial y cobra $${GO_SALARY}.`);
    fx(state, "goal");
  }
  player.pos = tile;
}

function drawCard(state: GameState, deck: "var" | "fifa"): CardDef {
  const cards = deck === "var" ? VAR_CARDS : FIFA_CARDS;
  const pile = deck === "var" ? state.varDeck : state.fifaDeck;
  if (pile.length === 0) pile.push(...shuffled(cards.length));
  return cards[pile.shift()!];
}

function applyCard(state: GameState, player: PlayerState, card: CardDef, deckName: string): void {
  log(state, `${player.name} saca ${deckName}: ${card.text}`);
  fx(state, "card");
  const eff = card.effect;

  switch (eff.type) {
    case "goto":
      moveTo(state, player, eff.tile, true);
      resolveTile(state, player);
      return;
    case "gotojail":
      sendToJail(state, player);
      return;
    case "pardon":
      player.pardons += 1;
      state.phase = "manage";
      return;
    case "money":
      if (eff.amount >= 0) {
        player.money += eff.amount;
        state.phase = "manage";
        fx(state, "cash");
      } else if (charge(state, player, -eff.amount, null, "manage")) {
        state.phase = "manage";
      }
      return;
    case "each": {
      const others = activePlayers(state).filter((p) => p.name !== player.name);
      if (eff.amount >= 0) {
        // Cobra de cada uno (sin cascada de quiebras: paga lo que tenga).
        for (const other of others) {
          const paid = Math.min(other.money, eff.amount);
          other.money -= paid;
          player.money += paid;
        }
        fx(state, "cash");
        state.phase = "manage";
      } else {
        const total = -eff.amount * others.length;
        if (charge(state, player, total, null, "manage")) {
          for (const other of others) other.money += -eff.amount;
          state.phase = "manage";
        } else if (state.debt) {
          // Al saldar la deuda con la banca el reparto ya no se rehace: se
          // acepta la simplificacion (la banca redistribuye).
          for (const other of others) other.money += -eff.amount;
          state.debt.to = null;
        }
      }
      return;
    }
    case "repairs": {
      let total = 0;
      for (const [tileStr, own] of Object.entries(state.own)) {
        if (own.owner !== player.name) continue;
        void tileStr;
        if (own.houses === 5) total += eff.perHotel;
        else total += own.houses * eff.perHouse;
      }
      if (total === 0 || charge(state, player, total, null, "manage")) {
        if (total > 0) log(state, `${player.name} paga $${total} de reparaciones.`);
        state.phase = "manage";
      }
      return;
    }
    case "back":
      advance(state, player, -eff.steps);
      resolveTile(state, player);
      return;
    case "nearest": {
      const targets = eff.kind === "stadium" ? STADIUM_TILES : UTILITY_TILES;
      const next = targets.find((t) => t > player.pos) ?? targets[0];
      moveTo(state, player, next, true);
      resolveTile(state, player, eff.kind === "stadium" ? 2 : 10);
      return;
    }
  }
}

/**
 * Resuelve la casilla donde quedo el jugador de turno. rentMultiplier
 * viene de las tarjetas "avanza al mas cercano" (x2 estadio, 10x dados).
 */
function resolveTile(state: GameState, player: PlayerState, rentMultiplier = 1): void {
  const tile = TILES[player.pos];
  const diceTotal = state.dice ? state.dice[0] + state.dice[1] : 7;

  switch (tile.kind) {
    case "go":
    case "jail":
      state.phase = "manage";
      return;
    case "fanfest":
      log(state, `${player.name} disfruta del Fan Fest.`);
      state.phase = "manage";
      return;
    case "gotojail":
      sendToJail(state, player);
      return;
    case "tax":
      log(state, `${player.name} cae en ${tile.name} y paga $${tile.tax}.`);
      if (charge(state, player, tile.tax!, null, "manage")) state.phase = "manage";
      return;
    case "var":
      applyCard(state, player, drawCard(state, "var"), "una Tarjeta VAR");
      return;
    case "fifa":
      applyCard(state, player, drawCard(state, "fifa"), "una Tarjeta FIFA");
      return;
    case "street":
    case "stadium":
    case "utility": {
      const own = state.own[player.pos];
      if (!own) {
        state.buying = player.pos;
        state.phase = "buy";
        return;
      }
      if (own.owner === player.name || own.mortgaged) {
        state.phase = "manage";
        return;
      }
      let rent = rentFor(state, player.pos, diceTotal);
      if (tile.kind === "utility" && rentMultiplier === 10) rent = diceTotal * 10;
      else rent *= rentMultiplier === 2 && tile.kind === "stadium" ? 2 : 1;
      log(state, `${player.name} cae en ${tile.name} de ${own.owner} y debe $${rent} de entrada.`);
      if (charge(state, player, rent, own.owner, "manage")) state.phase = "manage";
      return;
    }
  }
}

/** Quiebra del jugador de turno: activos al acreedor o a la banca. */
function doBankrupt(state: GameState, player: PlayerState): void {
  const creditorName = state.debt?.to ?? null;
  const creditor = creditorName ? findPlayer(state, creditorName) : null;

  // Tribunas se liquidan a mitad de costo; el efectivo resultante (mas el que
  // tuviera) va al acreedor.
  let cash = player.money;
  for (const [tileStr, own] of Object.entries(state.own)) {
    if (own.owner !== player.name) continue;
    const idx = Number(tileStr);
    cash += own.houses * Math.floor((TILES[idx].houseCost ?? 0) / 2);
    own.houses = 0;
    if (creditor) {
      own.owner = creditor.name;
    } else {
      delete state.own[idx];
    }
  }
  if (creditor) {
    creditor.money += cash;
    creditor.pardons += player.pardons;
  }
  player.money = 0;
  player.pardons = 0;
  player.bankrupt = true;
  state.debt = null;
  log(state, `${player.name} quiebra${creditor ? ` y entrega todo a ${creditor.name}` : ""}. Queda eliminado del torneo.`);
  fx(state, "bankrupt");

  checkWinner(state);
  if (state.phase !== "over") endTurn(state, true);
}

function endTurn(state: GameState, force = false): void {
  const player = current(state);
  // Dobles: vuelve a tirar (salvo que haya ido preso o quebrado).
  if (!force && state.dice && state.dice[0] === state.dice[1] && !player.inJail && !player.bankrupt && state.doubles < 3) {
    state.phase = "roll";
    log(state, `${player.name} saco dobles y vuelve a tirar.`);
    return;
  }
  state.doubles = 0;
  state.dice = null;
  state.buying = null;
  let next = state.turn;
  for (let i = 0; i < state.players.length; i++) {
    next = (next + 1) % state.players.length;
    if (!state.players[next].bankrupt) break;
  }
  state.turn = next;
  state.phase = "roll";
  fx(state, "turn");
}

function tryBuild(state: GameState, player: PlayerState, tileIdx: number): void {
  const tile = TILES[tileIdx];
  const own = state.own[tileIdx];
  if (tile.kind !== "street" || !own || own.owner !== player.name || own.mortgaged) return;
  if (!ownsFullGroup(state, player.name, tile.group!)) return;
  const group = GROUP_TILES[tile.group!];
  if (group.some((i) => state.own[i]?.mortgaged)) return;
  if (own.houses >= 5) return;
  // Construccion pareja: no superar en mas de 1 al resto del grupo.
  const minHouses = Math.min(...group.map((i) => state.own[i]?.houses ?? 0));
  if (own.houses > minHouses) return;
  if (player.money < tile.houseCost!) return;

  player.money -= tile.houseCost!;
  own.houses += 1;
  log(state, own.houses === 5
    ? `${player.name} construye el estadio de ${tile.name}.`
    : `${player.name} construye una tribuna en ${tile.name} (${own.houses}).`);
  fx(state, "build");
}

function trySellHouse(state: GameState, player: PlayerState, tileIdx: number): void {
  const tile = TILES[tileIdx];
  const own = state.own[tileIdx];
  if (tile.kind !== "street" || !own || own.owner !== player.name || own.houses === 0) return;
  const group = GROUP_TILES[tile.group!];
  const maxHouses = Math.max(...group.map((i) => state.own[i]?.houses ?? 0));
  if (own.houses < maxHouses) return;

  own.houses -= 1;
  player.money += Math.floor(tile.houseCost! / 2);
  log(state, `${player.name} vende una tribuna de ${tile.name} por $${Math.floor(tile.houseCost! / 2)}.`);
  fx(state, "cash");
}

function tryMortgage(state: GameState, player: PlayerState, tileIdx: number): void {
  const tile = TILES[tileIdx];
  const own = state.own[tileIdx];
  if (!own || own.owner !== player.name || own.mortgaged || own.houses > 0) return;
  if (tile.kind === "street" && GROUP_TILES[tile.group!].some((i) => (state.own[i]?.houses ?? 0) > 0)) return;
  own.mortgaged = true;
  player.money += Math.floor((tile.price ?? 0) / 2);
  log(state, `${player.name} hipoteca ${tile.name} por $${Math.floor((tile.price ?? 0) / 2)}.`);
  fx(state, "cash");
}

function tryUnmortgage(state: GameState, player: PlayerState, tileIdx: number): void {
  const tile = TILES[tileIdx];
  const own = state.own[tileIdx];
  if (!own || own.owner !== player.name || !own.mortgaged) return;
  const cost = Math.ceil((Math.floor((tile.price ?? 0) / 2)) * 1.1);
  if (player.money < cost) return;
  player.money -= cost;
  own.mortgaged = false;
  log(state, `${player.name} levanta la hipoteca de ${tile.name} por $${cost}.`);
  fx(state, "cash");
}

/** Valida que un canje sea posible (propiedades sin tribunas, duenos correctos). */
export function tradeValid(state: GameState, offer: TradeOffer): boolean {
  const from = findPlayer(state, offer.from);
  const to = findPlayer(state, offer.to);
  if (!from || !to || from.bankrupt || to.bankrupt || from === to) return false;
  if (offer.giveMoney < 0 || offer.getMoney < 0) return false;
  if (offer.giveMoney > from.money || offer.getMoney > to.money) return false;
  if (offer.giveProps.length + offer.getProps.length + offer.giveMoney + offer.getMoney === 0) return false;
  const clean = (idx: number, owner: string) => {
    const own = state.own[idx];
    if (!own || own.owner !== owner || own.houses > 0) return false;
    const tile = TILES[idx];
    if (tile.kind === "street" && GROUP_TILES[tile.group!].some((i) => (state.own[i]?.houses ?? 0) > 0 && state.own[i]?.owner === owner)) return false;
    return true;
  };
  return offer.giveProps.every((i) => clean(i, offer.from)) && offer.getProps.every((i) => clean(i, offer.to));
}

function applyTrade(state: GameState, offer: TradeOffer): void {
  const from = findPlayer(state, offer.from)!;
  const to = findPlayer(state, offer.to)!;
  from.money += offer.getMoney - offer.giveMoney;
  to.money += offer.giveMoney - offer.getMoney;
  for (const idx of offer.giveProps) state.own[idx].owner = to.name;
  for (const idx of offer.getProps) state.own[idx].owner = from.name;
  log(state, `Canje cerrado entre ${from.name} y ${to.name}.`);
  fx(state, "cash");
}

/**
 * Punto de entrada unico del motor. `actor` es el nickname que pide la accion;
 * se ignoran acciones de quien no corresponde (anti-trampa barata en online).
 */
export function applyAction(state: GameState, actor: string, action: Action): void {
  if (state.phase === "over") return;
  const player = current(state);

  // El canje pendiente lo responde el destinatario, no el jugador de turno.
  if (action.type === "tradeAccept" || action.type === "tradeReject") {
    const trade = state.trade;
    if (!trade || trade.to !== actor) return;
    state.trade = null;
    if (action.type === "tradeAccept" && tradeValid(state, trade)) {
      applyTrade(state, trade);
    } else {
      log(state, `${trade.to} rechaza el canje de ${trade.from}.`);
    }
    return;
  }
  if (action.type === "tradeCancel") {
    if (state.trade && state.trade.from === actor) {
      log(state, `${actor} retira su oferta de canje.`);
      state.trade = null;
    }
    return;
  }

  if (actor !== player.name || player.bankrupt) return;

  switch (action.type) {
    case "roll": {
      if (state.phase !== "roll") return;
      const d1 = 1 + Math.floor(Math.random() * 6);
      const d2 = 1 + Math.floor(Math.random() * 6);
      state.dice = [d1, d2];
      fx(state, "dice");

      if (player.inJail) {
        if (d1 === d2) {
          player.inJail = false;
          player.jailTurns = 0;
          log(state, `${player.name} saca dobles (${d1}-${d2}) y sale del Vestuario.`);
          state.doubles = 0; // salir con dobles no repite tiro
          advance(state, player, d1 + d2);
          resolveTile(state, player);
        } else {
          player.jailTurns += 1;
          if (player.jailTurns >= 3) {
            log(state, `${player.name} falla el tercer intento (${d1}-${d2}) y paga la multa de $${JAIL_FINE}.`);
            if (charge(state, player, JAIL_FINE, null, "manage")) {
              player.inJail = false;
              player.jailTurns = 0;
              advance(state, player, d1 + d2);
              resolveTile(state, player);
            } else {
              // La deuda se resuelve y despues sigue suspendido saliendo:
              // simplificacion: al pagar la deuda queda libre en manage.
              player.inJail = false;
              player.jailTurns = 0;
            }
          } else {
            log(state, `${player.name} no saca dobles (${d1}-${d2}) y sigue suspendido (intento ${player.jailTurns}/3).`);
            state.phase = "manage";
          }
        }
        return;
      }

      state.doubles = d1 === d2 ? state.doubles + 1 : 0;
      if (state.doubles >= 3) {
        log(state, `${player.name} saca dobles por tercera vez (${d1}-${d2}): tarjeta roja por exceso de velocidad.`);
        sendToJail(state, player);
        return;
      }
      log(state, `${player.name} tira ${d1}-${d2} y avanza ${d1 + d2}.`);
      advance(state, player, d1 + d2);
      resolveTile(state, player);
      return;
    }

    case "payJail": {
      if (state.phase !== "roll" || !player.inJail || player.money < JAIL_FINE) return;
      player.money -= JAIL_FINE;
      player.inJail = false;
      player.jailTurns = 0;
      log(state, `${player.name} paga la multa de $${JAIL_FINE} y queda habilitado.`);
      fx(state, "cash");
      return;
    }

    case "usePardon": {
      if (state.phase !== "roll" || !player.inJail || player.pardons === 0) return;
      player.pardons -= 1;
      player.inJail = false;
      player.jailTurns = 0;
      log(state, `${player.name} usa su apelacion ganada y queda habilitado.`);
      fx(state, "card");
      return;
    }

    case "buy": {
      if (state.phase !== "buy" || state.buying === null) return;
      const tile = TILES[state.buying];
      if (player.money < (tile.price ?? 0)) return;
      player.money -= tile.price!;
      state.own[state.buying] = { owner: player.name, houses: 0, mortgaged: false } satisfies TileOwnership;
      log(state, `${player.name} ficha ${tile.name} por $${tile.price}.`);
      fx(state, "buy");
      state.buying = null;
      state.phase = "manage";
      return;
    }

    case "skip": {
      if (state.phase !== "buy") return;
      log(state, `${player.name} deja pasar ${TILES[state.buying!].name}.`);
      state.buying = null;
      state.phase = "manage";
      return;
    }

    case "build":
      if (state.phase !== "roll" && state.phase !== "manage") return;
      tryBuild(state, player, action.tile);
      return;
    case "sellHouse":
      if (state.phase !== "roll" && state.phase !== "manage" && state.phase !== "debt") return;
      trySellHouse(state, player, action.tile);
      return;
    case "mortgage":
      if (state.phase !== "roll" && state.phase !== "manage" && state.phase !== "debt") return;
      tryMortgage(state, player, action.tile);
      return;
    case "unmortgage":
      if (state.phase !== "roll" && state.phase !== "manage") return;
      tryUnmortgage(state, player, action.tile);
      return;

    case "payDebt": {
      if (state.phase !== "debt" || !state.debt) return;
      const debt = state.debt;
      if (player.money < debt.amount) return;
      player.money -= debt.amount;
      if (debt.to) {
        const creditor = findPlayer(state, debt.to);
        if (creditor) creditor.money += debt.amount;
      }
      log(state, `${player.name} salda su deuda de $${debt.amount}.`);
      fx(state, "cash");
      state.debt = null;
      state.phase = debt.resume;
      return;
    }

    case "bankrupt": {
      if (state.phase !== "debt") return;
      doBankrupt(state, player);
      return;
    }

    case "trade": {
      if ((state.phase !== "roll" && state.phase !== "manage") || state.trade) return;
      if (action.offer.from !== player.name) return;
      if (!tradeValid(state, action.offer)) return;
      state.trade = action.offer;
      log(state, `${player.name} ofrece un canje a ${action.offer.to}.`);
      fx(state, "card");
      return;
    }

    case "end":
      if (state.phase !== "manage") return;
      if (state.trade && state.trade.from === player.name) state.trade = null;
      endTurn(state);
      return;
  }
}

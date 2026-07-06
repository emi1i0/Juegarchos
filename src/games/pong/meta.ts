import type { GameEntry } from "../../games";

export const meta: GameEntry = {
  id: "pong",
  title: "PONG",
  description: "Pong clasico de un solo jugador: devuelve la pelota con tu paleta, la velocidad aumenta y solo tenes una vida.",
  path: "/games/pong/",
  controls: "Flechas o W/S para mover la paleta.",
  accent: "#ffffff",
  category: "Arcade",
  order: 220,
  // Fuera del modo sala (sigue jugable en la landing).
  roomsHidden: true,
};

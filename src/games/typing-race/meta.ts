import type { GameEntry } from "../../games";
import type { GameScoring } from "../../shared/scoring-core";

export const meta: GameEntry = {
  id: "typing-race",
  title: "Final Sentence",
  description:
    "Thriller de mecanografia: un revolver en la sien y cada error carga una bala. Escribi las frases sin fallar y sobrevivi la ruleta. Solo uno queda en pie.",
  path: "/games/typing-race/",
  accent: "#c1121f",
  category: "Reflejos",
  order: 270,
};

/**
 * Puntaje = frases superadas (mayor = mejor). Se usa una variante propia
 * ("survival") para que el ranking arranque limpio y no se mezcle con los
 * puntajes de PPM del juego anterior (otra escala, otra metrica).
 */
export const scoring: GameScoring = {
  direction: "higher",
  variants: ["survival"],
  variantLabel: () => "Supervivencia",
  format: (n) => `${n} ${n === 1 ? "frase" : "frases"}`,
};

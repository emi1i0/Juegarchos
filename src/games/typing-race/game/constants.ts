export const BEST_KEY = "final-sentence:best"; // score = frases superadas

export const COUNTDOWN_LABELS = ["3", "2", "1", "YA"];
export const COUNTDOWN_STEP = 0.75; // seconds
export const MAX_DT = 0.1; // capping delta time to avoid jumps on tab blur

/** El revolver tiene 6 recamaras. Balas cargadas / 6 = probabilidad de morir. */
export const CHAMBERS = 6;
/** Recamara vacia tras una frase perfecta (alivio). */
export const CLEAN_SENTENCE_RELIEF = 1;
/** Penalidad si se acaba el tiempo con la frase incompleta. */
export const TIMEOUT_BULLETS = 2;

/** Tiempo por frase = (base + chars * porChar) escalado por la presion de la ronda. */
export const TIME_BASE = 2.4;
export const TIME_PER_CHAR = 0.42;
/** Cada ronda aprieta el tiempo un poco (piso en PRESSURE_FLOOR). */
export const ROUND_PRESSURE = 0.028;
export const PRESSURE_FLOOR = 0.58;
export const TIME_MIN = 4;

/** Presos al empezar (ambiente battle royale). Rango tipo sala real. */
export const SURVIVORS_MIN = 58;
export const SURVIVORS_MAX = 99;

/**
 * Frases objetivo por nivel de dificultad. Sin tildes ni enie ni signos, en
 * minusculas, para que cualquier teclado pueda escribirlas y el modelo de
 * tecleo sea un simple char-a-char. Van creciendo en largo y aspereza. El
 * tono es el del thriller de supervivencia (hangar, revolver, cuenta atras).
 */
export const SENTENCE_TIERS: readonly (readonly string[])[] = [
  // Nivel 1 (rondas 1-3): cortas.
  [
    "te despiertas en el hangar oscuro",
    "hay un arma contra tu cabeza",
    "escribe rapido o vas a morir",
    "el guardia enmascarado no dice nada",
    "una sola bala espera en el tambor",
    "no hay salida de esta sala",
    "cada error carga otra bala",
    "el metal frio toca tu sien",
    "respira hondo y sigue escribiendo",
    "solo uno saldra vivo de aqui",
    "tus dedos tiemblan sobre las teclas",
    "el silencio pesa mas que el plomo",
  ],
  // Nivel 2 (rondas 4-7): medianas.
  [
    "la maquina de escribir cruje bajo la luz amarilla del techo",
    "los disparos lejanos marcan la caida de otro jugador nervioso",
    "no queda tiempo para pensar solo para escribir sin fallar",
    "el sudor cae por tu frente mientras el reloj rojo avanza",
    "un clic seco resuena y por ahora sigues con vida",
    "el hangar huele a aceite oxido y a miedo muy antiguo",
    "manten la calma o el gatillo va a hablar por vos",
    "cada frase es mas larga que la sentencia anterior",
    "los gritos de los otros se apagan uno por uno",
    "no bajes la mirada del papel ni un solo instante",
  ],
  // Nivel 3 (rondas 8-12): largas.
  [
    "la unica arma que te queda son las palabras precisas que logres teclear a tiempo",
    "el canon del revolver sigue cada letra que escribes con una paciencia cruel y callada",
    "no hay segundas oportunidades ni vendas ni piedad para el que se equivoca de nuevo",
    "el temporizador rojo late en la pared como un corazon a punto de estallar",
    "mientras mas rapido escribes mas cerca suena el metal del percutor detras tuyo",
    "los prisioneros que fallan caen al piso frio sin un solo lamento que valga la pena",
    "tu sentencia depende de la velocidad de tus manos y de una suerte que se agota",
  ],
  // Nivel 4 (rondas 13+): brutales.
  [
    "en un mundo saturado de disparos y explosiones aqui el arma mas peligrosa es tu propia falta de precision al teclear",
    "el eco de cada gatillo vacio te recuerda que la proxima bala podria ser la que termine con tu larga condena",
    "ninguna zona segura ninguna cura ningun escondite solo vos la maquina y el revolver que decide si mereces seguir respirando",
    "la atmosfera opresiva del hangar convierte cada tecla en una apuesta silenciosa entre la vida rapida y la muerte lenta",
  ],
];

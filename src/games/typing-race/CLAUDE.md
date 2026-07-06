# Final Sentence (typing-race)

Thriller de mecanografia de supervivencia. Despertas en un hangar oscuro con un revolver en la sien: escribi cada frase sin fallar porque **cada tecla equivocada carga una bala en el tambor**. Al terminar (o al vencerse el tiempo de) cada frase se jala el gatillo — una ruleta rusa con probabilidad de morir = balas/6. Sobrevivis o caes. El puntaje es **frases superadas** (mayor = mejor). Ambiente battle royale: un contador de "vivos" que baja con disparos lejanos mientras avanzas.

> El id del juego sigue siendo `typing-race` (por la URL, el registro y el ranking); solo cambio el concepto. Antes era "Mecano", un sprint de 30s por PPM.

## Module layout

- `main.ts` — entry point, monta `Game` en `#app`.
- `game/Game.ts` — maquina de estados (`ready | countdown | playing | roulette | gameOver`), tecleo estricto, timer por frase, revolver/ruleta, battle royale virtual y persistencia del mejor puntaje.
- `game/Hud.ts` — DOM: barra de estado (vivos / sentencia / superadas), el **revolver SVG** (tambor de 6 recamaras que se llenan de laton), la frase con feedback por caracter, la barra de tiempo, los momentos de gatillo/clic/muerte, overlays y el panel de ranking.
- `game/SoundEffects.ts` — Web Audio sintetizado (sin assets): tecla, bala que entra, giro del tambor, clic del percutor (alivio), disparo (muerte) y disparos lejanos (otros presos que caen).
- `game/constants.ts` — frases por nivel de dificultad (`SENTENCE_TIERS`) y todos los parametros (tambor, timer por frase, presos iniciales, alivio por frase perfecta).
- `style.css` — estetica de hangar de acero: cono de luz cenital, grano de pelicula, vineta, acento carmesi sangre; tipografia de maquina de escribir (Special Elite) + condensada (Oswald) + monospace (Courier Prime).

## Como funciona

1. **Countdown**: Enter arranca el 3 / 2 / 1 / YA. La primera frase ya se ve detras de la cuenta.
2. **Tecleo estricto** (sin backspace): se avanza solo al teclear el caracter correcto; una tecla equivocada NO avanza y **carga una bala** (`chamber++`, tope 6), con sacudida roja y golpe del revolver. Los espacios se teclean como un caracter mas.
3. **Timer por frase**: `TIME_BASE + chars * TIME_PER_CHAR`, apretado por ronda (`ROUND_PRESSURE`, piso `PRESSURE_FLOOR`). Si se agota con la frase incompleta se fuerza el gatillo con `TIMEOUT_BULLETS` de castigo.
4. **Gatillo (ruleta)**: al completar/vencer la frase, estado `roulette`: gira el tambor (`TRIGGER_SUSPENSE_MS`) y se resuelve `random() < chamber/6`. Muerte -> disparo + fogonazo + `gameOver`. Sobrevive -> `*CLIC*`, `frases++` (solo si completo), y una frase perfecta **vacia una recamara** (`CLEAN_SENTENCE_RELIEF`).
5. **Battle royale virtual** (`updateSurvivors`): arranca con `SURVIVORS_MIN..MAX` presos (incluyendote) y cada ronda caen algunos con disparos lejanos; nunca baja de 1 (vos). Llegar a 1 = "ULTIMO EN PIE". El puesto al morir es `survivors` (o 1 si fuiste el ultimo).

## Puntaje y ranking

- **Puntaje = frases superadas** (`direction: "higher"`). Se envia bajo la variante `"survival"` declarada en `meta.ts` para **no mezclarse con los puntajes de PPM** del juego anterior (otra escala): un tablero limpio. La landing lo lee via `scoring.variants[0]` sin mostrar selector (una sola variante).
- Solo: `endGame()` llama `hud.showRanking("typing-race", frases, "survival")`. Mejor local en `final-sentence:best` (clave nueva, no la de PPM).

## Modo sala (multiplayer)

Cableado al modo party compartido: `initRoomMode("typing-race", { getScore: () => this.frases, onStart: () => this.beginCountdown() })`. Con `?room=` la condena reporta las frases superadas a la sala en vez del ranking global, el Enter-para-reintentar queda bloqueado (una condena por ronda) y todos arrancan juntos via `onStart`. El parcial por timeout de sala son las frases superadas hasta el momento (`getScore`).

## Decisiones no obvias

- **Frases sin tildes, enie ni signos**, en minusculas: cualquier teclado puede escribirlas y el modelo de tecleo es un simple char-a-char (mismo criterio que el pool de palabras anterior). Gotcha historico: un espacio duro (U+00A0) en el texto rompe el match contra la barra espaciadora (que envia U+0020) — mantener espacios normales.
- **Modelo estricto sin backspace**: liga precision con peligro (cada error ya cargo su bala; no se puede "des-errar") y evita manejar buffer/borrado. El caret vive en `fs-char--current`.
- **La ruleta se dramatiza con timeouts** (`TRIGGER_SUSPENSE_MS` / `DEATH_HOLD_MS` / `SURVIVE_HOLD_MS`), no en el frame loop; el `update()` solo maneja countdown y el timer de `playing`.
- **El battle royale es ambiente**, no red real: los presos que caen son un decaimiento local con sonido. El multiplayer de verdad es el modo sala (por rondas), no un BR en vivo.

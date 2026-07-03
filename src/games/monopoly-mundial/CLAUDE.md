# Mundialopoly 2026 (monopoly-mundial)

Monopoly clasico retematizado como Mundial 2026 (Mexico / EE.UU. / Canada). DOM puro (sin canvas ni Three.js): tablero CSS grid 11x11 + panel lateral con jugadores, acciones e historial, calcado del Monopoly de consola que el usuario paso como referencia.

## Tematica (mapeo 1:1 con el tablero clasico)

- Calles = selecciones agrupadas por color (marron Nueva Zelanda/Panama ... azul Brasil/Argentina, que es Boardwalk). Precios y rentas identicos al Monopoly original.
- Ferrocarriles = estadios sede: Azteca, SoFi, AT&T, MetLife (renta 25/50/100/200).
- Servicios = Cabina VAR y Transmision TV (4x/10x dados).
- Suerte = Tarjeta VAR, Arca Comunal = Tarjeta FIFA (mazos en `constants.ts`, con guinos al album Panini: cromos dorados, completar el album).
- Carcel = Vestuario (suspension), Ir a la carcel = Tarjeta Roja, Parking = Fan Fest, GO = Saque Inicial ($200).
- Casas = tribunas (T en la casilla), hotel = estadio completo (EST). Salir de la carcel gratis = "Apelacion ganada" (`pardons`).

## Arquitectura

- `game/engine.ts` - motor de reglas puro y host-autoritativo: `createGame` + `applyAction(state, actor, action)` muta el `GameState` y emite `log` + `fx` (cola de efectos con seq; los clientes reproducen los que no vieron). Sin DOM ni red.
- `game/Bot.ts` - IA por dificultad (`debutante`/`profesional`/`campeon`, equivalente a First Time Buyer/Entrepreneur/Tycoon): reserva de efectivo y agresividad compradora; liquida activos ante deudas; evalua canjes por valor percibido (propiedad que completa grupo vale x2).
- `game/Game.ts` - orquestador. Modo solitario: humano + 1-7 bots (una accion de bot cada ~950 ms). Modo sala (`?room=`): el host corre el motor y difunde el `GameState` entero por broadcast (`MonopolyChannel`, patron ArenaChannel); los clientes solo mandan acciones. El host auto-juega con logica de bot al jugador que supere `TURN_TIMEOUT_MS` (30 s) sin actuar, asi una desconexion no cuelga la partida.
- `game/Hud.ts` - todo el DOM: tablero, fichas, panel de jugadores, botonera contextual por fase, historial con reloj, modales (ficha de propiedad con construir/hipotecar, compra, canje, reglas paginadas estilo manual de consola) y overlays. `showRanking` monta `LeaderboardPanel`.
- `game/audio.ts` - SFX 100% procedurales con Web Audio (patron de audio de la skill threejs-gameplay-systems: el motor emite eventos fx, este modulo los sintetiza). Mute en localStorage `mg:monopoly-mundial:mute`.
- `game/Dice3D.ts` - dados 3D con Three.js (unica pieza 3D del juego, DOM en lo demas). Overlay de canvas transparente sobre el centro; fisica de caja simulada a mano (gravedad + rebotes + slerp de asentado), NO Rapier. Caras generadas con canvas 2D (sin assets). Se apaga al asentarse (ultimo frame queda pintado, `preserveDrawingBuffer`). El Hud detecta una tirada nueva por el `seq` del fx "dice" (valores iguales en tiradas distintas no confunden) y llama `roll(d1,d2)`; `showStatic` es idempotente (guarda `shownKey`) para no saltar en re-renders; si WebGL no arranca cae al render DOM `.die`. Mapeo valor→cara: BoxGeometry grupos +X/-X/+Y/-Y/+Z/-Z = 3/4/1/6/2/5, y `baseQuat(v)` rota la cara `v` a +Y. Suena `sfx.diceTap` en cada rebote.

## Reglas: fidelidad y simplificaciones deliberadas

Sigue el reglamento oficial en espanol (dobles, 3 dobles = roja, vestuario con 3 intentos y multa forzada al tercero, construccion pareja, hipotecas al 50% + 10% para levantar, renta doble con grupo completo sin tribunas, bancarrota con transferencia al acreedor). Simplificaciones documentadas:

- Sin subastas: la propiedad rechazada queda en la banca.
- Sin tope de 32 casas / 12 hoteles de la banca.
- Canjes solo de propiedades sin tribunas + efectivo (no se canjean apelaciones); sin interes del 10% al recibir hipotecadas.
- En quiebras las tribunas se liquidan a mitad de costo y el efectivo va al acreedor.

## Puntaje

Score = patrimonio (`netWorth`: efectivo + precio de propiedades, hipotecadas al 50%, + costo de tribunas). Ranking global `higher`; best local en `mg:monopoly-mundial:best`. En salas el parcial por timeout reporta el patrimonio del momento, asi la ronda corta de las salas (60-180 s) tiene ganador igual.

## Arte

`PROMPTS.md` (en esta carpeta) tiene el pack completo de prompts de IA. Los archivos van a `public/monopoly/` (portada en `public/covers/monopoly-mundial.jpg`). Cableado: `TILE_ART` en `Hud.ts` mapea indice de casilla a imagen (VAR/FIFA se resuelven por kind) y agrega la clase `tile-art` (arte a sangre + nombre en pastilla); `bg.jpg` y `board-center.jpg` van por CSS en `style.css`. Los PNG del pack vinieron con fondo pintado (no transparente), por eso se usan como fondo cover y no como icono suelto.

Los escudos de seleccion se generan con la **bandera real del pais** flameando de fondo + escudo generico de fantasia (las banderas son dominio publico; los escudos oficiales de federacion no se imitan). Formato de casilla: vertical 2:3 a sangre completa, sujeto centrado (las casillas laterales recortan arriba/abajo). Los archivos con extension se guardan en `TILE_ART` con extension incluida (jpg para arte opaco comprimido, png para las esquinas).

**Ya generado y cableado**: portada, bg, board-center, 4 esquinas, icon-var/fifa/tasa/fichaje, los 4 estadios (azteca/sofi/att/metlife) y 7 selecciones (nueva-zelanda, panama, japon, corea, australia, marruecos, eeuu). **Pendiente**: icon-cabina, icon-tv, 15 escudos de seleccion restantes, 8 fichas token, 2 dorsos de tarjeta, hero del setup. Al llegar cada archivo, agregar su indice a `TILE_ART` (no pre-mapear archivos inexistentes: el 404 silencioso deja la casilla con pastilla blanca sobre fondo crema).

## Gotchas

- El estado viaja entero por broadcast en cada cambio (~pocos KB): no agregar campos gigantes al `GameState`.
- Si el host online se va, no hay migracion del motor: el resto queda esperando y la ronda muere por el deadline de la sala (roomMode reporta parciales). Aceptado por ahora.
- Los jugadores de la sala por encima de 8 no entran a la partida (se toman los primeros 8 por orden de ingreso).
- El countdown 3/2/1/YA es obligatorio en ambos modos; en online lo dispara el evento `go` del host y los clientes bufferizan el primer estado hasta terminarlo.

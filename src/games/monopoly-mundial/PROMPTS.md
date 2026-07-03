# Mundialopoly 2026 — Prompts del pack de arte

Prompts para generar con IA todas las imagenes del juego. Cada bloque se copia
y pega tal cual en el generador. Convenciones:

- **Guardar cada archivo con el nombre indicado.** La portada va en
  `public/covers/`; todo lo demas en `public/monopoly/` (crear la carpeta).
- El arte de casillas (secciones 4, 5 y 6) va como **escena pintada completa**
  (sin transparencia: se usa como fondo de la casilla). Solo las **fichas**
  (seccion 7) conviene pedirlas con fondo transparente o liso para recortar.
  Los fondos y la portada van en JPG; el resto en PNG.
- Tamanos: iconos de casillas, estadios y escudos **1024x1536 (vertical 2:3,
  como la forma de la casilla)**, fichas **512x512**, esquinas **768x768
  (cuadradas: las 4 esquinas del tablero son cuadradas)**, centro del tablero
  **1024x1024**, fondo de pantalla **1920x1080**, portada **1024x1024**,
  tarjetas **768x1024** (vertical).
- **Importante para el arte de casillas (secciones 4, 5 y 6):** la imagen se
  usa como fondo completo de la casilla con recorte automatico. Las casillas
  de las filas de arriba/abajo son verticales, pero las de los laterales son
  horizontales y recortan la parte superior e inferior: el sujeto principal
  tiene que estar **grande y centrado**, con la escena pintada de borde a
  borde (nada de sticker flotando sobre fondo vacio).
- Si un prompt con texto sale con letras deformadas, regenerar 2-3 veces.
- Todavia nada esta cableado al codigo: cuando esten los archivos se integran
  (avisar y se agregan los estilos que los usan).

## Estilo base compartido

Todos los prompts ya vienen completos. Este bloque se documenta solo por si
hay que inventar una pieza nueva del pack; para arte de casilla agregarle la
frase de formato vertical: "Vertical portrait 2:3 aspect ratio, full-bleed
scene painted edge to edge with no empty margins, main subject large and
perfectly centered so the outer edges can be safely cropped."

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, FIFA World Cup 2026 festival mood, high detail, no text, no watermark.
```

---

## 1. Portada (landing) — guardar como `covers/monopoly-mundial.jpg`

```text
Square 1:1 video game cover art, bold indie game key art style, vibrant saturated colors, dramatic lighting, clean composition with a strong focal subject, slight retro-arcade flavor, high detail digital illustration, no watermark, no borders. Top-down tilted view of a Monopoly-style board game themed on the 2026 football World Cup: a green football-pitch game board with colorful property tiles around the edge, a golden World Cup trophy standing in the center, two white dice mid-roll, small metallic game tokens shaped like a football boot and a whistle, confetti in green, red and blue falling, stadium floodlights glowing behind, festive Mexico USA Canada atmosphere. The game title "MUNDIALOPOLY" is integrated into the artwork as a bold stylized videogame logo, large and readable, spelled exactly "MUNDIALOPOLY", with a smaller golden "2026" below it.
```

## 2. Fondos

### Centro del tablero — guardar como `monopoly/board-center.jpg`

Se usa como fondo del area central (hoy hay un cesped a rayas hecho en CSS).
Debe ser sutil: la marca, los dados y los avisos van encima.

```text
Stylized top-down view of a football stadium pitch for a board game center, soft green grass with subtle mowing stripes and a faint center circle, very subtle warm floodlight glow entering from the four corners, gentle vignette, muted flat illustration style, calm and clean so UI elements can sit on top, no players, no text, no watermark.
```

### Fondo de pantalla — guardar como `monopoly/bg.jpg`

Detras del tablero y el panel (hoy es un gradiente oscuro). Oscuro para que la
UI no compita.

```text
Dark moody wide background of a football stadium at night seen from high in the stands, bokeh floodlights, faint silhouettes of a huge crowd, deep green and teal tones with a hint of gold, heavy vignette, out of focus, cinematic, suitable as a subtle UI background, no text, no watermark, 16:9.
```

## 3. Esquinas del tablero (768x768, fondo transparente o blanco)

### Saque Inicial — guardar como `monopoly/corner-saque.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark, isolated on transparent background. A white football sitting on the center spot of a green pitch ready for kickoff, a bold red arrow curving around it pointing forward, small golden dollar-style coins floating above, energetic kickoff mood, square composition.
```

### Vestuario (carcel) — guardar como `monopoly/corner-vestuario.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark, isolated on transparent background. A moody football locker room bench seen straight on, hanging jerseys and a duffel bag, vertical shadow bars across the scene like cell bars made of stadium light, a sad deflated football sitting on the bench, square composition.
```

### Fan Fest (parking gratuito) — guardar como `monopoly/corner-fanfest.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark, isolated on transparent background. A festive fan fest scene: colorful bunting flags, a big screen silhouette, confetti, foam hands and scarves raised, vuvuzelas, green red and blue party colors, joyful celebration mood, square composition.
```

### Tarjeta Roja (ir a la carcel) — guardar como `monopoly/corner-roja.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark, isolated on transparent background. A referee hand dramatically raising a bright red card, radial burst lines behind it, a silver whistle swinging below the wrist, intense dramatic mood, square composition.
```

## 4. Casillas especiales (1024x1536, vertical 2:3, escena a sangre completa)

### Tarjeta VAR (suerte) — guardar como `monopoly/icon-var.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed scene painted edge to edge with no empty margins, main subject large and perfectly centered so the outer edges can be safely cropped. A big glowing orange question mark shaped like a VAR replay monitor with a play button dot, floating over a dark teal video-replay room background full of subtle screens and signal waves, orange and dark teal palette.
```

### Tarjeta FIFA (arca comunal) — guardar como `monopoly/icon-fifa.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed scene painted edge to edge with no empty margins, main subject large and perfectly centered so the outer edges can be safely cropped. An open golden trophy chest overflowing with football cards, medals and golden coins, a small golden football on top, deep royal blue background with golden light rays and floating sparkles, blue and gold palette.
```

### Tasa FIFA (impuesto) — guardar como `monopoly/icon-tasa.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed scene painted edge to edge with no empty margins, main subject large and perfectly centered so the outer edges can be safely cropped. A strict rubber stamp stamping a fine document with red ink, football federation seal on the stamp, coins flying away, an office desk covered in paperwork filling the whole background, bureaucratic penalty mood.
```

### Fichaje Galactico (impuesto de lujo) — guardar como `monopoly/icon-fichaje.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed scene painted edge to edge with no empty margins, main subject large and perfectly centered so the outer edges can be safely cropped. A luxurious golden fountain pen signing a glowing transfer contract, a sparkling diamond above it, dark velvet background bathed in golden light rays and camera flashes, expensive superstar signing mood.
```

### Cabina VAR (servicio) — guardar como `monopoly/icon-cabina.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed scene painted edge to edge with no empty margins, main subject large and perfectly centered so the outer edges can be safely cropped. A VAR referee booth with a big central monitor showing a football pitch and two smaller screens, headset resting on the desk, glowing screens lighting a dark control room that fills the whole frame, teal and orange palette.
```

### Transmision TV (servicio) — guardar como `monopoly/icon-tv.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed scene painted edge to edge with no empty margins, main subject large and perfectly centered so the outer edges can be safely cropped. A big broadcast TV camera on a tripod filming with a glowing red REC light, satellite signal waves coming out of the lens, night stadium bokeh lights filling the whole background, dark blue and red palette.
```

## 5. Estadios sede (1024x1536, vertical 2:3, escena a sangre completa)

### Estadio Azteca — guardar como `monopoly/estadio-azteca.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed scene painted edge to edge with no empty margins, main subject large and perfectly centered so the outer edges can be safely cropped. The iconic Estadio Azteca of Mexico City seen from a low three-quarter angle, massive concrete oval bowl with its characteristic roof ring, warm sunset sky filling the frame, small Mexican papel picado flags at the bottom, green and red accents.
```

### SoFi Stadium — guardar como `monopoly/estadio-sofi.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed scene painted edge to edge with no empty margins, main subject large and perfectly centered so the outer edges can be safely cropped. A futuristic Los Angeles stadium inspired by SoFi Stadium: sweeping translucent curved roof, glowing interior, palm tree silhouettes at the bottom, sunset gradient sky filling the frame, purple and orange California palette.
```

### AT&T Stadium — guardar como `monopoly/estadio-att.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed scene painted edge to edge with no empty margins, main subject large and perfectly centered so the outer edges can be safely cropped. A colossal Texas stadium inspired by AT&T Stadium in Arlington: giant glass arch structure, huge retractable roof, monumental scale, bright daylight sky filling the frame, steel blue and silver palette.
```

### MetLife (sede de la final) — guardar como `monopoly/estadio-metlife.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed scene painted edge to edge with no empty margins, main subject large and perfectly centered so the outer edges can be safely cropped. A grand New York New Jersey stadium inspired by MetLife Stadium at night hosting a World Cup final: outer lattice glowing golden, fireworks bursting in the dark blue night sky above, golden confetti falling, the most important match of the tournament mood.
```

## 6. Escudos de las selecciones (1024x1536, vertical 2:3, escena a sangre completa)

Son las 22 "calles". El escudo es generico de fantasia (NO usar escudos
oficiales de federaciones), pero el fondo de cada casilla es la **bandera
real del pais** flameando, asi cada seleccion se reconoce de un vistazo en
el tablero. Cada prompt ya viene completo: copiar el bloque entero.

### Nueva Zelanda — guardar como `monopoly/sel-nueva-zelanda.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of New Zealand waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Black and white shield with a silver fern leaf motif and a small kiwi bird silhouette.
```

### Panama — guardar como `monopoly/sel-panama.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Panama waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Shield quartered in red, white and blue with two stars and a small isthmus wave motif.
```

### Japon — guardar como `monopoly/sel-japon.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Japan waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. White shield with a bold red rising sun circle and a stylized origami crane.
```

### Corea del Sur — guardar como `monopoly/sel-corea.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of South Korea waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. White shield with a red and blue taegeuk-inspired swirl and a fierce tiger head.
```

### Australia — guardar como `monopoly/sel-australia.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Australia waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Green and gold shield with a leaping kangaroo silhouette and the southern cross stars.
```

### Marruecos — guardar como `monopoly/sel-marruecos.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Morocco waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Red shield with a green five-pointed star and intricate Moorish geometric border.
```

### Senegal — guardar como `monopoly/sel-senegal.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Senegal waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Green yellow and red shield with a roaring lion head and a single green star.
```

### Egipto — guardar como `monopoly/sel-egipto.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Egypt waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Red white and black shield with a golden eagle inspired bird and a small pyramid.
```

### Canada — guardar como `monopoly/sel-canada.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Canada waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Red and white shield with a bold red maple leaf and two small crossed football boots below it.
```

### Mexico — guardar como `monopoly/sel-mexico.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Mexico waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Green white and red shield with an eagle holding a snake standing on a cactus, Aztec pattern border.
```

### Estados Unidos — guardar como `monopoly/sel-eeuu.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of the United States waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Stars and stripes shield, navy blue top with white stars over red and white stripes, bald eagle head.
```

### Uruguay — guardar como `monopoly/sel-uruguay.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Uruguay waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Sky blue shield with a golden radiant sun with a face in the center and four subtle stars.
```

### Colombia — guardar como `monopoly/sel-colombia.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Colombia waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Yellow blue and red shield with a condor with spread wings on top.
```

### Ecuador — guardar como `monopoly/sel-ecuador.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Ecuador waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Yellow blue and red shield with a snow-capped volcano and an Andean condor.
```

### Portugal — guardar como `monopoly/sel-portugal.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Portugal waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Deep red and green shield with an armillary sphere and a small cross of blue shields.
```

### Paises Bajos — guardar como `monopoly/sel-paises-bajos.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of the Netherlands waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Bright orange shield with a rampant golden lion and a small tulip at the base.
```

### Italia — guardar como `monopoly/sel-italia.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Italy waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Azure blue shield with golden laurel branches and a green white and red ribbon at the base.
```

### Inglaterra — guardar como `monopoly/sel-inglaterra.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of England waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. White shield with a red cross and three stylized blue lions.
```

### Alemania — guardar como `monopoly/sel-alemania.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Germany waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Black red and gold shield with a bold black eagle with geometric wings.
```

### Espana — guardar como `monopoly/sel-espana.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Spain waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base and two tiny stars on top, NOT an official federation logo, generic original design. Red and yellow shield with a golden castle tower and a rampant lion, crown on top.
```

### Brasil — guardar como `monopoly/sel-brasil.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Brazil waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge shaped as a rounded diamond, NOT an official federation logo, generic original design. Green and yellow rounded diamond crest with a blue globe band across the middle and five golden stars on top, small football at the base.
```

### Argentina — guardar como `monopoly/sel-argentina.png`

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark. Vertical portrait 2:3 aspect ratio, full-bleed composition painted edge to edge with no empty margins, the crest large and perfectly centered so the outer edges can be safely cropped. The real national flag of Argentina waving and filling the entire background behind the crest, with a soft golden glow around the badge. A fantasy football team crest badge in classic shield shape with a small football at its base, NOT an official federation logo, generic original design. Sky blue and white vertically striped shield with a golden radiant sun in the center and three golden stars on top, laurel wreath around the shield.
```
## 7. Fichas de los jugadores (512x512, fondo transparente)

Estilo token de Monopoly: pieza metalica plateada 3D. Cada prompt ya viene
completo: copiar el bloque entero.

### Balon — guardar como `monopoly/token-balon.png`

```text
A classic Monopoly-style metal game token, polished silver pewter material, small 3D board game piece on a tiny round base, studio lighting, soft shadows, high detail 3D render, isolated on transparent background, no text, no watermark. The token is a classic hexagon-pattern football.
```

### Botin — guardar como `monopoly/token-botin.png`

```text
A classic Monopoly-style metal game token, polished silver pewter material, small 3D board game piece on a tiny round base, studio lighting, soft shadows, high detail 3D render, isolated on transparent background, no text, no watermark. The token is a football boot with visible studs and detailed laces.
```

### Copa — guardar como `monopoly/token-copa.png`

```text
A classic Monopoly-style metal game token, polished silver pewter material, small 3D board game piece on a tiny round base, studio lighting, soft shadows, high detail 3D render, isolated on transparent background, no text, no watermark. The token is a World Cup style trophy with two abstract figures holding up a globe, with a subtle golden tint.
```

### Guante — guardar como `monopoly/token-guante.png`

```text
A classic Monopoly-style metal game token, polished silver pewter material, small 3D board game piece on a tiny round base, studio lighting, soft shadows, high detail 3D render, isolated on transparent background, no text, no watermark. The token is a goalkeeper glove with the open palm facing forward.
```

### Silbato — guardar como `monopoly/token-silbato.png`

```text
A classic Monopoly-style metal game token, polished silver pewter material, small 3D board game piece on a tiny round base, studio lighting, soft shadows, high detail 3D render, isolated on transparent background, no text, no watermark. The token is a referee whistle with a small ring and cord.
```

### Camiseta — guardar como `monopoly/token-camiseta.png`

```text
A classic Monopoly-style metal game token, polished silver pewter material, small 3D board game piece on a tiny round base, studio lighting, soft shadows, high detail 3D render, isolated on transparent background, no text, no watermark. The token is a short-sleeve football jersey with the number 10 embossed on the back.
```

### Escudo — guardar como `monopoly/token-escudo.png`

```text
A classic Monopoly-style metal game token, polished silver pewter material, small 3D board game piece on a tiny round base, studio lighting, soft shadows, high detail 3D render, isolated on transparent background, no text, no watermark. The token is a heraldic team crest shield with a football embossed in the center.
```

### Mascota — guardar como `monopoly/token-mascota.png`

```text
A classic Monopoly-style metal game token, polished silver pewter material, small 3D board game piece on a tiny round base, studio lighting, soft shadows, high detail 3D render, isolated on transparent background, no text, no watermark. The token is a cute standing jaguar mascot wearing a football kit and waving.
```

## 8. Tarjetas VAR y FIFA (768x1024, dorso de las tarjetas del modal)

### Dorso Tarjeta VAR — guardar como `monopoly/card-var.jpg`

```text
Vertical playing card back design for a football board game, 3:4 portrait ratio. Bold orange background with a dark teal diagonal stripe pattern, a large centered white question mark styled as a VAR video replay monitor with a play button, thin golden inner border frame, flat vector style with subtle texture, symmetrical, elegant, no text, no watermark.
```

### Dorso Tarjeta FIFA — guardar como `monopoly/card-fifa.jpg`

```text
Vertical playing card back design for a football board game, 3:4 portrait ratio. Deep royal blue background with subtle golden laurel pattern, a large centered golden trophy chest icon with a football on top, thin golden inner border frame, flat vector style with subtle texture, symmetrical, elegant, no text, no watermark.
```

## 9. Pantalla de inicio (opcional)

### Ilustracion del hero del setup — guardar como `monopoly/hero.png`

Para la pantalla de inicio del modo solitario (equivalente al Mr. Monopoly del
juego de consola de referencia).

```text
Flat vector cartoon illustration for a football board game, bold clean outlines, vibrant saturated colors, subtle cel shading, no text, no watermark, isolated on transparent background. A charismatic cartoon football manager mascot in an elegant suit with a scarf in green red and blue, one hand leaning on a golden World Cup trophy like a cane, the other hand flipping a golden coin, confident wink, confetti falling around, full body, front facing.
```

## Orden sugerido de generacion

1. Portada (`covers/monopoly-mundial.jpg`) — es lo unico visible desde la landing.
2. Escudos de las 22 selecciones — el mayor impacto visual dentro del tablero.
3. Esquinas (4) + casillas especiales (6) + estadios (4).
4. Fichas (8) y dorsos de tarjetas (2).
5. Fondos (centro + pantalla) y hero.

Cuando haya archivos listos en `public/monopoly/`, avisar para cablearlos al
tablero (los estilos que los usan todavia no existen; se agregan en ese paso).

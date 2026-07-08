/**
 * Palabras extra que se suman al diccionario base (`an-array-of-spanish-words`,
 * ~636k palabras). Editar ESTE array para agregar palabras que el diccionario
 * base no tiene: jerga, regionalismos (voseo, lunfardo), terminos nuevos, etc.
 *
 * - Se normalizan igual que el resto (minuscula, se sacan acentos de vocales y la
 *   dieresis pero se conserva la ñ), asi que podes escribirlas con o sin tilde:
 *   "chamuyar", "birra", "guita", "quilombo"...
 * - Solo cuenta que sean >= 3 letras y solo letras [a-zñ] (las mas cortas o con
 *   simbolos se ignoran).
 * - Sumar palabras las hace VALIDAS como respuesta; no cambia que fragmentos
 *   (silabas) se ofrecen como reto (eso depende de `MIN_WORDS_PER_FRAGMENT` en
 *   `dictionary.ts`; una lista corta no alcanza para crear un fragmento nuevo).
 *
 * Tras editar, hay que **redeployar el server en Railway** para que tome los
 * cambios (el diccionario se arma al arrancar el proceso).
 */
export const EXTRA_WORDS: string[] = [
  // Ejemplos (borralos o dejalos): jerga rioplatense que el diccionario base
  // no suele traer. Agrega las tuyas debajo, una por linea.
  "birra",
  "chamuyar",
  "quilombo",
  "guita",
  "posta",
  "chabon",
  "boludo",
  "laburo",
  "fiaca",
  "gauchada",
];

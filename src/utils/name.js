// Limpia un nombre escrito a mano: quita espacios de más (al inicio/final,
// y los dobles que a veces deja el autocompletado del teclado entre
// palabras) y lo deja en Title Case (primera letra de cada palabra, y de
// cada parte después de un guión, en mayúscula). No intenta acertar casos
// raros tipo "McDonald" — para nombres en español no hace falta.
export function cleanPersonName(rawName) {
  const collapsed = String(rawName ?? '').trim().replace(/\s+/g, ' ')
  return collapsed
    .toLowerCase()
    .replace(/(^|[\s-])([a-zà-ÿ])/g, (_, sep, letter) => sep + letter.toUpperCase())
}

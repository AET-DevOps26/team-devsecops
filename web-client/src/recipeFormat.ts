const FRACTIONS: [number, string][] = [
  [1 / 8, '⅛'],
  [1 / 6, '⅙'],
  [1 / 5, '⅕'],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [3 / 8, '⅜'],
  [2 / 5, '⅖'],
  [1 / 2, '½'],
  [3 / 5, '⅗'],
  [5 / 8, '⅝'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [4 / 5, '⅘'],
  [5 / 6, '⅚'],
  [7 / 8, '⅞'],
]

// scale a quantity to the chosen portions, rendering fractional parts as glyphs (e.g. 1.5 → "1 ½")
export function formatQuantity(quantity: number, scale = 1): string {
  const value = quantity * scale
  // for larger amounts, plain digits read better than mixed-fraction glyphs
  if (value <= 5) {
    const whole = Math.floor(value)
    const frac = value - whole
    const glyph = FRACTIONS.find(([f]) => Math.abs(frac - f) < 0.02)?.[1]
    if (glyph) return whole > 0 ? `${whole} ${glyph}` : glyph
  }
  // round to 2 decimals and drop trailing zeros
  return String(Math.round(value * 100) / 100)
}

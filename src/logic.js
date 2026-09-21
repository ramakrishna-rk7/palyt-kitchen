// Single logic file: units + availability + deduction.
// ponytail: only kg/g, l/ml, pcs. Add unit when real data needs it.
const FACTOR = { kg: 1000, g: 1, l: 1000, ml: 1, pcs: 1 };

export function toBase(qty, unit) {
  const f = FACTOR[unit];
  if (f === undefined) throw new Error(`unsupported unit: ${unit}`);
  return qty * f;
}

export function isDishAvailable(dish, stock) {
  return dish.ingredients.every((ri) => {
    const s = stock.find((i) => i.id === ri.ingredientId);
    if (!s) return false;
    try {
      return toBase(s.quantity, s.unit) >= toBase(s.par, s.unit);
    } catch {
      return false;
    }
  });
}

export function deductIngredients(dish, stock) {
  const map = new Map(stock.map((s) => [s.id, { ...s }]));
  for (const ri of dish.ingredients) {
    const s = map.get(ri.ingredientId);
    if (!s) continue; // missing item: availability already false, skip
    const remainBase = toBase(s.quantity, s.unit) - toBase(ri.quantity, ri.unit);
    const rounded = Math.round((remainBase / FACTOR[s.unit]) * 1000) / 1000;
    s.quantity = Math.max(0, rounded);
  }
  return [...map.values()];
}

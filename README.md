# Palyt Kitchen

Stock → order → menu loop. React + Vite + Vitest.

## Run
```
npm install
npm run dev     # open http://localhost:5173
npm run test    # vitest, 10 tests
```

## Rules
- Available if `stock >= par` for all ingredients. Exactly at par = available.
- Missing ingredient = unavailable.
- Order deducts recipe qty with unit convert (kg↔g, l↔ml). Ex: 2.1kg - 180g = 1.92kg.
- Delete blocked if ingredient used by recipe. Prevents dangling refs.
- Validation: name required, qty >=0, par >0, unit in kg/g/l/ml/pcs, no dupes.

## Files
- `src/App.jsx` — inventory + menu, one file
- `src/logic.js` — toBase, isDishAvailable, deductIngredients
- `src/stock.json`, `src/recipes.json` — replace with real Palyt JSON, same shape
- `src/logic.test.js` — 10 tests

## Manual check
Paneer 2.1kg/par 2kg = AVAILABLE → Order → 1.92kg = UNAVAILABLE → restock 3kg = AVAILABLE → par 4kg = UNAVAILABLE.

See `docs/order-off-menu.png` (after one order) and `docs/menu-before-order.png` (fresh load).

## Data note
`stock.json` / `recipes.json` are small stand-ins (4 ingredients, 2 dishes) with the
shape described in the brief. Drop the real files in; units covered are kg/g, l/ml, pcs.

## Push
```
git init; git add .; git commit -m "chore: initialize React project"
# commit per feature, push to public repo, open PR, leave open
```

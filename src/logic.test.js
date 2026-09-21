import { describe, it, expect } from "vitest";
import { toBase, isDishAvailable, deductIngredients } from "./logic";

const dish = {
  id: "butter-paneer", name: "Butter Paneer", price: 280,
  ingredients: [{ ingredientId: "paneer", quantity: 180, unit: "g" }],
};

describe("units", () => {
  it("kg->g", () => {
    expect(toBase(1, "kg")).toBe(1000);
    expect(toBase(2, "kg")).toBe(2000);
    expect(toBase(500, "g")).toBe(500);
  });
  it("2kg - 180g = 1.82kg", () => {
    const stock = [{ id: "paneer", name: "Paneer", quantity: 2, unit: "kg", par: 1 }];
    const out = deductIngredients(dish, stock);
    expect(out[0].quantity).toBeCloseTo(1.82, 3);
  });
});

describe("availability", () => {
  it("above par -> available", () => {
    expect(isDishAvailable(dish, [{ id: "paneer", quantity: 5, unit: "kg", par: 2 }])).toBe(true);
  });
  it("below par -> unavailable", () => {
    expect(isDishAvailable(dish, [{ id: "paneer", quantity: 1.9, unit: "kg", par: 2 }])).toBe(false);
  });
  it("exactly at par -> available", () => {
    expect(isDishAvailable(dish, [{ id: "paneer", quantity: 2, unit: "kg", par: 2 }])).toBe(true);
  });
  it("missing ingredient -> unavailable", () => {
    expect(isDishAvailable(dish, [])).toBe(false);
  });
  it("raise par flips to unavailable, restock flips back", () => {
    const low = [{ id: "paneer", quantity: 3, unit: "kg", par: 4 }];
    expect(isDishAvailable(dish, low)).toBe(false);
    const restocked = [{ id: "paneer", quantity: 5, unit: "kg", par: 4 }];
    expect(isDishAvailable(dish, restocked)).toBe(true);
  });
});

describe("deduction", () => {
  it("5kg - 180g = 4.82kg", () => {
    const out = deductIngredients(dish, [{ id: "paneer", quantity: 5, unit: "kg", par: 2 }]);
    expect(out[0].quantity).toBeCloseTo(4.82, 3);
  });
  it("multi-ingredient deducts all", () => {
    const multi = { id: "m", name: "M", price: 1, ingredients: [
      { ingredientId: "paneer", quantity: 180, unit: "g" },
      { ingredientId: "tomato", quantity: 100, unit: "g" },
    ]};
    const out = deductIngredients(multi, [
      { id: "paneer", quantity: 2.1, unit: "kg", par: 2 },
      { id: "tomato", quantity: 5, unit: "kg", par: 1 },
    ]);
    expect(out.find((s) => s.id === "paneer").quantity).toBeCloseTo(1.92, 3);
    expect(out.find((s) => s.id === "tomato").quantity).toBeCloseTo(4.9, 3);
  });
  it("order 2.1kg paneer -> 1.92kg below par", () => {
    const before = [{ id: "paneer", quantity: 2.1, unit: "kg", par: 2 }];
    expect(isDishAvailable(dish, before)).toBe(true);
    const after = deductIngredients(dish, before);
    expect(after[0].quantity).toBeCloseTo(1.92, 3);
    expect(isDishAvailable(dish, after)).toBe(false);
  });
});

import { useState } from "react";
import initialStock from "./stock.json";
import initialRecipes from "./recipes.json";
import { isDishAvailable, deductIngredients } from "./logic";

const UNITS = ["kg", "g", "l", "ml", "pcs"];

function validate({ name, quantity, par, unit, id }, stock, isNew) {
  if (!name.trim()) return "Name required.";
  if (Number.isNaN(Number(quantity)) || Number(quantity) < 0) return "Stock must be number >= 0.";
  if (Number.isNaN(Number(par)) || Number(par) <= 0) return "Par must be number > 0.";
  if (!UNITS.includes(unit)) return `Unit must be one of ${UNITS.join(", ")}.`;
  const dup = stock.some((s) => s.id === id || s.name.toLowerCase() === name.toLowerCase());
  if (isNew && dup) return "Duplicate ingredient id/name.";
  return null;
}

export default function App() {
  const [stock, setStock] = useState(initialStock);
  const [recipes] = useState(initialRecipes);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", quantity: "", par: "", unit: "kg" });
  const [showAdd, setShowAdd] = useState(false);
  const [err, setErr] = useState("");

  const filtered = stock.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  const startEdit = (s) => {
    setEditing(s.id);
    setForm({ name: s.name, quantity: s.quantity, par: s.par, unit: s.unit });
    setErr("");
  };

  const saveEdit = () => {
    const cur = stock.find((s) => s.id === editing);
    const e = validate({ ...form, id: editing }, [], false);
    if (e) return setErr(e);
    setStock(stock.map((s) => s.id === editing
      ? { ...s, name: form.name.trim(), quantity: Number(form.quantity), par: Number(form.par), unit: form.unit }
      : s));
    setEditing(null);
    setErr("");
  };

  const addNew = () => {
    const id = form.name.trim().toLowerCase().replace(/\s+/g, "-");
    const e = validate({ ...form, id }, stock, true);
    if (e) return setErr(e);
    setStock([...stock, { id, name: form.name.trim(), quantity: Number(form.quantity), par: Number(form.par), unit: form.unit }]);
    setShowAdd(false);
    setForm({ name: "", quantity: "", par: "", unit: "kg" });
    setErr("");
  };

  const del = (s) => {
    const usedBy = recipes.filter((d) => d.ingredients.some((ri) => ri.ingredientId === s.id));
    if (usedBy.length) {
      setErr(`Cannot delete ${s.name}. Used by: ${usedBy.map((d) => d.name).join(", ")}`);
      return;
    }
    setStock(stock.filter((i) => i.id !== s.id));
    setErr("");
  };

  const formUI = (onSave, onCancel) => (
    <div style={{ border: "1px solid #ccc", padding: 8, margin: "8px 0" }}>
      <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Stock" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={{ width: 80 }} />
      <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
      </select>
      <input placeholder="Par" type="number" value={form.par} onChange={(e) => setForm({ ...form, par: e.target.value })} style={{ width: 80 }} />
      <button onClick={onSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <h1>Palyt Kitchen</h1>
      {err && <p style={{ color: "red" }}>{err}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h2>Inventory</h2>
          <input placeholder="Search ingredients..." value={q} onChange={(e) => setQ(e.target.value)} />
          {filtered.map((s) => (
            <div key={s.id} style={{ borderBottom: "1px solid #eee", padding: "6px 0" }}>
              <b>{s.name}</b> {s.quantity} {s.unit} / par {s.par} {s.unit}{" "}
              <span style={{ color: s.quantity < s.par ? "red" : "green" }}>
                {s.quantity < s.par ? "Below Par" : "OK"}
              </span>{" "}
              {editing === s.id ? formUI(saveEdit, () => setEditing(null)) : (
                <><button onClick={() => startEdit(s)}>Edit</button><button onClick={() => del(s)}>Delete</button></>
              )}
            </div>
          ))}
          {!showAdd
            ? <button onClick={() => { setShowAdd(true); setForm({ name: "", quantity: "", par: "", unit: "kg" }); setErr(""); }}>+ Add Ingredient</button>
            : formUI(addNew, () => setShowAdd(false))}
        </div>
        <div>
          <h2>Menu</h2>
          {recipes.map((d) => {
            const ok = isDishAvailable(d, stock);
            return (
              <div key={d.id} style={{ border: "1px solid #ddd", padding: 8, marginBottom: 8 }}>
                <b>{d.name}</b> ₹{d.price}<br />
                <span style={{ color: ok ? "green" : "red" }}>{ok ? "AVAILABLE" : "UNAVAILABLE"}</span>{" "}
                <button disabled={!ok} onClick={() => setStock(deductIngredients(d, stock))}>Order</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

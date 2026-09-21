import { useState } from "react";
import initialStock from "./stock.json";
import initialRecipes from "./recipes.json";
import { isDishAvailable, deductIngredients } from "./logic";

const UNITS = ["kg", "g", "l", "ml", "pcs"];

// One style table. No CSS files, no libs.
const S = {
  page: { padding: "24px 0" },
  header: {
    background: "#1c1917", color: "#fafaf9", borderRadius: 16,
    padding: "22px 26px", marginBottom: 20, display: "flex",
    justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
  },
  title: { margin: 0, fontSize: 26 },
  sub: { margin: "4px 0 0", color: "#a8a29e", fontSize: 14 },
  health: { background: "#44403c", borderRadius: 999, padding: "6px 14px", fontSize: 13 },
  grid: { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 },
  panel: { background: "#fff", border: "1px solid #e7e5e4", borderRadius: 16, padding: 20 },
  h2: { margin: "0 0 12px", fontSize: 17 },
  search: {
    width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 14,
    border: "1px solid #d6d3d1", borderRadius: 10, marginBottom: 8,
  },
  row: {
    display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
    borderBottom: "1px solid #f5f5f4",
  },
  name: { fontWeight: 600, fontSize: 14 },
  meta: { color: "#78716c", fontSize: 13 },
  grow: { flex: 1, minWidth: 0 },
  btn: {
    border: "1px solid #d6d3d1", background: "#fff", borderRadius: 8,
    padding: "6px 10px", fontSize: 13, cursor: "pointer",
  },
  primary: {
    border: "none", background: "#1c1917", color: "#fff", borderRadius: 8,
    padding: "8px 12px", fontSize: 13, cursor: "pointer",
  },
  order: {
    width: "100%", border: "none", borderRadius: 10, padding: "10px",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    background: "#15803d", color: "#fff", marginTop: 10,
  },
  orderOff: { background: "#e7e5e4", color: "#a8a29e", cursor: "not-allowed" },
  dish: { border: "1px solid #e7e5e4", borderRadius: 12, padding: 14, marginBottom: 12 },
  dishTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  dishName: { margin: 0, fontSize: 15 },
  price: { fontWeight: 700, fontSize: 15 },
  form: { background: "#fafaf9", border: "1px solid #e7e5e4", borderRadius: 12, padding: 12, margin: "10px 0", display: "grid", gap: 8 },
  input: { padding: "8px 10px", fontSize: 14, border: "1px solid #d6d3d1", borderRadius: 8, width: "100%", boxSizing: "border-box" },
  err: { background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 10, padding: "10px 14px", fontSize: 14, marginBottom: 12 },
};

function Pill({ ok, children }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "3px 10px",
      background: ok ? "#dcfce7" : "#fee2e2", color: ok ? "#15803d" : "#b91c1c",
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

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
  const below = stock.filter((s) => s.quantity < s.par).length;

  const startEdit = (s) => {
    setEditing(s.id);
    setForm({ name: s.name, quantity: s.quantity, par: s.par, unit: s.unit });
    setErr("");
  };

  const saveEdit = () => {
    // Exclude self so renaming onto another ingredient trips the dupe check.
    const e = validate({ ...form, id: editing }, stock.filter((s) => s.id !== editing), true);
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

  const formUI = (onSave, onCancel, label) => (
    <div style={S.form}>
      <input style={S.input} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div style={{ display: "flex", gap: 8 }}>
        <input style={S.input} placeholder="Stock" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        <select style={S.input} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <input style={S.input} placeholder="Par" type="number" value={form.par} onChange={(e) => setForm({ ...form, par: e.target.value })} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ ...S.primary, flex: 1 }} onClick={onSave}>{label}</button>
        <button style={{ ...S.btn, flex: 1 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div>
          <h1 style={S.title}>Palyt Kitchen</h1>
          <p style={S.sub}>Stock → order → menu. One order can take a dish off.</p>
        </div>
        <div style={S.health}>{below === 0 ? "All stock above par" : `${below} below par`}</div>
      </header>

      {err && <div style={S.err}>{err}</div>}

      <div style={S.grid}>
        <section style={S.panel}>
          <h2 style={S.h2}>Inventory</h2>
          <input style={S.search} placeholder="Search ingredients..." value={q} onChange={(e) => setQ(e.target.value)} />
          {filtered.map((s) => {
            const ok = s.quantity >= s.par;
            return (
              <div key={s.id}>
                <div style={S.row}>
                  <div style={S.grow}>
                    <div style={S.name}>{s.name}</div>
                    <div style={S.meta}>{s.quantity} {s.unit} in stock · par {s.par} {s.unit}</div>
                  </div>
                  <Pill ok={ok}>{ok ? "OK" : "Below par"}</Pill>
                  {editing !== s.id && <>
                    <button style={S.btn} onClick={() => startEdit(s)}>Edit</button>
                    <button style={S.btn} onClick={() => del(s)}>Delete</button>
                  </>}
                </div>
                {editing === s.id && formUI(saveEdit, () => setEditing(null), "Save")}
              </div>
            );
          })}
          {!showAdd
            ? <button style={{ ...S.btn, marginTop: 12 }} onClick={() => { setShowAdd(true); setForm({ name: "", quantity: "", par: "", unit: "kg" }); setErr(""); }}>+ Add ingredient</button>
            : formUI(addNew, () => setShowAdd(false), "Add")}
        </section>

        <section style={S.panel}>
          <h2 style={S.h2}>Menu</h2>
          {recipes.map((d) => {
            const ok = isDishAvailable(d, stock);
            return (
              <div key={d.id} style={S.dish}>
                <div style={S.dishTop}>
                  <h3 style={S.dishName}>{d.name}</h3>
                  <span style={S.price}>₹{d.price}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Pill ok={ok}>{ok ? "Available" : "Unavailable"}</Pill>
                </div>
                <button
                  style={{ ...S.order, ...(!ok ? S.orderOff : {}) }}
                  disabled={!ok}
                  onClick={() => setStock(deductIngredients(d, stock))}
                >{ok ? "Order" : "Off menu"}</button>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

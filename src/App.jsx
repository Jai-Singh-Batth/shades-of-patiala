import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabase";

// ─── Constants (No changes here) ──────────────────────────────────────────────
const MEASUREMENTS = [
  ["length", "Length"], ["upperChest", "Upper Chest"], ["chest", "Chest"], ["waist", "Waist"],
  ["hip", "Hip"], ["sleeveLength", "Sleeve Length"], ["muri", "Muri"], ["armHole", "Arm Hole"],
  ["frontNeck", "Front Neck"], ["backNeck", "Back Neck"], ["teeraFront", "Teera Front"],
  ["teeraBack", "Teera Back"], ["pleates", "Pleates"], ["choliLength", "Choli Length"],
  ["fullGownLength", "Full / Gown Length"], ["pantPlazoLength", "Pant / Plazo Length"],
  ["pantPlazoMuri", "Pant / Plazo Muri"], ["salwarLength", "Salwar Length"],
  ["shararaGaraLength", "Sharara / Garara Length"], ["thigh", "Thigh"], ["knee", "Knee"],
];
const BLANK_M = Object.fromEntries(MEASUREMENTS.map(([k]) => [k, ""]));
const STATUSES = ["Pending", "In Progress", "Ready", "Delivered"];
const blankRow = () => ({ id: crypto.randomUUID(), part: "", kaarigar: "", status: "Pending" });
const fmt = n => "Rs. " + Number(n || 0).toLocaleString();

const SMETA = {
  "Pending": { bg: "#FDF3E3", fg: "#7D4E00", dot: "#C9873A" },
  "In Progress": { bg: "#EEF2F8", fg: "#1A3A6B", dot: "#3D6DB5" },
  "Ready": { bg: "#EDF5EE", fg: "#1A4A20", dot: "#3A8A45" },
  "Delivered": { bg: "#F3F0F8", fg: "#3A1A5C", dot: "#7B5EA7" },
};

const D = "#2A1505", M = "#7A5230", G = "#B07D45", CREAM = "#FAF5ED", BORDER = "#E2D5C3";
const IS = { padding: "9px 12px", borderRadius: 3, border: "1px solid #D9CCBC", background: "#FDFAF6", fontSize: 13, color: D, fontFamily: "'DM Sans',sans-serif", width: "100%", boxSizing: "border-box" };
const SS = { ...IS, cursor: "pointer" };
const LBL = { fontSize: 10, fontWeight: 700, color: M, letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 4, fontFamily: "'DM Sans',sans-serif" };

// ─── Small reusable components ────────────────────────────────────────────────
function Pill({ s }) {
  const m = SMETA[s] || SMETA["Pending"];
  return (
    <span style={{ background: m.bg, color: m.fg, borderRadius: 3, padding: "3px 10px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", letterSpacing: 0.3 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.dot, display: "inline-block" }} />{s}
    </span>
  );
}

function Sect({ title, children, action }) {
  return (
    <div style={{ border: "1px solid #E2D5C3", borderRadius: 4, marginBottom: 14, overflow: "hidden" }}>
      <div style={{ background: "#F7F0E8", padding: "9px 18px", borderBottom: "1px solid #E2D5C3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: M, fontFamily: "'DM Sans',sans-serif" }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: "18px" }}>{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0" }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${BORDER}`, borderTop: `3px solid ${G}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function KaarigarsEditor({ rows, onChange }) {
  function updRow(id, key, val) { onChange(rows.map(r => r.id === id ? { ...r, [key]: val } : r)); }
  function addRow() { onChange([...rows, blankRow()]); }
  function delRow(id) { onChange(rows.filter(r => r.id !== id)); }
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 110px 28px", gap: 8, marginBottom: 6 }}>
        {["Part of Suit", "Kaarigar Name", "Status", ""].map(h => (
          <span key={h} style={{ fontSize: 10, fontWeight: 700, color: M, letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif" }}>{h}</span>
        ))}
      </div>
      {rows.map(r => (
        <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 110px 28px", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <input style={IS} value={r.part} onChange={e => updRow(r.id, "part", e.target.value)} placeholder="e.g. Kameez" />
          <input style={IS} value={r.kaarigar} onChange={e => updRow(r.id, "kaarigar", e.target.value)} placeholder="Worker's name" />
          <select style={{ ...SS, fontSize: 12, padding: "9px 8px" }} value={r.status} onChange={e => updRow(r.id, "status", e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => delRow(r.id)} style={{ background: "none", border: "1px solid #D9CCBC", borderRadius: 3, width: 28, height: 34, cursor: "pointer", color: "#9A7250", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
      ))}
      <button onClick={addRow} style={{ marginTop: 4, background: "none", border: "1px dashed #C9A87A", borderRadius: 3, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: M, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", letterSpacing: 0.5, width: "100%" }}>
        + Add Part
      </button>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("new");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [selCust, setSelCust] = useState(null);
  const [selOrder, setSelOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [filterS, setFilterS] = useState("All");

  const [step, setStep] = useState(1);
  const [custMode, setCustMode] = useState("new");
  const [pickedCustId, setPickedCustId] = useState("");
  const [returningSearch, setReturningSearch] = useState("");

  const blankCust = { name: "", phone: "", address: "", reference: "", notes: "", measurements: { ...BLANK_M } };
  const blankOrder = { description: "", deadline: "", rows: [blankRow(), blankRow(), blankRow()], total: "", advance: "" };
  const [custForm, setCustForm] = useState(blankCust);
  const [orderForm, setOrderForm] = useState(blankOrder);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const { data: custsData, error: custsErr } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (custsErr) throw custsErr;

      const { data: ordersData, error: ordersErr } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (ordersErr) throw ordersErr;

      const merged = custsData.map(c => ({
        ...c,
        measurements: c.measurements || BLANK_M,
        orders: ordersData
          .filter(o => o.customer_id === c.id)
          .map(o => ({
            ...o,
            rows: o.rows || [],
            orderStatus: o.order_status,
            createdAt: o.created_at?.slice(0, 10),
          })),
      }));
      setCustomers(merged);
    } catch (e) {
      setError("Could not load data. Check your Supabase connection.");
    }
    setLoading(false);
  }

  // ─── DELETE CUSTOMER HANDLER ──────────────────────────────────────────────
  async function deleteCustomer(id) {
    const cust = customers.find(c => c.id === id);
    if (!window.confirm(`Are you sure you want to delete "${cust.name}"? This will also remove all their orders. This cannot be undone.`)) return;

    setLoading(true);
    try {
      const { error: de } = await supabase.from("customers").delete().eq("id", id);
      if (de) throw de;
      setSelCust(null);
      await loadAll();
      alert("Customer deleted successfully.");
    } catch (e) {
      setError("Failed to delete customer.");
      console.error(e);
    }
    setLoading(false);
  }

  function scf(k, v) { setCustForm(p => ({ ...p, [k]: v })); }
  function scm(k, v) { setCustForm(p => ({ ...p, measurements: { ...p.measurements, [k]: v } })); }
  function sof(k, v) { setOrderForm(p => ({ ...p, [k]: v })); }

  function goToStep2() {
    if (custMode === "new" && !custForm.name.trim()) return alert("Please enter the customer name.");
    if (custMode === "existing" && !pickedCustId) return alert("Please select a customer.");
    setStep(2);
  }

  async function submitOrder() {
    if (!orderForm.deadline) return alert("Please enter a deadline.");
    setSaving(true);
    setError("");
    try {
      let customerId = pickedCustId;
      if (custMode === "new") {
        const { data, error: ce } = await supabase.from("customers").insert({
          name: custForm.name.trim(),
          phone: custForm.phone,
          address: custForm.address,
          reference: custForm.reference,
          notes: custForm.notes,
          measurements: custForm.measurements,
        }).select().single();
        if (ce) throw ce;
        customerId = data.id;
      }

      const { error: oe } = await supabase.from("orders").insert({
        customer_id: customerId,
        description: orderForm.description,
        deadline: orderForm.deadline,
        order_status: "Pending",
        rows: orderForm.rows.filter(r => r.part.trim()),
        total: +orderForm.total || 0,
        advance: +orderForm.advance || 0,
      });
      if (oe) throw oe;

      await loadAll();
      setCustForm(blankCust);
      setOrderForm(blankOrder);
      setPickedCustId("");
      setReturningSearch("");
      setStep(1);
      setCustMode("new");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError("Failed to save. Please try again.");
    }
    setSaving(false);
  }

  // (Remaining status/money/measurement update functions remain the same)
  async function updOrderStatus(orderId, val) {
    const { error: e } = await supabase.from("orders").update({ order_status: val }).eq("id", orderId);
    if (e) return setError("Failed to update status.");
    setCustomers(p => p.map(c => ({
      ...c,
      orders: c.orders.map(o => o.id === orderId ? { ...o, orderStatus: val, order_status: val } : o),
    })));
    if (selOrder?.id === orderId) setSelOrder(o => ({ ...o, orderStatus: val }));
  }

  async function updOrderRows(orderId, rows) {
    const { error: e } = await supabase.from("orders").update({ rows }).eq("id", orderId);
    if (e) return setError("Failed to update rows.");
    setCustomers(p => p.map(c => ({
      ...c,
      orders: c.orders.map(o => o.id === orderId ? { ...o, rows } : o),
    })));
    if (selOrder?.id === orderId) setSelOrder(o => ({ ...o, rows }));
  }

  async function updMoney(orderId, key, val) {
    const { error: e } = await supabase.from("orders").update({ [key]: +val || 0 }).eq("id", orderId);
    if (e) return setError("Failed to update payment.");
    setCustomers(p => p.map(c => ({
      ...c,
      orders: c.orders.map(o => o.id === orderId ? { ...o, [key]: +val || 0 } : o),
    })));
    if (selOrder?.id === orderId) setSelOrder(o => ({ ...o, [key]: +val || 0 }));
  }

  async function updMeasurement(custId, key, val) {
    const cust = customers.find(c => c.id === custId);
    if (!cust) return;
    const updated = { ...cust.measurements, [key]: val };
    const { error: e } = await supabase.from("customers").update({ measurements: updated }).eq("id", custId);
    if (e) return setError("Failed to save measurement.");
    setCustomers(p => p.map(c => c.id === custId ? { ...c, measurements: updated } : c));
    if (selCust?.id === custId) setSelCust(c => ({ ...c, measurements: updated }));
  }

  const allOrders = useMemo(() => customers.flatMap(c => c.orders.map(o => ({ ...o, custName: c.name, custId: c.id }))), [customers]);
  const stats = useMemo(() => {
    const rev = allOrders.reduce((s, o) => s + (o.total || 0), 0);
    const rec = allOrders.reduce((s, o) => s + (o.advance || 0), 0);
    return { rev, rec, due: rev - rec, delivered: allOrders.filter(o => o.orderStatus === "Delivered").length, ready: allOrders.filter(o => o.orderStatus === "Ready").length, inProg: allOrders.filter(o => o.orderStatus === "In Progress").length, pending: allOrders.filter(o => o.orderStatus === "Pending").length, total: allOrders.length };
  }, [allOrders]);

  const filteredCusts = useMemo(() => customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search);
    if (!matchSearch) return false;
    return filterS === "All" || c.orders.some(o => o.orderStatus === filterS);
  }), [customers, search, filterS]);

  const returningMatches = useMemo(() => {
    if (!returningSearch) return [];
    return customers.filter(c =>
      c.name.toLowerCase().includes(returningSearch.toLowerCase()) ||
      (c.phone || "").includes(returningSearch)
    ).slice(0, 5);
  }, [customers, returningSearch]);

  function goPage(p) { setPage(p); setSelCust(null); setSelOrder(null); setStep(1); setReturningSearch(""); }

  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "'Cormorant Garamond',Georgia,serif", color: D }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;} 
        input:focus,select:focus,textarea:focus{outline:1.5px solid #B07D45;} 
        @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} 
        .card{animation:up 0.28s ease both;} 
        .rh:hover{background:#F7F0E8!important;cursor:pointer;}
        .delete-btn { background: none; border: 1px solid #e8b4a8; color: #8B1A00; padding: 4px 8px; border-radius: 3px; font-size: 10px; cursor: pointer; text-transform: uppercase; font-weight: 700; transition: 0.2s; }
        .delete-btn:hover { background: #8B1A00; color: white; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: D, borderBottom: "3px solid #B07D45" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ padding: "18px 0 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ color: "#E8C98A", fontWeight: 700, fontSize: 22, letterSpacing: 2, textTransform: "uppercase" }}>Shades of Patiala</div>
          </div>
          <div style={{ display: "flex" }}>
            {[{ id: "new", label: "New Order" }, { id: "directory", label: "Customers" }, { id: "dashboard", label: "Dashboard" }].map(t => (
              <button key={t.id} onClick={() => goPage(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "13px 20px", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", color: page === t.id ? "#E8C98A" : "rgba(232,201,138,0.45)", borderBottom: page === t.id ? "2px solid #B07D45" : "2px solid transparent", letterSpacing: 1.5, textTransform: "uppercase" }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 16px 70px" }}>
        {error && <div style={{ background: "#FDF0EE", border: "1px solid #E8B4A8", borderRadius: 3, padding: "11px 16px", marginBottom: 16, color: "#8B1A00", fontSize: 13, fontWeight: 600 }}>⚠ {error}</div>}
        {loading && <Spinner />}

        {!loading && page === "new" && (
          <div className="card">
            <h1 style={{ fontSize: 26, marginBottom: 20 }}>New Order</h1>
            {saved && <div style={{ background: "#EDF5EE", border: "1px solid #B5D8B9", borderRadius: 3, padding: "11px 16px", marginBottom: 16, color: "#1A4A20" }}>Order saved successfully!</div>}

            {step === 1 && (
              <>
                <Sect title="Customer Info">
                  <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                    {["new", "existing"].map(m => (
                      <button key={m} onClick={() => { setCustMode(m); setPickedCustId(""); setReturningSearch(""); }} style={{ flex: 1, padding: "11px", border: `1.5px solid ${custMode === m ? D : BORDER}`, borderRadius: 3, background: custMode === m ? D : CREAM, color: custMode === m ? "#E8C98A" : M, cursor: "pointer" }}>{m === "new" ? "New Customer" : "Returning Customer"}</button>
                    ))}
                  </div>

                  {custMode === "existing" ? (
                    <div style={{ position: "relative" }}>
                      <label style={LBL}>Search Customer</label>
                      <input
                        style={IS}
                        placeholder="Type name or phone number..."
                        value={returningSearch}
                        onChange={e => {
                          setReturningSearch(e.target.value);
                          setPickedCustId("");
                        }}
                      />
                      {returningSearch && !pickedCustId && returningMatches.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: `1px solid ${BORDER}`, zIndex: 10, borderRadius: "0 0 3px 3px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                          {returningMatches.map(c => (
                            <div key={c.id} style={{ padding: "10px 12px", borderBottom: `1px solid ${CREAM}`, cursor: "pointer", fontSize: 13 }} onClick={() => {
                              setPickedCustId(c.id);
                              setReturningSearch(`${c.name} (${c.phone || 'No Phone'})`);
                            }}>
                              <b>{c.name}</b> <span style={{ color: M, fontSize: 11 }}>{c.phone}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {pickedCustId && (
                        <div style={{ marginTop: 10, background: "#F7F0E8", padding: 10, borderRadius: 3, border: `1px solid ${BORDER}`, fontSize: 13 }}>
                          Selected: <b>{customers.find(c => c.id === pickedCustId)?.name}</b>
                          <button style={{ marginLeft: 10, color: G, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }} onClick={() => { setPickedCustId(""); setReturningSearch(""); }}>Clear</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ gridColumn: "span 2" }}><label style={LBL}>Name</label><input style={IS} value={custForm.name} onChange={e => scf("name", e.target.value)} /></div>
                      <div><label style={LBL}>Phone</label><input style={IS} value={custForm.phone} onChange={e => scf("phone", e.target.value)} /></div>
                      <div><label style={LBL}>Reference</label><input style={IS} value={custForm.reference} onChange={e => scf("reference", e.target.value)} /></div>
                    </div>
                  )}
                </Sect>
                <button onClick={goToStep2} style={{ width: "100%", background: D, color: "#E8C98A", padding: 15, cursor: "pointer", border: `2px solid ${G}`, marginTop: 10 }}>CONTINUE TO ORDER DETAILS →</button>
              </>
            )}

            {step === 2 && (
              <>
                <Sect title="Order Details">
                  <label style={LBL}>Description</label>
                  <textarea style={{ ...IS, minHeight: 80 }} value={orderForm.description} onChange={e => sof("description", e.target.value)} />
                  <div style={{ marginTop: 12 }}><label style={LBL}>Deadline</label><input type="date" style={IS} value={orderForm.deadline} onChange={e => sof("deadline", e.target.value)} /></div>
                </Sect>
                <Sect title="Assignments"><KaarigarsEditor rows={orderForm.rows} onChange={r => sof("rows", r)} /></Sect>
                <Sect title="Payment">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><label style={LBL}>Total</label><input type="number" style={IS} value={orderForm.total} onChange={e => sof("total", e.target.value)} /></div>
                    <div><label style={LBL}>Advance</label><input type="number" style={IS} value={orderForm.advance} onChange={e => sof("advance", e.target.value)} /></div>
                  </div>
                </Sect>
                <button onClick={submitOrder} disabled={saving} style={{ width: "100%", background: saving ? "#9A7250" : D, color: "#E8C98A", padding: 15, cursor: "pointer", border: `2px solid ${G}` }}>{saving ? "SAVING..." : "SAVE ORDER"}</button>
              </>
            )}
          </div>
        )}

        {!loading && page === "directory" && !selCust && (
          <div className="card">
            <h1 style={{ fontSize: 26, marginBottom: 15 }}>Customers</h1>
            <input placeholder="Search name or phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...IS, marginBottom: 15 }} />
            {filteredCusts.map(c => (
              <div key={c.id} className="rh card" style={{ background: "#fff", border: `1px solid ${BORDER}`, padding: 16, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div onClick={() => setSelCust(c)} style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 18 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: M }}>{c.phone || "No phone"} · {c.orders.length} orders</div>
                </div>
                <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteCustomer(c.id); }}>Delete</button>
              </div>
            ))}
          </div>
        )}

        {/* CUSTOMER PROFILE VIEW WITH DELETE BUTTON */}
        {!loading && page === "directory" && selCust && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <button onClick={() => setSelCust(null)} style={{ background: 'none', border: 'none', color: G, cursor: 'pointer', fontWeight: 700 }}>← Back to List</button>
              <button className="delete-btn" onClick={() => deleteCustomer(selCust.id)}>Delete Customer</button>
            </div>
            <Sect title="Customer Profile">
              <div style={{ fontSize: 20, fontWeight: 700 }}>{selCust.name}</div>
              <div style={{ fontSize: 14, color: M }}>{selCust.phone}</div>
              <div style={{ marginTop: 5, fontSize: 13 }}>{selCust.address}</div>
            </Sect>
            {/* ... (rest of your profile/measurement display code) */}
          </div>
        )}

        {!loading && page === "dashboard" && (
          <div className="card">
            <h1 style={{ fontSize: 26, marginBottom: 20 }}>Dashboard</h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ background: D, color: "#E8C98A", padding: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(stats.rev)}</div>
                <div style={{ fontSize: 10, textTransform: "uppercase" }}>Total Revenue</div>
              </div>
              <div style={{ background: "#1A4A20", color: "#C8E6C9", padding: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(stats.rec)}</div>
                <div style={{ fontSize: 10, textTransform: "uppercase" }}>Received</div>
              </div>
              <div style={{ background: "#6B1A00", color: "#FFCCBC", padding: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(stats.due)}</div>
                <div style={{ fontSize: 10, textTransform: "uppercase" }}>Pending</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
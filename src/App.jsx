import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabase";

// ─── Constants ────────────────────────────────────────────────────────────────
const MEASUREMENTS = [
  ["length","Length"],["upperChest","Upper Chest"],["chest","Chest"],["waist","Waist"],
  ["hip","Hip"],["sleeveLength","Sleeve Length"],["muri","Muri"],["armHole","Arm Hole"],
  ["frontNeck","Front Neck"],["backNeck","Back Neck"],["teeraFront","Teera Front"],
  ["teeraBack","Teera Back"],["pleates","Pleates"],["choliLength","Choli Length"],
  ["fullGownLength","Full / Gown Length"],["pantPlazoLength","Pant / Plazo Length"],
  ["pantPlazoMuri","Pant / Plazo Muri"],["salwarLength","Salwar Length"],
  ["shararaGaraLength","Sharara / Garara Length"],["thigh","Thigh"],["knee","Knee"],
];
const BLANK_M  = Object.fromEntries(MEASUREMENTS.map(([k]) => [k, ""]));
const STATUSES = ["Pending", "In Progress", "Ready", "Delivered"];
const blankRow = () => ({ id: crypto.randomUUID(), part: "", kaarigar: "", status: "Pending" });
const today    = () => new Date().toISOString().slice(0, 10);
const fmt      = n  => "Rs. " + Number(n || 0).toLocaleString();

// ─── Status colours ───────────────────────────────────────────────────────────
const SMETA = {
  "Pending":     { bg:"#FDF3E3", fg:"#7D4E00", dot:"#C9873A" },
  "In Progress": { bg:"#EEF2F8", fg:"#1A3A6B", dot:"#3D6DB5" },
  "Ready":       { bg:"#EDF5EE", fg:"#1A4A20", dot:"#3A8A45" },
  "Delivered":   { bg:"#F3F0F8", fg:"#3A1A5C", dot:"#7B5EA7" },
};

// ─── Theme ────────────────────────────────────────────────────────────────────
const D = "#2A1505", M = "#7A5230", G = "#B07D45", CREAM = "#FAF5ED", BORDER = "#E2D5C3";
const IS  = { padding:"9px 12px", borderRadius:3, border:"1px solid #D9CCBC", background:"#FDFAF6", fontSize:13, color:D, fontFamily:"'DM Sans',sans-serif", width:"100%", boxSizing:"border-box" };
const SS  = { ...IS, cursor:"pointer" };
const LBL = { fontSize:10, fontWeight:700, color:M, letterSpacing:0.8, textTransform:"uppercase", display:"block", marginBottom:4, fontFamily:"'DM Sans',sans-serif" };

// ─── Small reusable components ────────────────────────────────────────────────
function Pill({ s }) {
  const m = SMETA[s] || SMETA["Pending"];
  return (
    <span style={{ background:m.bg, color:m.fg, borderRadius:3, padding:"3px 10px", fontSize:11, fontWeight:700, display:"inline-flex", alignItems:"center", gap:5, whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif", letterSpacing:0.3 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:m.dot, display:"inline-block" }} />{s}
    </span>
  );
}

function Sect({ title, children, action }) {
  return (
    <div style={{ border:"1px solid #E2D5C3", borderRadius:4, marginBottom:14, overflow:"visible", position:"relative" }}>
      <div style={{ background:"#F7F0E8", padding:"9px 18px", borderBottom:"1px solid #E2D5C3", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, fontWeight:800, letterSpacing:2, textTransform:"uppercase", color:M, fontFamily:"'DM Sans',sans-serif" }}>{title}</span>
        {action}
      </div>
      <div style={{ padding:"18px" }}>{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:"60px 0" }}>
      <div style={{ width:32, height:32, border:`3px solid ${BORDER}`, borderTop:`3px solid ${G}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Kaarigar rows editor ─────────────────────────────────────────────────────
function KaarigarsEditor({ rows, onChange }) {
  function updRow(id, key, val) { onChange(rows.map(r => r.id === id ? { ...r, [key]: val } : r)); }
  function addRow()  { onChange([...rows, blankRow()]); }
  function delRow(id){ onChange(rows.filter(r => r.id !== id)); }
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 110px 28px", gap:8, marginBottom:6 }}>
        {["Part of Suit","Kaarigar Name","Status",""].map(h => (
          <span key={h} style={{ fontSize:10, fontWeight:700, color:M, letterSpacing:0.8, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>{h}</span>
        ))}
      </div>
      {rows.map(r => (
        <div key={r.id} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 110px 28px", gap:8, marginBottom:8, alignItems:"center" }}>
          <input style={IS} value={r.part}     onChange={e => updRow(r.id,"part",    e.target.value)} placeholder="e.g. Kameez" />
          <input style={IS} value={r.kaarigar} onChange={e => updRow(r.id,"kaarigar",e.target.value)} placeholder="Worker's name" />
          <select style={{ ...SS, fontSize:12, padding:"9px 8px" }} value={r.status} onChange={e => updRow(r.id,"status",e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => delRow(r.id)} style={{ background:"none", border:"1px solid #D9CCBC", borderRadius:3, width:28, height:34, cursor:"pointer", color:"#9A7250", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
      ))}
      <button onClick={addRow} style={{ marginTop:4, background:"none", border:"1px dashed #C9A87A", borderRadius:3, padding:"7px 14px", fontSize:12, fontWeight:700, color:M, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", letterSpacing:0.5, width:"100%" }}>
        + Add Part
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage]       = useState("new");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [saved,   setSaved]   = useState(false);

  // Directory navigation
  const [selCust,  setSelCust]  = useState(null);
  const [selOrder, setSelOrder] = useState(null);
  const [search,   setSearch]   = useState("");
  const [filterS,  setFilterS]  = useState("All");

  // New order form — 2-step
  const [step,         setStep]         = useState(1);
  const [custMode,     setCustMode]     = useState("new");
  const [pickedCustId, setPickedCustId] = useState("");

  const blankCust  = { name:"", phone:"", address:"", reference:"", notes:"", measurements:{ ...BLANK_M } };
  const blankOrder = { description:"", deadline:"", rows:[blankRow(), blankRow(), blankRow()], total:"", advance:"" };
  const [custForm,  setCustForm]  = useState(blankCust);
  const [orderForm, setOrderForm] = useState(blankOrder);

  // ── Load all data on mount ──────────────────────────────────────────────────
  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      // Load customers
      const { data: custsData, error: custsErr } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      if (custsErr) throw custsErr;

      // Load all orders
      const { data: ordersData, error: ordersErr } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (ordersErr) throw ordersErr;

      // Merge orders into customers
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
      console.error(e);
    }
    setLoading(false);
  }

  // ── Form helpers ────────────────────────────────────────────────────────────
  function scf(k, v) { setCustForm(p => ({ ...p, [k]: v })); }
  function scm(k, v) { setCustForm(p => ({ ...p, measurements: { ...p.measurements, [k]: v } })); }
  function sof(k, v) { setOrderForm(p => ({ ...p, [k]: v })); }

  function goToStep2() {
    if (custMode === "new"      && !custForm.name.trim()) return alert("Please enter the customer name.");
    if (custMode === "existing" && !pickedCustId)         return alert("Please select a customer.");
    setStep(2);
  }

  // ── Save new order ──────────────────────────────────────────────────────────
  async function submitOrder() {
    if (!orderForm.deadline) return alert("Please enter a deadline.");
    setSaving(true);
    setError("");
    try {
      let customerId = pickedCustId;

      // If new customer → insert customer first
      if (custMode === "new") {
        const { data, error: ce } = await supabase
          .from("customers")
          .insert({
            name:         custForm.name.trim(),
            phone:        custForm.phone,
            address:      custForm.address,
            reference:    custForm.reference,
            notes:        custForm.notes,
            measurements: custForm.measurements,
          })
          .select()
          .single();
        if (ce) throw ce;
        customerId = data.id;
      }

      // Insert the order
      const { error: oe } = await supabase
        .from("orders")
        .insert({
          customer_id:  customerId,
          description:  orderForm.description,
          deadline:     orderForm.deadline,
          order_status: "Pending",
          rows:         orderForm.rows.filter(r => r.part.trim()),
          total:        +orderForm.total  || 0,
          advance:      +orderForm.advance || 0,
        });
      if (oe) throw oe;

      // Reload data and reset form
      await loadAll();
      setCustForm(blankCust);
      setOrderForm(blankOrder);
      setPickedCustId("");
      setStep(1);
      setCustMode("new");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError("Failed to save. Please try again.");
      console.error(e);
    }
    setSaving(false);
  }

  // ── Update order status ─────────────────────────────────────────────────────
  async function updOrderStatus(orderId, val) {
    const { error: e } = await supabase
      .from("orders")
      .update({ order_status: val })
      .eq("id", orderId);
    if (e) { setError("Failed to update status."); return; }
    setCustomers(p => p.map(c => ({
      ...c,
      orders: c.orders.map(o => o.id === orderId ? { ...o, orderStatus: val, order_status: val } : o),
    })));
    if (selOrder?.id === orderId) setSelOrder(o => ({ ...o, orderStatus: val }));
  }

  // ── Update kaarigar rows ────────────────────────────────────────────────────
  async function updOrderRows(orderId, rows) {
    const { error: e } = await supabase
      .from("orders")
      .update({ rows })
      .eq("id", orderId);
    if (e) { setError("Failed to update."); return; }
    setCustomers(p => p.map(c => ({
      ...c,
      orders: c.orders.map(o => o.id === orderId ? { ...o, rows } : o),
    })));
    if (selOrder?.id === orderId) setSelOrder(o => ({ ...o, rows }));
  }

  // ── Update payment ──────────────────────────────────────────────────────────
  async function updMoney(orderId, key, val) {
    const { error: e } = await supabase
      .from("orders")
      .update({ [key]: +val || 0 })
      .eq("id", orderId);
    if (e) { setError("Failed to update payment."); return; }
    setCustomers(p => p.map(c => ({
      ...c,
      orders: c.orders.map(o => o.id === orderId ? { ...o, [key]: +val || 0 } : o),
    })));
    if (selOrder?.id === orderId) setSelOrder(o => ({ ...o, [key]: +val || 0 }));
  }

  // ── Update customer measurements ────────────────────────────────────────────
  async function updMeasurement(custId, key, val) {
    const cust = customers.find(c => c.id === custId);
    if (!cust) return;
    const updated = { ...cust.measurements, [key]: val };
    const { error: e } = await supabase
      .from("customers")
      .update({ measurements: updated })
      .eq("id", custId);
    if (e) { setError("Failed to save measurement."); return; }
    setCustomers(p => p.map(c => c.id === custId ? { ...c, measurements: updated } : c));
    if (selCust?.id === custId) setSelCust(c => ({ ...c, measurements: updated }));
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const allOrders = useMemo(() =>
    customers.flatMap(c => c.orders.map(o => ({ ...o, custName: c.name, custId: c.id })))
  , [customers]);

  const stats = useMemo(() => {
    const rev = allOrders.reduce((s, o) => s + (o.total  || 0), 0);
    const rec = allOrders.reduce((s, o) => s + (o.advance|| 0), 0);
    return {
      rev, rec, due: rev - rec,
      delivered: allOrders.filter(o => o.orderStatus === "Delivered").length,
      ready:     allOrders.filter(o => o.orderStatus === "Ready").length,
      inProg:    allOrders.filter(o => o.orderStatus === "In Progress").length,
      pending:   allOrders.filter(o => o.orderStatus === "Pending").length,
      total:     allOrders.length,
    };
  }, [allOrders]);

  const filteredCusts = useMemo(() =>
    customers.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone||"").includes(search);
      if (!matchSearch) return false;
      if (filterS === "All") return true;
      return c.orders.some(o => o.orderStatus === filterS);
    })
  , [customers, search, filterS]);

  const navPages = [
    { id:"new",       label:"New Order"  },
    { id:"directory", label:"Customers"  },
    { id:"dashboard", label:"Dashboard"  },
  ];

  // ── Navigate helper ─────────────────────────────────────────────────────────
  function goPage(p) { setPage(p); setSelCust(null); setSelOrder(null); setStep(1); }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:"100vh", background:CREAM, fontFamily:"'Cormorant Garamond',Georgia,serif", color:D }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;}
        input:focus,select:focus,textarea:focus{outline:1.5px solid #B07D45;outline-offset:0;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#D9CCBC;}
        @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .card{animation:up 0.28s ease both;}
        .rh:hover{background:#F7F0E8!important;cursor:pointer;}
        .nav-btn:hover{color:#B07D45!important;}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background:D, borderBottom:"3px solid #B07D45" }}>
        <div style={{ maxWidth:720, margin:"0 auto", padding:"0 20px" }}>
          <div style={{ padding:"18px 0 12px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ color:"#E8C98A", fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:22, letterSpacing:2, textTransform:"uppercase" }}>Shades of Patiala</div>
            <div style={{ color:"rgba(232,201,138,0.45)", fontSize:11, letterSpacing:4, textTransform:"uppercase", marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>Boutique Management</div>
          </div>
          <div style={{ display:"flex" }}>
            {navPages.map(t => (
              <button key={t.id} className="nav-btn" onClick={() => goPage(t.id)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:"13px 20px", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", color:page===t.id?"#E8C98A":"rgba(232,201,138,0.45)", borderBottom:page===t.id?"2px solid #B07D45":"2px solid transparent", letterSpacing:1.5, textTransform:"uppercase", transition:"color 0.15s" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"28px 16px 70px" }}>

        {/* Global error */}
        {error && (
          <div style={{ background:"#FDF0EE", border:"1px solid #E8B4A8", borderRadius:3, padding:"11px 16px", marginBottom:16, color:"#8B1A00", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600 }}>
            ⚠ {error}
          </div>
        )}

        {loading && <Spinner />}

        {/* ══════════════════════════════════════
            NEW ORDER — 2-step
        ══════════════════════════════════════ */}
        {!loading && page === "new" && (
          <div className="card">
            <div style={{ marginBottom:22, paddingBottom:16, borderBottom:`1px solid ${BORDER}` }}>
              <h1 style={{ margin:0, fontSize:26, fontWeight:600, letterSpacing:0.5 }}>New Order</h1>
              {/* Step indicator */}
              <div style={{ display:"flex", gap:0, marginTop:12, fontFamily:"'DM Sans',sans-serif" }}>
                {["Customer","Order Details"].map((l, i) => (
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:22, height:22, borderRadius:"50%", background:step===i+1?D:"#E2D5C3", color:step===i+1?"#E8C98A":"#9A7250", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>{i+1}</div>
                    <span style={{ fontSize:12, fontWeight:700, color:step===i+1?D:M, letterSpacing:0.5, textTransform:"uppercase" }}>{l}</span>
                    {i===0 && <div style={{ width:32, height:1, background:"#D9CCBC", margin:"0 8px" }} />}
                  </div>
                ))}
              </div>
            </div>

            {saved && (
              <div style={{ background:"#EDF5EE", border:"1px solid #B5D8B9", borderRadius:3, padding:"11px 16px", marginBottom:16, color:"#1A4A20", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600 }}>
                Order saved successfully. View it in the Customers directory.
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <Sect title="New or returning customer?">
                  <div style={{ display:"flex", gap:10, marginBottom:20 }}>
                    {["new","existing"].map(m => (
                      <button key={m} onClick={() => setCustMode(m)}
                        style={{ flex:1, padding:"11px", border:`1.5px solid ${custMode===m?D:BORDER}`, borderRadius:3, background:custMode===m?D:CREAM, color:custMode===m?"#E8C98A":M, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", letterSpacing:0.5, textTransform:"uppercase", transition:"all 0.15s" }}>
                        {m==="new" ? "New Customer" : "Returning Customer"}
                      </button>
                    ))}
                  </div>

                  {/* Existing customer picker */}
                  {custMode === "existing" && (
                    <div>
                      <label style={LBL}>Select Customer</label>
                      <select style={SS} value={pickedCustId} onChange={e => setPickedCustId(e.target.value)}>
                        <option value="">— Choose from directory —</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} · {c.phone || "no phone"}</option>
                        ))}
                      </select>
                      {pickedCustId && (() => {
                        const c   = customers.find(c => c.id === pickedCustId);
                        const filled = MEASUREMENTS.filter(([k]) => c?.measurements?.[k]);
                        return c ? (
                          <div style={{ marginTop:14, background:"#F7F0E8", border:`1px solid ${BORDER}`, borderRadius:3, padding:"12px 16px" }}>
                            <div style={{ fontWeight:600, fontSize:15, marginBottom:4 }}>{c.name}</div>
                            <div style={{ fontSize:12, color:M, fontFamily:"'DM Sans',sans-serif", marginBottom:8 }}>{c.phone} {c.address && `· ${c.address}`}</div>
                            <div style={{ fontSize:11, fontWeight:700, color:M, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>
                              Saved Measurements ({filled.length} recorded)
                            </div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                              {filled.map(([k, l]) => (
                                <span key={k} style={{ fontSize:12, background:"#fff", border:`1px solid ${BORDER}`, borderRadius:2, padding:"3px 9px", fontFamily:"'DM Sans',sans-serif", color:D }}>
                                  {l}: <b>{c.measurements[k]}"</b>
                                </span>
                              ))}
                            </div>
                            {c.orders.length > 0 && (
                              <div style={{ marginTop:8, fontSize:12, color:M, fontFamily:"'DM Sans',sans-serif" }}>
                                {c.orders.length} previous order{c.orders.length > 1 ? "s" : ""} on record
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* New customer form */}
                  {custMode === "new" && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div style={{ gridColumn:"span 2" }}>
                        <label style={LBL}>Full Name *</label>
                        <input style={IS} value={custForm.name} onChange={e => scf("name", e.target.value)} placeholder="Customer name" />
                      </div>
                      <div>
                        <label style={LBL}>Mobile</label>
                        <input style={IS} value={custForm.phone} onChange={e => scf("phone", e.target.value)} placeholder="03xx-xxxxxxx" />
                      </div>
                      <div>
                        <label style={LBL}>Reference</label>
                        <input style={IS} value={custForm.reference} onChange={e => scf("reference", e.target.value)} placeholder="Referred by…" />
                      </div>
                      <div style={{ gridColumn:"span 2" }}>
                        <label style={LBL}>Address</label>
                        <input style={IS} value={custForm.address} onChange={e => scf("address", e.target.value)} placeholder="Optional" />
                      </div>
                      <div style={{ gridColumn:"span 2" }}>
                        <label style={LBL}>Notes</label>
                        <input style={IS} value={custForm.notes} onChange={e => scf("notes", e.target.value)} placeholder="Fitting preferences…" />
                      </div>
                    </div>
                  )}
                </Sect>

                {custMode === "new" && (
                  <Sect title="Measurements (inches)">
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                      {MEASUREMENTS.map(([k, l]) => (
                        <div key={k}>
                          <label style={LBL}>{l}</label>
                          <input type="text" style={IS} value={custForm.measurements[k]} onChange={e => scm(k, e.target.value)} placeholder="—" />
                        </div>
                      ))}
                    </div>
                  </Sect>
                )}

                <button onClick={goToStep2}
                  style={{ width:"100%", background:D, color:"#E8C98A", border:"2px solid #B07D45", borderRadius:3, padding:"14px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", letterSpacing:2, textTransform:"uppercase" }}>
                  Continue to Order Details →
                </button>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <div style={{ background:"#F7F0E8", border:`1px solid ${BORDER}`, borderRadius:3, padding:"11px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <span style={{ fontSize:11, fontWeight:700, color:M, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Customer — </span>
                    <span style={{ fontWeight:600, fontSize:15 }}>
                      {custMode === "new" ? custForm.name : customers.find(c => c.id === pickedCustId)?.name}
                    </span>
                  </div>
                  <button onClick={() => setStep(1)} style={{ background:"none", border:"none", color:G, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", letterSpacing:0.5 }}>← Change</button>
                </div>

                <Sect title="Order Description">
                  <label style={LBL}>Design & Fabric Details</label>
                  <textarea style={{ ...IS, minHeight:76, resize:"vertical" }} value={orderForm.description} onChange={e => sof("description", e.target.value)} placeholder="Fabric, colour, embroidery, special instructions…" />
                  <div style={{ marginTop:12 }}>
                    <label style={LBL}>Deadline *</label>
                    <input type="date" style={{ ...IS, maxWidth:220 }} value={orderForm.deadline} onChange={e => sof("deadline", e.target.value)} />
                  </div>
                </Sect>

                <Sect title="Kaarigar Assignment">
                  <p style={{ margin:"0 0 14px", fontSize:13, color:M, fontFamily:"'DM Sans',sans-serif" }}>Write each part and the worker responsible for it</p>
                  <KaarigarsEditor rows={orderForm.rows} onChange={rows => sof("rows", rows)} />
                </Sect>

                <Sect title="Payment">
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div>
                      <label style={LBL}>Total Amount (Rs.)</label>
                      <input type="number" style={IS} value={orderForm.total} onChange={e => sof("total", e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <label style={LBL}>Advance Received (Rs.)</label>
                      <input type="number" style={IS} value={orderForm.advance} onChange={e => sof("advance", e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  {(orderForm.total || orderForm.advance) ? (
                    <div style={{ marginTop:12, background:"#F9EDD8", border:`1px solid ${BORDER}`, borderRadius:3, padding:"10px 14px", display:"flex", justifyContent:"space-between", fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
                      <span style={{ color:M }}>Balance Due</span>
                      <span style={{ fontWeight:700, color:"#8B1A00" }}>{fmt((+orderForm.total||0) - (+orderForm.advance||0))}</span>
                    </div>
                  ) : null}
                </Sect>

                <button onClick={submitOrder} disabled={saving}
                  style={{ width:"100%", background:saving?"#9A7250":D, color:"#E8C98A", border:"2px solid #B07D45", borderRadius:3, padding:"15px", fontSize:13, fontWeight:700, cursor:saving?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", letterSpacing:2, textTransform:"uppercase", marginTop:4 }}>
                  {saving ? "Saving…" : "Save Order"}
                </button>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            DIRECTORY — Customer list
        ══════════════════════════════════════ */}
        {!loading && page === "directory" && !selCust && (
          <div className="card">
            <div style={{ marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${BORDER}` }}>
              <h1 style={{ margin:0, fontSize:26, fontWeight:600, letterSpacing:0.5 }}>Customer Directory</h1>
              <p style={{ margin:"5px 0 0", color:M, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>{customers.length} customers · {allOrders.length} total orders</p>
            </div>
            <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
              <input placeholder="Search by name or phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...IS, flex:1, minWidth:160 }} />
              <select style={{ ...SS, width:"auto" }} value={filterS} onChange={e => setFilterS(e.target.value)}>
                <option value="All">All Statuses</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {filteredCusts.length === 0 && <p style={{ color:"#BFA080", fontFamily:"'DM Sans',sans-serif" }}>No customers found.</p>}
            {filteredCusts.map((c, i) => (
              <div key={c.id} className="rh card" style={{ background:"#fff", border:`1px solid ${BORDER}`, borderRadius:3, padding:"16px 18px", marginBottom:8, transition:"background 0.15s", animationDelay:`${i*0.04}s` }}
                onClick={() => { setSelCust(c); setSelOrder(null); }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, flexWrap:"wrap" }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:18, letterSpacing:0.3 }}>{c.name}</div>
                    <div style={{ fontSize:12, color:M, fontFamily:"'DM Sans',sans-serif", marginTop:3 }}>{c.phone||"—"}{c.reference ? ` · Ref: ${c.reference}` : ""}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:M, fontFamily:"'DM Sans',sans-serif" }}>{c.orders.length} order{c.orders.length !== 1 ? "s" : ""}</span>
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"flex-end" }}>
                      {c.orders.map(o => <Pill key={o.id} s={o.orderStatus} />)}
                    </div>
                  </div>
                </div>
                {c.orders.length > 0 && (
                  <div style={{ marginTop:10, fontSize:12, color:"#8B1A00", fontFamily:"'DM Sans',sans-serif", fontWeight:700 }}>
                    Total due: {fmt(c.orders.reduce((s, o) => s + ((o.total||0) - (o.advance||0)), 0))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Customer profile ── */}
        {!loading && page === "directory" && selCust && !selOrder && (
          <div className="card">
            <button onClick={() => setSelCust(null)} style={{ background:"none", border:"none", color:G, fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:18, padding:0, letterSpacing:0.5 }}>← Back to Directory</button>

            <div style={{ background:D, border:"2px solid #B07D45", borderRadius:3, padding:"20px 22px", marginBottom:16, color:"#E8C98A" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, letterSpacing:2, textTransform:"uppercase", opacity:0.55, marginBottom:4 }}>Customer Profile</div>
              <h2 style={{ margin:"0 0 4px", fontSize:24, fontWeight:600 }}>{selCust.name}</h2>
              <div style={{ fontSize:13, opacity:0.65, fontFamily:"'DM Sans',sans-serif" }}>
                {selCust.phone && <span>{selCust.phone}</span>}
                {selCust.address && <span> · {selCust.address}</span>}
                {selCust.reference && <span> · Ref: {selCust.reference}</span>}
              </div>
              {selCust.notes && <div style={{ marginTop:5, fontSize:12, opacity:0.6, fontFamily:"'DM Sans',sans-serif", fontStyle:"italic" }}>{selCust.notes}</div>}
            </div>

            <Sect title="Measurements (inches)">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {MEASUREMENTS.map(([k, l]) => (
                  <div key={k}>
                    <label style={LBL}>{l}</label>
                    <input type="text" style={IS}
                      defaultValue={selCust.measurements?.[k] || ""}
                      onBlur={e => updMeasurement(selCust.id, k, e.target.value)}
                      placeholder="—" />
                  </div>
                ))}
              </div>
            </Sect>

            <Sect title={`Orders (${selCust.orders.length})`} action={
              <button onClick={() => { setCustMode("existing"); setPickedCustId(selCust.id); setStep(2); setPage("new"); }}
                style={{ background:D, color:"#E8C98A", border:"none", borderRadius:2, padding:"5px 14px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", letterSpacing:1, textTransform:"uppercase" }}>
                + New Order
              </button>
            }>
              {selCust.orders.length === 0 && <p style={{ margin:0, color:"#BFA080", fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>No orders yet.</p>}
              {customers.find(c => c.id === selCust.id)?.orders.map((o, i) => (
                <div key={o.id} className="rh" style={{ background:i%2===0?"#FDFAF6":"#fff", border:`1px solid ${BORDER}`, borderRadius:3, padding:"14px 16px", marginBottom:8, transition:"background 0.15s" }}
                  onClick={() => setSelOrder(o)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, flexWrap:"wrap" }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:15, lineHeight:1.4 }}>{o.description || "(no description)"}</div>
                      <div style={{ fontSize:12, color:"#8B1A00", fontFamily:"'DM Sans',sans-serif", marginTop:3 }}>Deadline: {o.deadline} · Added: {o.createdAt}</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
                      <Pill s={o.orderStatus} />
                      <span style={{ fontSize:12, fontWeight:700, color:"#8B1A00", fontFamily:"'DM Sans',sans-serif" }}>{fmt((o.total||0) - (o.advance||0))} due</span>
                    </div>
                  </div>
                  {o.rows?.length > 0 && (
                    <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
                      {o.rows.filter(r => r.part).map(r => (
                        <span key={r.id} style={{ fontSize:11, background:"#F7F0E8", border:`1px solid ${BORDER}`, borderRadius:2, padding:"2px 9px", fontFamily:"'DM Sans',sans-serif", color:M }}>
                          {r.part}{r.kaarigar ? <>: <b style={{ color:D }}>{r.kaarigar}</b></> : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Sect>
          </div>
        )}

        {/* ── Order detail ── */}
        {!loading && page === "directory" && selCust && selOrder && (
          <div className="card">
            <button onClick={() => setSelOrder(null)} style={{ background:"none", border:"none", color:G, fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:18, padding:0, letterSpacing:0.5 }}>← Back to {selCust.name}</button>

            <div style={{ background:D, border:"2px solid #B07D45", borderRadius:3, padding:"18px 22px", marginBottom:16, color:"#E8C98A" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, letterSpacing:2, textTransform:"uppercase", opacity:0.55, marginBottom:4 }}>Order · {selCust.name}</div>
              <p style={{ margin:"0 0 12px", fontSize:15, opacity:0.9, lineHeight:1.5 }}>{selOrder.description || "(no description)"}</p>
              <div style={{ fontSize:12, opacity:0.65, fontFamily:"'DM Sans',sans-serif", marginBottom:12 }}>Deadline: {selOrder.deadline} · Added: {selOrder.createdAt}</div>
              <select value={selOrder.orderStatus} onChange={e => updOrderStatus(selOrder.id, e.target.value)}
                style={{ ...SS, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(232,201,138,0.35)", color:"#E8C98A", width:"auto", fontWeight:700 }}>
                {STATUSES.map(s => <option key={s} style={{ background:D }}>{s}</option>)}
              </select>
            </div>

            <Sect title="Kaarigar Assignment">
              <KaarigarsEditor rows={selOrder.rows || []} onChange={rows => updOrderRows(selOrder.id, rows)} />
            </Sect>

            <Sect title="Payment">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={LBL}>Total (Rs.)</label>
                  <input type="number" style={IS} defaultValue={selOrder.total} onBlur={e => updMoney(selOrder.id, "total", e.target.value)} />
                </div>
                <div>
                  <label style={LBL}>Advance Received (Rs.)</label>
                  <input type="number" style={IS} defaultValue={selOrder.advance} onBlur={e => updMoney(selOrder.id, "advance", e.target.value)} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                {[
                  { l:"Total",       v:selOrder.total,                             c:"#1A4A20", bg:"#EDF5EE" },
                  { l:"Received",    v:selOrder.advance,                           c:"#1A3A6B", bg:"#EEF2F8" },
                  { l:"Balance Due", v:(selOrder.total||0)-(selOrder.advance||0),  c:"#8B1A00", bg:"#FDF3E3" },
                ].map(p => (
                  <div key={p.l} style={{ background:p.bg, border:`1px solid ${BORDER}`, borderRadius:3, padding:"12px 10px", textAlign:"center" }}>
                    <div style={{ fontSize:15, fontWeight:700, color:p.c, fontFamily:"'DM Sans',sans-serif" }}>{fmt(p.v)}</div>
                    <div style={{ fontSize:10, color:"#7A6040", marginTop:4, fontFamily:"'DM Sans',sans-serif", letterSpacing:0.5, textTransform:"uppercase" }}>{p.l}</div>
                  </div>
                ))}
              </div>
              {(selOrder.total - selOrder.advance === 0) && selOrder.total > 0 && (
                <div style={{ marginTop:10, background:"#EDF5EE", border:"1px solid #B5D8B9", borderRadius:3, padding:"8px 14px", color:"#1A4A20", fontSize:12, fontFamily:"'DM Sans',sans-serif", fontWeight:600, textAlign:"center", letterSpacing:0.5 }}>
                  Payment fully cleared
                </div>
              )}
            </Sect>
          </div>
        )}

        {/* ══════════════════════════════════════
            DASHBOARD
        ══════════════════════════════════════ */}
        {!loading && page === "dashboard" && (
          <div className="card">
            <div style={{ marginBottom:22, paddingBottom:16, borderBottom:`1px solid ${BORDER}` }}>
              <h1 style={{ margin:0, fontSize:26, fontWeight:600, letterSpacing:0.5 }}>Dashboard</h1>
              <p style={{ margin:"5px 0 0", color:M, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>Financial and order overview — Shades of Patiala</p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
              {[
                { label:"Total Revenue",   val:fmt(stats.rev), sub:"all orders",      bg:D,         fg:"#E8C98A", sfg:"rgba(232,201,138,0.45)" },
                { label:"Amount Received", val:fmt(stats.rec), sub:"advance payments", bg:"#1A4A20", fg:"#C8E6C9", sfg:"rgba(200,230,201,0.55)" },
                { label:"Pending Dues",    val:fmt(stats.due), sub:"to be collected",  bg:"#6B1A00", fg:"#FFCCBC", sfg:"rgba(255,204,188,0.55)" },
              ].map(c => (
                <div key={c.label} style={{ background:c.bg, borderRadius:3, padding:"16px 14px", color:c.fg }}>
                  <div style={{ fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", lineHeight:1.3 }}>{c.val}</div>
                  <div style={{ fontSize:10, fontWeight:700, marginTop:7, opacity:0.85, textTransform:"uppercase", letterSpacing:1.5 }}>{c.label}</div>
                  <div style={{ fontSize:10, marginTop:2, color:c.sfg, fontFamily:"'DM Sans',sans-serif" }}>{c.sub}</div>
                </div>
              ))}
            </div>

            <Sect title="Orders by Status">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { label:"Total Orders",    val:stats.total,     c:D,         bg:"#F7F0E8" },
                  { label:"Pending",         val:stats.pending,   c:"#7D4E00", bg:"#FDF3E3" },
                  { label:"In Progress",     val:stats.inProg,    c:"#1A3A6B", bg:"#EEF2F8" },
                  { label:"Ready for Pickup",val:stats.ready,     c:"#1A4A20", bg:"#EDF5EE" },
                  { label:"Delivered",       val:stats.delivered, c:"#3A1A5C", bg:"#F3F0F8" },
                ].map(s => (
                  <div key={s.label} style={{ background:s.bg, border:`1px solid ${BORDER}`, borderRadius:3, padding:"13px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#555", textTransform:"uppercase", letterSpacing:0.5 }}>{s.label}</span>
                    <span style={{ fontSize:26, fontWeight:700, color:s.c, fontFamily:"'DM Sans',sans-serif" }}>{s.val}</span>
                  </div>
                ))}
              </div>
            </Sect>

            <Sect title="Completion Rate">
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontFamily:"'DM Sans',sans-serif", color:M, marginBottom:8 }}>
                <span>{stats.delivered} delivered of {stats.total} total</span>
                <span style={{ fontWeight:700 }}>{stats.total ? Math.round(stats.delivered / stats.total * 100) : 0}%</span>
              </div>
              <div style={{ height:10, background:"#E2D5C3", borderRadius:1, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${stats.total ? (stats.delivered/stats.total*100) : 0}%`, background:D, borderRadius:1, transition:"width 0.6s ease" }} />
              </div>
            </Sect>

            <Sect title="Payment Collection Rate">
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontFamily:"'DM Sans',sans-serif", color:M, marginBottom:8 }}>
                <span>{fmt(stats.rec)} collected of {fmt(stats.rev)}</span>
                <span style={{ fontWeight:700 }}>{stats.rev ? Math.round(stats.rec / stats.rev * 100) : 0}%</span>
              </div>
              <div style={{ height:10, background:"#E2D5C3", borderRadius:1, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${stats.rev ? (stats.rec/stats.rev*100) : 0}%`, background:"#1A4A20", borderRadius:1, transition:"width 0.6s ease" }} />
              </div>
            </Sect>

            <Sect title="All Orders">
              {allOrders.length === 0 && <p style={{ margin:0, color:"#BFA080", fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>No orders yet.</p>}
              {allOrders.map(o => (
                <div key={o.id}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${BORDER}`, flexWrap:"wrap", gap:8, cursor:"pointer" }}
                  onClick={() => { const c = customers.find(c => c.id === o.custId); setSelCust(c); setSelOrder(o); setPage("directory"); }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:15, letterSpacing:0.3 }}>{o.custName}</div>
                    <div style={{ fontSize:12, color:M, fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{o.description?.slice(0, 50) || "—"} · Due: {o.deadline}</div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <Pill s={o.orderStatus} />
                    <span style={{ fontSize:12, fontWeight:700, color:"#8B1A00", fontFamily:"'DM Sans',sans-serif" }}>{fmt((o.total||0) - (o.advance||0))} due</span>
                  </div>
                </div>
              ))}
            </Sect>
          </div>
        )}
      </div>
    </div>
  );
}

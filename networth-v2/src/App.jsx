import { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const initialData = {
  realEstate: [
    { id: 1, name: "Brooksmere", value: 711000, mortgage: 128745 },
    { id: 2, name: "Brentwood", value: 57505, mortgage: 0 },
  ],
  investments: [
    { id: 1, institution: "BMO Investorline", type: "RRSP", total: 218966, investment: 115626, cash: 103403 },
    { id: 2, institution: "BMO Investorline", type: "TFSA", total: 51307, investment: 36924, cash: 14431 },
    { id: 3, institution: "BMO Investorline", type: "Individual", total: 21185, investment: 40941, cash: 735 },
    { id: 4, institution: "Questrade", type: "Self Directed", total: 50549, investment: 39784, cash: 10764 },
    { id: 5, institution: "Questrade", type: "RRSP", total: 166282, investment: 146369, cash: 19912 },
    { id: 6, institution: "Questrade", type: "TFSA", total: 23664, investment: 21516, cash: 2147 },
    { id: 7, institution: "Wealthsimple", type: "TFSA", total: 14405, investment: 13228, cash: 1177 },
    { id: 8, institution: "Wealthsimple", type: "Non-Registered", total: 171175, investment: 70824, cash: 100351 },
    { id: 9, institution: "Wealthsimple", type: "Cash", total: 13670, investment: 0, cash: 13670 },
    { id: 10, institution: "IB", type: "Non-Registered", total: 5500, investment: 0, cash: 5500 },
    { id: 11, institution: "RBC", type: "Investing", total: 50450, investment: 50450, cash: 0 },
  ],
  bankAccounts: [
    { id: 1, institution: "RBC", type: "Chequing", balance: 3306 },
    { id: 2, institution: "BMO", type: "Chequing/Savings", balance: 10407 },
    { id: 3, institution: "EQ", type: "Savings", balance: 216 },
    { id: 4, institution: "TD", type: "Savings", balance: 5525 },
    { id: 5, institution: "BMO Business", type: "Chequing", balance: 565430 },
  ],
  crypto: [
    { id: 1, platform: "Ndax", value: 14716 },
    { id: 2, platform: "Metamask", value: 650 },
    { id: 3, platform: "Coinsquare", value: 3722 },
    { id: 4, platform: "Bitget", value: 340 },
    { id: 5, platform: "Newton", value: 1080 },
  ],
  owingIncome: [
    { id: 1, source: "Example: Unpaid Invoice", amount: 0 },
  ],
  liabilities: [
    { id: 1, name: "Owing", amount: 19207 },
    { id: 2, name: "Tax Installments", amount: 102575 },
    { id: 3, name: "Loan to OV (1)", amount: 4000 },
    { id: 4, name: "Loan to OV (2)", amount: 5000 },
    { id: 5, name: "Loan to OV (3)", amount: 5000 },
  ],
};

const STORAGE_KEY = "nw_history_v1";
const fmt = (n) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
const fmtShort = (n) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return fmt(n);
};
const pct = (part, total) => (total === 0 ? 0 : ((part / total) * 100).toFixed(1));

const GOLD = "#c9a84c"; const BLUE = "#4a9eda"; const GREEN = "#4ecb71";
const RED = "#e85555"; const PURPLE = "#9b7fe8"; const ORANGE = "#f97316"; const TEAL = "#3dd6c8";

function EditModal({ item, fields, onSave, onClose }) {
  const [vals, setVals] = useState({ ...item });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#0f1923", border: "1px solid #2a3f55", borderRadius: 12, padding: 28, minWidth: 320 }}>
        <h3 style={{ color: "#e8d5a3", fontFamily: "'Playfair Display', serif", marginBottom: 20 }}>Edit Entry</h3>
        {fields.map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ color: "#7a9bb5", fontSize: 12, display: "block", marginBottom: 4 }}>{f.label}</label>
            <input type={f.type || "number"} value={vals[f.key]}
              onChange={e => setVals({ ...vals, [f.key]: f.type === "text" ? e.target.value : Number(e.target.value) })}
              style={{ background: "#1a2d3e", border: "1px solid #2a3f55", borderRadius: 6, color: "#e8d5a3", padding: "8px 12px", width: "100%", fontSize: 14, boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={() => onSave(vals)} style={{ flex: 1, background: GOLD, color: "#0a0f14", border: "none", borderRadius: 6, padding: "10px", fontWeight: 700, cursor: "pointer" }}>Save</button>
          <button onClick={onClose} style={{ flex: 1, background: "#1a2d3e", color: "#7a9bb5", border: "1px solid #2a3f55", borderRadius: 6, padding: "10px", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 20, background: "#0d1821", border: `1px solid ${color}22`, borderRadius: 12, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", cursor: "pointer", background: `${color}11`, borderBottom: open ? `1px solid ${color}22` : "none" }}>
        <span style={{ color, fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>{title}</span>
        <span style={{ color, fontSize: 18 }}>{open ? "−" : "+"}</span>
      </div>
      {open && <div style={{ padding: "16px 20px" }}>{children}</div>}
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const w = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ height: 6, background: "#1a2d3e", borderRadius: 3, overflow: "hidden", marginTop: 6 }}>
      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
    </div>
  );
}

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background: "#0a1520", border: "1px solid #1e3448", borderRadius: 10, padding: "12px 16px", fontFamily: "'DM Sans', sans-serif", minWidth: 180 }}>
      <p style={{ color: "#7a9bb5", fontSize: 11, margin: "0 0 6px", letterSpacing: 1 }}>{d?.dateLabel}</p>
      <p style={{ color: TEAL, fontSize: 16, fontWeight: 700, margin: "0 0 2px" }}>{fmt(payload[0]?.value)}</p>
      {d?.note && <p style={{ color: "#4a6a80", fontSize: 11, margin: "4px 0 0", fontStyle: "italic" }}>"{d.note}"</p>}
      {d?.live && <p style={{ color: GOLD, fontSize: 10, margin: "4px 0 0", letterSpacing: 1 }}>LIVE VALUE</p>}
    </div>
  );
};

export default function App() {
  const [data, setData] = useState(initialData);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActive] = useState("overview");
  const [chartRange, setChartRange] = useState("3m");
  const [snapNote, setSnapNote] = useState("");
  const [showSnapInput, setShowSnapInput] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [history, setHistory] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch {}
  }, [history]);

  const calc = useMemo(() => {
    const reEquity = data.realEstate.reduce((s, p) => s + p.value - p.mortgage, 0);
    const invTotal = data.investments.reduce((s, i) => s + i.total, 0);
    const bankTotal = data.bankAccounts.reduce((s, a) => s + a.balance, 0);
    const cryptoTotal = data.crypto.reduce((s, c) => s + c.value, 0);
    const owingIncomeTotal = data.owingIncome.reduce((s, o) => s + o.amount, 0);
    const liabTotal = data.liabilities.reduce((s, l) => s + l.amount, 0);
    const totalAssets = reEquity + invTotal + bankTotal + cryptoTotal + owingIncomeTotal;
    const netWorth = totalAssets - liabTotal;
    return { reEquity, invTotal, bankTotal, cryptoTotal, owingIncomeTotal, liabTotal, totalAssets, netWorth };
  }, [data]);

  const saveSnapshot = () => {
    const now = new Date();
    const snap = {
      id: Date.now(),
      date: now.toISOString(),
      dateLabel: now.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }),
      netWorth: calc.netWorth,
      totalAssets: calc.totalAssets,
      liabilities: calc.liabTotal,
      note: snapNote.trim(),
      breakdown: { realEstate: calc.reEquity, investments: calc.invTotal, banking: calc.bankTotal, crypto: calc.cryptoTotal, owingIncome: calc.owingIncomeTotal },
    };
    setHistory(prev => [...prev, snap].sort((a, b) => new Date(a.date) - new Date(b.date)));
    setSnapNote(""); setShowSnapInput(false);
  };

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const days = { "3m": 90, "6m": 180, "1y": 365, "all": Infinity }[chartRange] || 90;
    return history.filter(s => (now - new Date(s.date)) / 86400000 <= days);
  }, [history, chartRange]);

  const chartData = useMemo(() => {
    const pts = filteredHistory.map(s => ({ ...s, value: s.netWorth }));
    pts.push({ id: "live", date: new Date().toISOString(), dateLabel: "Now", netWorth: calc.netWorth, value: calc.netWorth, live: true });
    return pts;
  }, [filteredHistory, calc.netWorth]);

  const change = useMemo(() => {
    if (!filteredHistory.length) return null;
    const first = filteredHistory[0].netWorth;
    const diff = calc.netWorth - first;
    const pctChange = first !== 0 ? ((diff / Math.abs(first)) * 100).toFixed(1) : "0";
    return { diff, pctChange, from: filteredHistory[0].dateLabel };
  }, [filteredHistory, calc.netWorth]);

  const tabs = ["overview", "real estate", "investments", "banking", "crypto", "owing income", "liabilities"];
  const update = (cat, id, vals) => { setData(prev => ({ ...prev, [cat]: prev[cat].map(x => x.id === id ? { ...x, ...vals } : x) })); setEditing(null); };
  const addItem = (cat, template) => { const newId = Math.max(...data[cat].map(x => x.id), 0) + 1; setData(prev => ({ ...prev, [cat]: [...prev[cat], { ...template, id: newId }] })); };
  const removeItem = (cat, id) => setData(prev => ({ ...prev, [cat]: prev[cat].filter(x => x.id !== id) }));

  return (
    <div style={{ minHeight: "100vh", background: "#070e16", fontFamily: "'DM Sans', sans-serif", color: "#cdd9e5" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0a141e 0%, #0f1f2e 100%)", borderBottom: "1px solid #1a2d3e", padding: "24px 28px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ color: GOLD, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", margin: 0 }}>Personal Finance</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#f0e6c8", margin: "4px 0 16px" }}>Net Worth Tracker</h1>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <p style={{ color: "#7a9bb5", fontSize: 11, margin: "0 0 2px", letterSpacing: 1 }}>TOTAL NET WORTH</p>
              <p style={{ color: calc.netWorth >= 0 ? GREEN : RED, fontSize: 36, fontWeight: 700, margin: 0 }}>{fmt(calc.netWorth)}</p>
              {change && (
                <p style={{ color: change.diff >= 0 ? GREEN : RED, fontSize: 12, margin: "4px 0 0" }}>
                  {change.diff >= 0 ? "▲" : "▼"} {fmt(Math.abs(change.diff))} ({change.pctChange}%) since {change.from}
                </p>
              )}
            </div>
            <div style={{ borderLeft: "1px solid #1a2d3e", paddingLeft: 24 }}>
              <p style={{ color: "#7a9bb5", fontSize: 11, margin: "0 0 2px", letterSpacing: 1 }}>TOTAL ASSETS</p>
              <p style={{ color: BLUE, fontSize: 24, fontWeight: 600, margin: 0 }}>{fmt(calc.totalAssets)}</p>
            </div>
            <div style={{ borderLeft: "1px solid #1a2d3e", paddingLeft: 24 }}>
              <p style={{ color: "#7a9bb5", fontSize: 11, margin: "0 0 2px", letterSpacing: 1 }}>TOTAL LIABILITIES</p>
              <p style={{ color: RED, fontSize: 24, fontWeight: 600, margin: 0 }}>{fmt(calc.liabTotal)}</p>
            </div>
            <div style={{ marginLeft: "auto" }}>
              {!showSnapInput ? (
                <button onClick={() => setShowSnapInput(true)} style={{ background: GOLD, color: "#0a0f14", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
                  📸 Save Snapshot
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input placeholder="Optional note..." value={snapNote} onChange={e => setSnapNote(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveSnapshot()} autoFocus
                    style={{ background: "#1a2d3e", border: "1px solid #2a3f55", borderRadius: 6, color: "#e8d5a3", padding: "8px 12px", fontSize: 13, width: 160 }} />
                  <button onClick={saveSnapshot} style={{ background: GOLD, color: "#0a0f14", border: "none", borderRadius: 6, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Save</button>
                  <button onClick={() => setShowSnapInput(false)} style={{ background: "#1a2d3e", color: "#7a9bb5", border: "1px solid #2a3f55", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontSize: 13 }}>✕</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#0a141e", borderBottom: "1px solid #1a2d3e", padding: "0 28px", overflowX: "auto" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActive(t)} style={{ background: "none", border: "none", borderBottom: activeTab === t ? `2px solid ${GOLD}` : "2px solid transparent", color: activeTab === t ? GOLD : "#7a9bb5", padding: "14px 18px", cursor: "pointer", fontSize: 13, fontWeight: 500, textTransform: "capitalize", whiteSpace: "nowrap", transition: "color 0.2s" }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px" }}>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            {/* NET WORTH HISTORY CHART */}
            <div style={{ background: "#0d1821", border: "1px solid #1a2d3e", borderRadius: 14, padding: "20px 20px 16px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h3 style={{ color: "#f0e6c8", fontFamily: "'Playfair Display', serif", margin: "0 0 2px", fontSize: 17 }}>Net Worth Over Time</h3>
                  <p style={{ color: "#4a6a80", fontSize: 12, margin: 0 }}>
                    {history.length === 0 ? "Hit 📸 Save Snapshot to start tracking" : `${history.length} snapshot${history.length !== 1 ? "s" : ""} · always shows live value`}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["3m", "6m", "1y", "all"].map(r => (
                    <button key={r} onClick={() => setChartRange(r)} style={{ background: chartRange === r ? TEAL + "22" : "transparent", border: `1px solid ${chartRange === r ? TEAL : "#1a2d3e"}`, color: chartRange === r ? TEAL : "#4a6a80", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {chartData.length < 2 ? (
                <div style={{ height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed #1a2d3e", borderRadius: 10 }}>
                  <p style={{ fontSize: 36, margin: "0 0 10px" }}>📸</p>
                  <p style={{ color: "#4a6a80", fontSize: 13, margin: 0, textAlign: "center", lineHeight: 1.6 }}>
                    Click <strong style={{ color: GOLD }}>Save Snapshot</strong> above<br />to record today's net worth and start your chart
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 10, bottom: 0, left: 10 }}>
                    <defs>
                      <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={TEAL} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={TEAL} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2d3e" />
                    <XAxis dataKey="dateLabel" stroke="#1a2d3e" tick={{ fill: "#4a6a80", fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis stroke="#1a2d3e" tick={{ fill: "#4a6a80", fontSize: 10 }} tickFormatter={fmtShort} width={62} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="value" stroke={TEAL} strokeWidth={2.5} fill="url(#nwGrad)"
                      dot={({ cx, cy, payload }) => payload.live
                        ? <circle key="live" cx={cx} cy={cy} r={6} fill={GOLD} stroke="#070e16" strokeWidth={2} />
                        : <circle key={payload.id} cx={cx} cy={cy} r={3.5} fill={TEAL} strokeWidth={0} />}
                      activeDot={{ r: 6, fill: TEAL }} name="Net Worth" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {/* Snapshot history list */}
              {history.length > 0 && (
                <div style={{ marginTop: 16, borderTop: "1px solid #1a2d3e", paddingTop: 14 }}>
                  <p style={{ color: "#4a6a80", fontSize: 11, letterSpacing: 1, margin: "0 0 10px" }}>SNAPSHOT HISTORY</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                    {[...history].reverse().map((s, ri) => {
                      const idx = history.findIndex(h => h.id === s.id);
                      const prev = idx > 0 ? history[idx - 1].netWorth : null;
                      const diff = prev !== null ? s.netWorth - prev : null;
                      return (
                        <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#060d14", borderRadius: 8, border: "1px solid #1a2d3e" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <span style={{ color: "#4a6a80", fontSize: 11, whiteSpace: "nowrap" }}>{s.dateLabel}</span>
                            {s.note && <span style={{ color: "#4a6a80", fontSize: 11, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{s.note}"</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                            <span style={{ color: "#cdd9e5", fontSize: 13, fontWeight: 600 }}>{fmt(s.netWorth)}</span>
                            {diff !== null && (
                              <span style={{ color: diff >= 0 ? GREEN : RED, fontSize: 11, minWidth: 64, textAlign: "right" }}>
                                {diff >= 0 ? "▲" : "▼"} {fmtShort(Math.abs(diff))}
                              </span>
                            )}
                            {deleteConfirm === s.id ? (
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => { setHistory(prev => prev.filter(x => x.id !== s.id)); setDeleteConfirm(null); }} style={{ background: RED + "22", border: `1px solid ${RED}`, color: RED, borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>Delete</button>
                                <button onClick={() => setDeleteConfirm(null)} style={{ background: "#1a2d3e", border: "none", color: "#7a9bb5", borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(s.id)} style={{ background: "transparent", border: "none", color: "#2a4060", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1 }}>✕</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Asset breakdown cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Real Estate Equity", val: calc.reEquity, color: GOLD },
                { label: "Investments", val: calc.invTotal, color: BLUE },
                { label: "Cash & Banking", val: calc.bankTotal, color: GREEN },
                { label: "Crypto", val: calc.cryptoTotal, color: PURPLE },
                { label: "Owing Income", val: calc.owingIncomeTotal, color: ORANGE },
              ].map(c => (
                <div key={c.label} style={{ background: "#0d1821", border: `1px solid ${c.color}22`, borderRadius: 12, padding: 18 }}>
                  <p style={{ color: "#7a9bb5", fontSize: 11, letterSpacing: 1, margin: "0 0 6px" }}>{c.label.toUpperCase()}</p>
                  <p style={{ color: c.color, fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>{fmt(c.val)}</p>
                  <p style={{ color: "#7a9bb5", fontSize: 12, margin: 0 }}>{pct(c.val, calc.totalAssets)}% of assets</p>
                  <ProgressBar value={c.val} max={calc.totalAssets} color={c.color} />
                </div>
              ))}
            </div>

            {/* Allocation breakdown */}
            <div style={{ background: "#0d1821", border: "1px solid #1a2d3e", borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: GOLD, fontFamily: "'Playfair Display', serif", margin: "0 0 16px" }}>Asset Allocation</h3>
              {[
                { label: "Real Estate Equity", val: calc.reEquity, color: GOLD },
                { label: "Investments", val: calc.invTotal, color: BLUE },
                { label: "Cash & Banking", val: calc.bankTotal, color: GREEN },
                { label: "Crypto", val: calc.cryptoTotal, color: PURPLE },
                { label: "Owing Income", val: calc.owingIncomeTotal, color: ORANGE },
              ].map(c => (
                <div key={c.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#cdd9e5", fontSize: 13 }}>{c.label}</span>
                    <span style={{ color: c.color, fontSize: 13, fontWeight: 600 }}>{fmt(c.val)} <span style={{ color: "#7a9bb5", fontWeight: 400 }}>({pct(c.val, calc.totalAssets)}%)</span></span>
                  </div>
                  <ProgressBar value={c.val} max={calc.totalAssets} color={c.color} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REAL ESTATE */}
        {activeTab === "real estate" && (
          <Section title="Real Estate" color={GOLD}>
            {data.realEstate.map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #1a2d3e" }}>
                <div>
                  <p style={{ color: "#f0e6c8", fontWeight: 600, margin: "0 0 2px" }}>{p.name}</p>
                  <p style={{ color: "#7a9bb5", fontSize: 12, margin: 0 }}>Mortgage: {fmt(p.mortgage)} · Equity: {fmt(p.value - p.mortgage)}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>{fmt(p.value)}</span>
                  <button onClick={() => setEditing({ cat: "realEstate", item: p, fields: [{ key: "name", label: "Name", type: "text" }, { key: "value", label: "Value ($)" }, { key: "mortgage", label: "Mortgage ($)" }] })} style={{ background: "#1a2d3e", border: "none", color: GOLD, borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>Edit</button>
                  <button onClick={() => removeItem("realEstate", p.id)} style={{ background: "#2a1a1a", border: "none", color: RED, borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
              <span style={{ color: "#7a9bb5" }}>Total Equity</span>
              <span style={{ color: GOLD, fontWeight: 700, fontSize: 18 }}>{fmt(calc.reEquity)}</span>
            </div>
            <button onClick={() => addItem("realEstate", { name: "New Property", value: 0, mortgage: 0 })} style={{ marginTop: 14, background: "transparent", border: `1px dashed ${GOLD}44`, color: GOLD, borderRadius: 8, padding: "8px 16px", cursor: "pointer", width: "100%", fontSize: 13 }}>+ Add Property</button>
          </Section>
        )}

        {/* INVESTMENTS */}
        {activeTab === "investments" && (
          <>
            {["BMO Investorline", "Questrade", "Wealthsimple", "IB", "RBC"].map(inst => {
              const items = data.investments.filter(i => i.institution === inst);
              if (!items.length) return null;
              const instTotal = items.reduce((s, i) => s + i.total, 0);
              return (
                <Section key={inst} title={inst} color={BLUE}>
                  {items.map(i => (
                    <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1a2d3e" }}>
                      <div>
                        <p style={{ color: "#cdd9e5", margin: "0 0 2px", fontWeight: 500 }}>{i.type}</p>
                        <p style={{ color: "#7a9bb5", fontSize: 12, margin: 0 }}>Invested: {fmt(i.investment)} · Cash: {fmt(i.cash)}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ color: BLUE, fontWeight: 700 }}>{fmt(i.total)}</span>
                        <button onClick={() => setEditing({ cat: "investments", item: i, fields: [{ key: "type", label: "Type", type: "text" }, { key: "total", label: "Total ($)" }, { key: "investment", label: "Invested ($)" }, { key: "cash", label: "Cash ($)" }] })} style={{ background: "#1a2d3e", border: "none", color: BLUE, borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>Edit</button>
                        <button onClick={() => removeItem("investments", i.id)} style={{ background: "#2a1a1a", border: "none", color: RED, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0" }}>
                    <span style={{ color: "#7a9bb5" }}>{inst} Total</span>
                    <span style={{ color: BLUE, fontWeight: 700 }}>{fmt(instTotal)}</span>
                  </div>
                </Section>
              );
            })}
            <div style={{ background: "#0d1821", border: `1px solid ${BLUE}44`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#cdd9e5", fontWeight: 600 }}>Grand Total Investments</span>
              <span style={{ color: BLUE, fontWeight: 700, fontSize: 20 }}>{fmt(calc.invTotal)}</span>
            </div>
          </>
        )}

        {/* BANKING */}
        {activeTab === "banking" && (
          <Section title="Bank Accounts" color={GREEN}>
            {data.bankAccounts.map(a => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1a2d3e" }}>
                <p style={{ color: "#cdd9e5", margin: 0 }}>{a.institution} – {a.type}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: GREEN, fontWeight: 700 }}>{fmt(a.balance)}</span>
                  <button onClick={() => setEditing({ cat: "bankAccounts", item: a, fields: [{ key: "institution", label: "Institution", type: "text" }, { key: "type", label: "Type", type: "text" }, { key: "balance", label: "Balance ($)" }] })} style={{ background: "#1a2d3e", border: "none", color: GREEN, borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>Edit</button>
                  <button onClick={() => removeItem("bankAccounts", a.id)} style={{ background: "#2a1a1a", border: "none", color: RED, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
              <span style={{ color: "#7a9bb5" }}>Total Cash</span>
              <span style={{ color: GREEN, fontWeight: 700, fontSize: 18 }}>{fmt(calc.bankTotal)}</span>
            </div>
            <button onClick={() => addItem("bankAccounts", { institution: "New Bank", type: "Savings", balance: 0 })} style={{ marginTop: 14, background: "transparent", border: `1px dashed ${GREEN}44`, color: GREEN, borderRadius: 8, padding: "8px 16px", cursor: "pointer", width: "100%", fontSize: 13 }}>+ Add Account</button>
          </Section>
        )}

        {/* CRYPTO */}
        {activeTab === "crypto" && (
          <Section title="Crypto" color={PURPLE}>
            {data.crypto.map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1a2d3e" }}>
                <p style={{ color: "#cdd9e5", margin: 0 }}>{c.platform}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: PURPLE, fontWeight: 700 }}>{fmt(c.value)}</span>
                  <button onClick={() => setEditing({ cat: "crypto", item: c, fields: [{ key: "platform", label: "Platform", type: "text" }, { key: "value", label: "Value ($)" }] })} style={{ background: "#1a2d3e", border: "none", color: PURPLE, borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>Edit</button>
                  <button onClick={() => removeItem("crypto", c.id)} style={{ background: "#2a1a1a", border: "none", color: RED, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
              <span style={{ color: "#7a9bb5" }}>Total Crypto</span>
              <span style={{ color: PURPLE, fontWeight: 700, fontSize: 18 }}>{fmt(calc.cryptoTotal)}</span>
            </div>
            <button onClick={() => addItem("crypto", { platform: "New Platform", value: 0 })} style={{ marginTop: 14, background: "transparent", border: `1px dashed ${PURPLE}44`, color: PURPLE, borderRadius: 8, padding: "8px 16px", cursor: "pointer", width: "100%", fontSize: 13 }}>+ Add Crypto</button>
          </Section>
        )}

        {/* OWING INCOME */}
        {activeTab === "owing income" && (
          <Section title="Owing Income" color={ORANGE}>
            <p style={{ color: "#7a9bb5", fontSize: 12, margin: "0 0 16px" }}>Income earned but not yet received — counts as an asset in your net worth.</p>
            {data.owingIncome.map(o => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1a2d3e" }}>
                <p style={{ color: "#cdd9e5", margin: 0 }}>{o.source}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: ORANGE, fontWeight: 700 }}>{fmt(o.amount)}</span>
                  <button onClick={() => setEditing({ cat: "owingIncome", item: o, fields: [{ key: "source", label: "Source / Description", type: "text" }, { key: "amount", label: "Amount ($)" }] })} style={{ background: "#1a2d3e", border: "none", color: ORANGE, borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>Edit</button>
                  <button onClick={() => removeItem("owingIncome", o.id)} style={{ background: "#2a1a1a", border: "none", color: RED, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
              <span style={{ color: "#7a9bb5" }}>Total Owing Income</span>
              <span style={{ color: ORANGE, fontWeight: 700, fontSize: 18 }}>{fmt(calc.owingIncomeTotal)}</span>
            </div>
            <button onClick={() => addItem("owingIncome", { source: "New Income Source", amount: 0 })} style={{ marginTop: 14, background: "transparent", border: `1px dashed ${ORANGE}44`, color: ORANGE, borderRadius: 8, padding: "8px 16px", cursor: "pointer", width: "100%", fontSize: 13 }}>+ Add Owing Income</button>
          </Section>
        )}

        {/* LIABILITIES */}
        {activeTab === "liabilities" && (
          <Section title="Liabilities" color={RED}>
            {data.liabilities.map(l => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1a2d3e" }}>
                <p style={{ color: "#cdd9e5", margin: 0 }}>{l.name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: RED, fontWeight: 700 }}>{fmt(l.amount)}</span>
                  <button onClick={() => setEditing({ cat: "liabilities", item: l, fields: [{ key: "name", label: "Name", type: "text" }, { key: "amount", label: "Amount ($)" }] })} style={{ background: "#1a2d3e", border: "none", color: RED, borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>Edit</button>
                  <button onClick={() => removeItem("liabilities", l.id)} style={{ background: "#2a1a1a", border: "none", color: RED, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
              <span style={{ color: "#7a9bb5" }}>Total Liabilities</span>
              <span style={{ color: RED, fontWeight: 700, fontSize: 18 }}>{fmt(calc.liabTotal)}</span>
            </div>
            <button onClick={() => addItem("liabilities", { name: "New Liability", amount: 0 })} style={{ marginTop: 14, background: "transparent", border: `1px dashed ${RED}44`, color: RED, borderRadius: 8, padding: "8px 16px", cursor: "pointer", width: "100%", fontSize: 13 }}>+ Add Liability</button>
          </Section>
        )}
      </div>

      {editing && (
        <EditModal item={editing.item} fields={editing.fields}
          onSave={(vals) => update(editing.cat, editing.item.id, vals)}
          onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

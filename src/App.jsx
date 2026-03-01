import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { supabase } from "./supabase";

/* ── Constants ─────────────────────────────────────────────────────── */
const defaultForm = {
  date: new Date().toISOString().split("T")[0],
  instrument: "", session: "",
  dailyBias: "", fourHrBias: "", keyLevel: "", liquidityTarget: "",
  trend1h: "", trend30m: "", trend15m: "",
  direction: "", entryPrice: "", stopLoss: "", takeProfit: "",
  lotSize: "", entryTrigger: "",
  emotionalState: "", allAligned: "", atKeyLevel: "",
  signalNotFeelings: "", hitDailyLimit: "", chasingLoss: "",
  exitPrice: "", result: "", pnl: "", exitType: "",
  followedPlan: "", extendedTP: "", movedSL: "",
  wentWell: "", wentWrong: "", doingDifferently: "",
  disciplineScore: "",
};

const BIASES = ["Bullish", "Bearish", "Ranging"];
const DIRECTIONS = ["Long", "Short"];
const EMOTIONS = ["Calm", "Focused", "Frustrated", "Excited", "Revenge"];
const EXIT_TYPES = ["TP Hit", "SL Hit", "Manual Exit", "Trailing SL"];
const RESULTS = ["Win", "Loss", "Breakeven"];
const YES_NO = ["Yes", "No"];

const C = {
  bg: "#0c0e14", surface: "#12151f", card: "#161b28",
  border: "#1e2535", borderMid: "#252f45",
  accent: "#5b8af5", accentSoft: "rgba(91,138,245,0.1)",
  green: "#10b981", greenSoft: "rgba(16,185,129,0.1)",
  red: "#f43f5e", redSoft: "rgba(244,63,94,0.1)",
  amber: "#f59e0b", amberSoft: "rgba(245,158,11,0.1)",
  blue: "#3b82f6", purple: "#8b5cf6",
  text: "#e2e8f0", textSub: "#94a3b8", textMuted: "#4a5568",
};

const BIAS_C = { Bullish: C.green, Bearish: C.red, Ranging: C.amber };
const EMOTION_C = { Calm: C.green, Focused: C.blue, Frustrated: C.amber, Excited: "#f472b6", Revenge: C.red };
const YN_C = { Yes: C.green, No: C.red };
const DIR_C = { Long: C.green, Short: C.red };
const RESULT_C = { Win: C.green, Loss: C.red, Breakeven: C.amber };
const EXIT_C = { "TP Hit": C.green, "SL Hit": C.red, "Manual Exit": C.amber, "Trailing SL": C.blue };
const SESSION_C = { Asia: C.purple, London: C.blue, "New York": C.green, "Lon-NY Overlap": C.amber };
const TK = { fontSize: 10.5, fill: "#4a5568", fontFamily: "'Outfit', sans-serif" };
const ttStyle = {
  contentStyle: { background: "#1a2035", border: `1px solid #252f45`, borderRadius: 10, fontFamily: "'Outfit', sans-serif", fontSize: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.5)" },
  labelStyle: { color: "#94a3b8" }, itemStyle: { color: "#e2e8f0" },
};

/* ── Shared UI Components ───────────────────────────────────────────── */
function FlexField({ value, options, onChange, colorMap, placeholder }) {
  const [typing, setTyping] = useState(false);
  const isCustom = value && !options.includes(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
        {options.map(opt => {
          const active = value === opt;
          const col = colorMap?.[opt] || C.accent;
          return (
            <button key={opt} onClick={() => { onChange(active ? "" : opt); setTyping(false); }} style={{
              padding: "5px 13px", borderRadius: 99,
              border: `1px solid ${active ? col + "60" : C.border}`,
              background: active ? col + "18" : "transparent",
              color: active ? col : C.textMuted,
              cursor: "pointer", fontSize: 12, fontFamily: "'Outfit', sans-serif",
              fontWeight: active ? 600 : 400, transition: "all 0.15s",
            }}>{opt}</button>
          );
        })}
        <button onClick={() => { setTyping(t => !t); if (!typing) onChange(""); }} style={{
          padding: "5px 10px", borderRadius: 99,
          border: `1px solid ${(typing || isCustom) ? C.accent + "60" : C.border}`,
          background: (typing || isCustom) ? C.accentSoft : "transparent",
          color: (typing || isCustom) ? C.accent : C.textMuted,
          cursor: "pointer", fontSize: 11, fontFamily: "'Outfit', sans-serif", fontWeight: 500, transition: "all 0.15s",
        }}>{isCustom ? `✎ ${value}` : "＋ Other"}</button>
      </div>
      {(typing || isCustom) && (
        <TextInput value={isCustom ? value : ""} onChange={v => onChange(v)}
          placeholder={placeholder || "Type custom value..."} autoFocus={typing && !isCustom} />
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", autoFocus }) {
  const [focus, setFocus] = useState(false);
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} autoFocus={autoFocus}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        width: "100%", background: C.bg, borderRadius: 9,
        border: `1px solid ${focus ? C.accent + "60" : C.border}`,
        padding: "9px 13px", color: C.text, fontFamily: "'Outfit', sans-serif",
        fontSize: 13.5, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
        boxShadow: focus ? `0 0 0 3px ${C.accent}10` : "none",
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        width: "100%", background: C.bg, borderRadius: 9,
        border: `1px solid ${focus ? C.accent + "60" : C.border}`,
        padding: "9px 13px", color: C.text, fontFamily: "'Outfit', sans-serif",
        fontSize: 13.5, outline: "none", resize: "vertical", boxSizing: "border-box",
        lineHeight: 1.65, transition: "border-color 0.15s",
        boxShadow: focus ? `0 0 0 3px ${C.accent}10` : "none",
      }}
    />
  );
}

function Card({ children, style = {}, accent }) {
  return (
    <div style={{
      background: C.card, borderRadius: 16,
      border: `1px solid ${accent ? accent + "30" : C.border}`,
      padding: "18px 20px", marginBottom: 12,
      boxShadow: accent ? `0 0 0 1px ${accent}15, 0 8px 30px rgba(0,0,0,0.35)` : "0 4px 20px rgba(0,0,0,0.3)",
      ...style,
    }}>{children}</div>
  );
}

function CardTitle({ icon, title, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: `${color || C.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</div>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'Outfit', sans-serif" }}>{title}</span>
    </div>
  );
}

function Label({ children, required }) {
  return (
    <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'Outfit', sans-serif", marginBottom: 7, fontWeight: 500, letterSpacing: 0.8, textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <Label required={required}>{label}</Label>
      {children}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 16px" }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 10.5, color: C.textMuted, fontFamily: "'Outfit', sans-serif", letterSpacing: 0.8, textTransform: "uppercase", fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "15px 16px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -10, right: -10, width: 70, height: 70, borderRadius: "50%", background: `${color}08` }} />
      <div style={{ fontSize: 10.5, color: C.textMuted, fontFamily: "'Outfit', sans-serif", fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 23, fontWeight: 800, color, fontFamily: "'Outfit', sans-serif", letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: C.textMuted, fontFamily: "'Outfit', sans-serif", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ── Auth Screen ────────────────────────────────────────────────────── */
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handle = async () => {
    setLoading(true); setError(""); setMessage("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Account created! Check your email to confirm, then log in.");
        setMode("login");
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${C.blue}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px", boxShadow: `0 8px 24px ${C.accent}40` }}>⚡</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Outfit', sans-serif", letterSpacing: -0.3 }}>Trading Journal</div>
          <div style={{ fontSize: 13, color: C.textMuted, fontFamily: "'Outfit', sans-serif", marginTop: 4 }}>{mode === "login" ? "Sign in to your journal" : "Create your account"}</div>
        </div>

        <Card>
          <Field label="Email">
            <TextInput type="email" value={email} onChange={setEmail} placeholder="you@email.com" />
          </Field>
          <Field label="Password">
            <TextInput type="password" value={password} onChange={setPassword} placeholder="••••••••" />
          </Field>

          {error && <div style={{ background: C.redSoft, border: `1px solid ${C.red}30`, borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 12.5, color: C.red, fontFamily: "'Outfit', sans-serif" }}>{error}</div>}
          {message && <div style={{ background: C.greenSoft, border: `1px solid ${C.green}30`, borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 12.5, color: C.green, fontFamily: "'Outfit', sans-serif" }}>{message}</div>}

          <button onClick={handle} disabled={loading || !email || !password} style={{
            width: "100%", padding: "13px 0", borderRadius: 11,
            background: `linear-gradient(135deg, ${C.blue}, ${C.accent})`,
            border: "none", color: "#fff", fontFamily: "'Outfit', sans-serif",
            fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            opacity: (!email || !password) ? 0.5 : 1,
            boxShadow: `0 6px 24px ${C.accent}35`,
          }}>{loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}</button>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(""); setMessage(""); }} style={{
              background: "none", border: "none", color: C.accent, cursor: "pointer",
              fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500,
            }}>
              {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Rules Panel ────────────────────────────────────────────────────── */
function RulesPanel() {
  const [open, setOpen] = useState(false);
  const rules = [
    ["Max daily loss: 2% of account. Hit it → stop immediately.", false],
    ["Max 8 trades per day. Quality over quantity.", false],
    ["All 3 timeframes must align with Daily/4HR bias before entry.", false],
    ["Only increase lot size when fully aligned AND emotionally calm.", false],
    ["Missed a move? Wait. The market always gives another setup.", false],
    ["Honour original TP unless trailing SL locked profit.", false],
    ["Frustrated or chasing? Close the platform. Walk away.", true],
  ];
  return (
    <Card style={{ marginBottom: 16 }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}90` }} />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: C.text, fontFamily: "'Outfit', sans-serif" }}>My Trading Rules</span>
        </div>
        <span style={{ color: C.textMuted, fontSize: 11, fontFamily: "'Outfit', sans-serif" }}>{open ? "Hide ▲" : "Show ▼"}</span>
      </button>
      {open && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
          {rules.map(([text, danger], i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "9px 12px", borderRadius: 9, background: danger ? C.redSoft : C.accentSoft, border: `1px solid ${danger ? C.red + "25" : C.accent + "15"}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: danger ? C.red : C.accent, minWidth: 16, fontFamily: "'Outfit', sans-serif", paddingTop: 1 }}>{i + 1}</span>
              <span style={{ fontSize: 12.5, color: danger ? C.red : C.textSub, fontFamily: "'Outfit', sans-serif", lineHeight: 1.55, fontWeight: danger ? 600 : 400 }}>{text}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── Psych Gate ─────────────────────────────────────────────────────── */
function PsychGate({ form, setField }) {
  const danger = form.chasingLoss === "Yes" || ["Revenge", "Frustrated"].includes(form.emotionalState) || form.hitDailyLimit === "Yes";
  return (
    <Card accent={danger ? C.red : C.purple}>
      <CardTitle icon="🧠" title="Psychological Gate" color={C.purple} />
      {danger && (
        <div style={{ background: C.redSoft, border: `1px solid ${C.red}40`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>🚫</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.red, fontFamily: "'Outfit', sans-serif" }}>Do not take this trade</div>
            <div style={{ fontSize: 12, color: C.red + "99", fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>Close the platform and come back tomorrow.</div>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          ["allAligned", "All timeframes aligned?", YN_C],
          ["atKeyLevel", "At a key level?", YN_C],
          ["signalNotFeelings", "Signal-based (not feeling)?", YN_C],
          ["hitDailyLimit", "Hit daily loss limit?", YN_C],
          ["chasingLoss", "Recovering a loss?", { Yes: C.red, No: C.green }],
        ].map(([key, label, cmap]) => (
          <Field key={key} label={label}>
            <FlexField value={form[key]} options={YES_NO} onChange={v => setField(key, v)} colorMap={cmap} />
          </Field>
        ))}
        <Field label="Emotional state">
          <FlexField value={form.emotionalState} options={EMOTIONS} onChange={v => setField("emotionalState", v)} colorMap={EMOTION_C} placeholder="e.g. Nervous, Confident..." />
        </Field>
      </div>
    </Card>
  );
}

/* ── Trade Form ─────────────────────────────────────────────────────── */
function TradeForm({ onSave, editTrade, onCancelEdit }) {
  const [form, setForm] = useState(editTrade || defaultForm);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (editTrade) setForm(editTrade); }, [editTrade]);
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.date || !form.direction || !form.result) { alert("Date, Direction and Result are required."); return; }
    setSaving(true);
    await onSave({ ...form, id: form.id || Date.now() });
    setSaving(false);
    setForm(defaultForm);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <RulesPanel />

      <Card>
        <CardTitle icon="📋" title="Trade Setup" color={C.accent} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Date" required><TextInput type="date" value={form.date} onChange={v => sf("date", v)} /></Field>
          <Field label="Lot Size"><TextInput type="number" value={form.lotSize} onChange={v => sf("lotSize", v)} placeholder="e.g. 0.01" /></Field>
          <Field label="Instrument" required><TextInput value={form.instrument} onChange={v => sf("instrument", v)} placeholder="e.g. XAUUSD, NAS100" /></Field>
          <Field label="Daily Bias"><FlexField value={form.dailyBias} options={BIASES} onChange={v => sf("dailyBias", v)} colorMap={BIAS_C} /></Field>
          <Field label="4HR Bias"><FlexField value={form.fourHrBias} options={BIASES} onChange={v => sf("fourHrBias", v)} colorMap={BIAS_C} /></Field>
        </div>
        <Field label="Session">
          <FlexField value={form.session} options={["Asia", "London", "New York", "Lon-NY Overlap"]} onChange={v => sf("session", v)} colorMap={{ Asia: C.purple, London: C.blue, "New York": C.green, "Lon-NY Overlap": C.amber }} placeholder="e.g. Pre-market..." />
        </Field>
        <Field label="Key Level"><TextInput value={form.keyLevel} onChange={v => sf("keyLevel", v)} placeholder="e.g. 2880 daily support" /></Field>
        <Field label="Liquidity Target"><TextInput value={form.liquidityTarget} onChange={v => sf("liquidityTarget", v)} placeholder="e.g. Above 2920 session highs" /></Field>
      </Card>

      <Card>
        <CardTitle icon="📊" title="Trend Confirmation" color={C.blue} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="1HR"><FlexField value={form.trend1h} options={BIASES} onChange={v => sf("trend1h", v)} colorMap={BIAS_C} /></Field>
          <Field label="30M"><FlexField value={form.trend30m} options={BIASES} onChange={v => sf("trend30m", v)} colorMap={BIAS_C} /></Field>
          <Field label="15M"><FlexField value={form.trend15m} options={BIASES} onChange={v => sf("trend15m", v)} colorMap={BIAS_C} /></Field>
        </div>
      </Card>

      <Card>
        <CardTitle icon="🎯" title="Entry Details" color={C.green} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Direction" required><FlexField value={form.direction} options={DIRECTIONS} onChange={v => sf("direction", v)} colorMap={DIR_C} /></Field>
          <Field label="Entry Trigger"><TextInput value={form.entryTrigger} onChange={v => sf("entryTrigger", v)} placeholder="e.g. Engulf at support" /></Field>
          <Field label="Entry Price"><TextInput type="number" value={form.entryPrice} onChange={v => sf("entryPrice", v)} placeholder="0.00" /></Field>
          <Field label="Stop Loss"><TextInput type="number" value={form.stopLoss} onChange={v => sf("stopLoss", v)} placeholder="0.00" /></Field>
          <Field label="Take Profit"><TextInput type="number" value={form.takeProfit} onChange={v => sf("takeProfit", v)} placeholder="0.00" /></Field>
        </div>
      </Card>

      <PsychGate form={form} setField={sf} />

      <Card>
        <CardTitle icon="✅" title="Post-Trade Review" color={C.amber} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Result" required><FlexField value={form.result} options={RESULTS} onChange={v => sf("result", v)} colorMap={RESULT_C} /></Field>
          <Field label="P&L (AUD)"><TextInput type="number" value={form.pnl} onChange={v => sf("pnl", v)} placeholder="+22.50 or -15.00" /></Field>
          <Field label="Exit Price"><TextInput type="number" value={form.exitPrice} onChange={v => sf("exitPrice", v)} placeholder="0.00" /></Field>
          <Field label="Exit Type"><FlexField value={form.exitType} options={EXIT_TYPES} onChange={v => sf("exitType", v)} colorMap={EXIT_C} placeholder="e.g. Partial close..." /></Field>
        </div>
        <Divider label="Discipline" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="Followed plan?"><FlexField value={form.followedPlan} options={YES_NO} onChange={v => sf("followedPlan", v)} colorMap={YN_C} /></Field>
          <Field label="Extended TP?"><FlexField value={form.extendedTP} options={YES_NO} onChange={v => sf("extendedTP", v)} colorMap={{ Yes: C.red, No: C.green }} /></Field>
          <Field label="Moved SL?"><FlexField value={form.movedSL} options={YES_NO} onChange={v => sf("movedSL", v)} colorMap={YN_C} /></Field>
        </div>
        <Field label="Discipline Score">
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
              const active = form.disciplineScore == n;
              const col = n <= 3 ? C.red : n <= 6 ? C.amber : C.green;
              return (
                <button key={n} onClick={() => sf("disciplineScore", n)} style={{
                  width: 37, height: 37, borderRadius: 9,
                  border: `1px solid ${active ? col + "60" : C.border}`,
                  background: active ? col + "18" : C.bg,
                  color: active ? col : C.textMuted,
                  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                  fontSize: 13, fontWeight: active ? 700 : 400, transition: "all 0.12s",
                }}>{n}</button>
              );
            })}
          </div>
        </Field>
        <Divider label="Reflection" />
        <Field label="What went well?"><Textarea value={form.wentWell} onChange={v => sf("wentWell", v)} placeholder="What did you execute correctly?" /></Field>
        <Field label="What went wrong?"><Textarea value={form.wentWrong} onChange={v => sf("wentWrong", v)} placeholder="Where did you deviate from the plan?" /></Field>
        <Field label="What would I do differently?"><Textarea value={form.doingDifferently} onChange={v => sf("doingDifferently", v)} placeholder="Specific improvement for next time..." /></Field>
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleSave} disabled={saving} style={{
          flex: 1, padding: "13px 0", borderRadius: 11,
          background: `linear-gradient(135deg, ${C.blue}, ${C.accent})`,
          border: "none", color: "#fff", fontFamily: "'Outfit', sans-serif",
          fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer",
          boxShadow: `0 6px 24px ${C.accent}35`,
        }}>{saving ? "Saving..." : editTrade ? "Update Trade" : "Save Trade"}</button>
        {editTrade && (
          <button onClick={onCancelEdit} style={{
            padding: "13px 20px", borderRadius: 11, background: "transparent",
            border: `1px solid ${C.border}`, color: C.textSub,
            fontFamily: "'Outfit', sans-serif", fontSize: 14, cursor: "pointer",
          }}>Cancel</button>
        )}
      </div>
    </div>
  );
}

/* ── Analytics Helpers ──────────────────────────────────────────────── */
function WinRateBar({ label, wr, n, color }) {
  const pct = parseInt(wr) || 0;
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12.5, color, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif" }}>{pct}% · {n} trade{n !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
        <div style={{ height: 6, width: `${pct}%`, background: `linear-gradient(90deg,${color}70,${color})`, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function PeriodTable({ rows, columns }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Outfit',sans-serif", fontSize: 12 }}>
        <thead>
          <tr>{columns.map(c => <th key={c} style={{ textAlign: c === columns[0] ? "left" : "right", padding: "6px 8px", color: C.textMuted, fontWeight: 600, fontSize: 10.5, letterSpacing: 0.5, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}20` }}>
              {row.map((cell, j) => {
                const isNum = j > 0 && typeof cell === "number";
                const col = isNum ? (cell >= 0 ? C.green : C.red) : C.textSub;
                const display = isNum ? `${cell >= 0 ? "+" : ""}${cell.toFixed(2)}` : cell;
                return <td key={j} style={{ padding: "8px 8px", textAlign: j > 0 ? "right" : "left", color: isNum ? col : C.textSub, fontWeight: isNum ? 600 : 400 }}>{display}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getWeek(dateStr) {
  const d = new Date(dateStr);
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const start = new Date(jan4); start.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  return `${d.getFullYear()}-W${String(Math.floor((d - start) / (7 * 86400000)) + 1).padStart(2, "0")}`;
}
function getMonth(d) { return d.slice(0, 7); }
function groupBy(arr, fn) { const m = {}; arr.forEach(t => { const k = fn(t); if (!m[k]) m[k] = []; m[k].push(t); }); return m; }
function periodStats(ts, dep = 1000) {
  const pnl = ts.reduce((a, t) => a + (parseFloat(t.pnl) || 0), 0);
  return { pnl: parseFloat(pnl.toFixed(2)), wins: ts.filter(t => t.result === "Win").length, count: ts.length, pct: parseFloat(((pnl / dep) * 100).toFixed(2)) };
}

/* ── Analytics ──────────────────────────────────────────────────────── */
function Analytics({ trades }) {
  const [periodTab, setPeriodTab] = useState("day");

  if (!trades.length) return (
    <div style={{ textAlign: "center", padding: 80, color: C.textMuted, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.textSub, marginBottom: 6 }}>No trades yet</div>
      <div style={{ fontSize: 13 }}>Log your first trade to unlock analytics</div>
    </div>
  );

  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalDeposit = 1000;
  const wins = trades.filter(t => t.result === "Win").length;
  const losses = trades.filter(t => t.result === "Loss").length;
  const wr = ((wins / trades.length) * 100).toFixed(1);
  const totalPnl = trades.reduce((a, t) => a + (parseFloat(t.pnl) || 0), 0);
  const wT = trades.filter(t => t.result === "Win"), lT = trades.filter(t => t.result === "Loss");
  const avgWin = wT.length ? (wT.reduce((a, t) => a + (parseFloat(t.pnl) || 0), 0) / wT.length).toFixed(2) : 0;
  const avgLoss = lT.length ? (lT.reduce((a, t) => a + (parseFloat(t.pnl) || 0), 0) / lT.length).toFixed(2) : 0;
  const ds = trades.filter(t => t.disciplineScore);
  const avgDisc = ds.length ? (ds.reduce((a, t) => a + Number(t.disciplineScore), 0) / ds.length).toFixed(1) : "—";
  const isProfit = totalPnl >= 0;

  let cum = 0;
  const cumData = sorted.map((t, i) => { cum += parseFloat(t.pnl) || 0; return { name: `#${i + 1}`, cum: parseFloat(cum.toFixed(2)) }; });

  const byDayMap = groupBy(sorted, t => t.date);
  let peak = 0, runningPnl = 0;
  const dailyData = Object.entries(byDayMap).sort().map(([date, ts]) => {
    const pnl = ts.reduce((a, t) => a + (parseFloat(t.pnl) || 0), 0);
    runningPnl += pnl; if (runningPnl > peak) peak = runningPnl;
    const dd = peak > 0 ? parseFloat(((runningPnl - peak) / totalDeposit * 100).toFixed(2)) : 0;
    return { date: date.slice(5), pnl: parseFloat(pnl.toFixed(2)), dd, count: ts.length };
  });

  const byWeek = groupBy(sorted, t => getWeek(t.date));
  const byMonth = groupBy(sorted, t => getMonth(t.date));
  const dayRows = Object.entries(byDayMap).sort().map(([d, ts]) => { const s = periodStats(ts, totalDeposit); return [d, s.pnl, s.pct, s.count, s.wins]; });
  const weekRows = Object.entries(byWeek).sort().map(([w, ts]) => { const s = periodStats(ts, totalDeposit); return [w, s.pnl, s.pct, s.count, s.wins]; });
  const monthRows = Object.entries(byMonth).sort().map(([m, ts]) => { const s = periodStats(ts, totalDeposit); return [m, s.pnl, s.pct, s.count, s.wins]; });

  const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dowMap = {};
  sorted.forEach(t => { const d = DOW[(new Date(t.date).getDay() + 6) % 7]; if (!dowMap[d]) dowMap[d] = { count: 0, pnl: 0 }; dowMap[d].count++; dowMap[d].pnl += parseFloat(t.pnl) || 0; });
  const dowData = DOW.filter(d => dowMap[d]).map(d => ({ day: d, count: dowMap[d].count, pnl: parseFloat(dowMap[d].pnl.toFixed(2)) }));

  const sessionMap = {}; sorted.forEach(t => { const s = t.session || "Unknown"; if (!sessionMap[s]) sessionMap[s] = { count: 0, pnl: 0, wins: 0 }; sessionMap[s].count++; sessionMap[s].pnl += parseFloat(t.pnl) || 0; if (t.result === "Win") sessionMap[s].wins++; });
  const instrMap = {}; sorted.forEach(t => { const s = t.instrument || "Unknown"; if (!instrMap[s]) instrMap[s] = { count: 0, pnl: 0, wins: 0 }; instrMap[s].count++; instrMap[s].pnl += parseFloat(t.pnl) || 0; if (t.result === "Win") instrMap[s].wins++; });
  const dirMap = { Long: { count: 0, pnl: 0, wins: 0 }, Short: { count: 0, pnl: 0, wins: 0 } };
  sorted.forEach(t => { const d = ["Long", "Short"].includes(t.direction) ? t.direction : null; if (d) { dirMap[d].count++; dirMap[d].pnl += parseFloat(t.pnl) || 0; if (t.result === "Win") dirMap[d].wins++; } });
  const alignedT = trades.filter(t => t.allAligned === "Yes"), notAlignedT = trades.filter(t => t.allAligned === "No");
  const allEmotions = [...new Set(trades.map(t => t.emotionalState).filter(Boolean))];
  const emotionStats = {}; allEmotions.forEach(e => { const et = trades.filter(t => t.emotionalState === e); emotionStats[e] = { n: et.length, wr: ((et.filter(t => t.result === "Win").length / et.length) * 100).toFixed(0) }; });
  const chasing = trades.filter(t => t.chasingLoss === "Yes"), extended = trades.filter(t => t.extendedTP === "Yes");
  const maxDD = Math.min(...dailyData.map(d => d.dd));
  const worstDay = dailyData.reduce((a, d) => d.pnl < a.pnl ? d : a, dailyData[0]);

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <StatCard label="Total P&L" value={`${isProfit ? "+" : ""}${totalPnl.toFixed(2)}`} sub="AUD" color={isProfit ? C.green : C.red} />
        <StatCard label="Win Rate" value={`${wr}%`} sub={`${wins}W · ${losses}L`} color={parseFloat(wr) >= 50 ? C.green : C.red} />
        <StatCard label="Avg Win" value={`+${avgWin}`} sub="AUD per win" color={C.green} />
        <StatCard label="Avg Loss" value={`${avgLoss}`} sub="AUD per loss" color={C.red} />
        <StatCard label="Max Daily DD" value={`${maxDD.toFixed(1)}%`} sub={`Worst: ${worstDay?.date} (${worstDay?.pnl >= 0 ? "+" : ""}${worstDay?.pnl} AUD)`} color={C.red} />
        <StatCard label="Discipline" value={avgDisc} sub="avg score /10" color={parseFloat(avgDisc) >= 7 ? C.green : C.amber} />
      </div>

      <Card>
        <CardTitle icon="📈" title="Equity Curve" color={C.green} />
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={cumData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs><linearGradient id="gradEq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={isProfit ? C.green : C.red} stopOpacity={0.25} /><stop offset="100%" stopColor={isProfit ? C.green : C.red} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" tick={TK} /><YAxis tick={TK} />
            <ReferenceLine y={0} stroke={C.borderMid} strokeDasharray="4 4" />
            <Tooltip {...ttStyle} />
            <Area type="monotone" dataKey="cum" stroke={isProfit ? C.green : C.red} strokeWidth={2.5} fill="url(#gradEq)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <CardTitle icon="🗓️" title="P&L by Period" color={C.accent} />
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {["day", "week", "month"].map(p => (
            <button key={p} onClick={() => setPeriodTab(p)} style={{ padding: "5px 14px", borderRadius: 99, border: `1px solid ${periodTab === p ? C.accent + "60" : C.border}`, background: periodTab === p ? C.accentSoft : "transparent", color: periodTab === p ? C.accent : C.textMuted, fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: periodTab === p ? 600 : 400, cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize" }}>{p}</button>
          ))}
        </div>
        <PeriodTable rows={{ day: dayRows, week: weekRows, month: monthRows }[periodTab]} columns={["Period", "P&L (AUD)", "% Acct", "Trades", "Wins"]} />
      </Card>

      <Card>
        <CardTitle icon="📉" title="Daily Drawdown %" color={C.red} />
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={dailyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs><linearGradient id="gradDD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red} stopOpacity={0.3} /><stop offset="100%" stopColor={C.red} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="date" tick={TK} /><YAxis tick={TK} />
            <ReferenceLine y={0} stroke={C.borderMid} />
            <Tooltip {...ttStyle} formatter={v => [`${v}%`, "Drawdown"]} />
            <Area type="monotone" dataKey="dd" stroke={C.red} strokeWidth={2} fill="url(#gradDD)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <CardTitle icon="📆" title="Trades & P&L by Day of Week" color={C.blue} />
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={dowData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="day" tick={TK} />
            <YAxis yAxisId="left" tick={TK} /><YAxis yAxisId="right" orientation="right" tick={TK} />
            <Tooltip {...ttStyle} />
            <Bar yAxisId="left" dataKey="count" fill={C.accent} fillOpacity={0.7} radius={[3, 3, 0, 0]} name="Trades" />
            <Bar yAxisId="right" dataKey="pnl" radius={[3, 3, 0, 0]} name="P&L" shape={({ x, y, width, height, value }) => { const col = value >= 0 ? C.green : C.red; const h = Math.abs(height), yy = value >= 0 ? y : y + height; return <rect x={x} y={yy} width={width} height={h} fill={col} rx={3} fillOpacity={0.75} />; }} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 16, marginTop: 10, justifyContent: "center" }}>
          {[["Trades", C.accent], ["P&L", C.green]].map(([l, c]) => <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: c }} /><span style={{ fontSize: 11, color: C.textMuted, fontFamily: "'Outfit',sans-serif" }}>{l}</span></div>)}
        </div>
      </Card>

      {Object.keys(sessionMap).length > 0 && (
        <Card>
          <CardTitle icon="🌍" title="Performance by Session" color={C.amber} />
          {Object.entries(sessionMap).map(([s, d]) => {
            const col = SESSION_C[s] || C.accent, sWr = d.count ? ((d.wins / d.count) * 100).toFixed(0) : 0;
            return <div key={s} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 12.5, color: col, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{s}</span>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 12, color: d.pnl >= 0 ? C.green : C.red, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{d.pnl >= 0 ? "+" : ""}{d.pnl.toFixed(2)} AUD</span>
                  <span style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif" }}>{sWr}% WR · {d.count}t</span>
                </div>
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 3 }}><div style={{ height: 6, width: `${sWr}%`, background: `linear-gradient(90deg,${col}70,${col})`, borderRadius: 3 }} /></div>
            </div>;
          })}
        </Card>
      )}

      {Object.keys(instrMap).length > 0 && (
        <Card>
          <CardTitle icon="💹" title="Performance by Instrument" color={C.green} />
          {Object.entries(instrMap).map(([s, d]) => {
            const iWr = d.count ? ((d.wins / d.count) * 100).toFixed(0) : 0;
            return <div key={s} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 12.5, color: C.accent, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{s}</span>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 12, color: d.pnl >= 0 ? C.green : C.red, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{d.pnl >= 0 ? "+" : ""}{d.pnl.toFixed(2)} AUD</span>
                  <span style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif" }}>{iWr}% WR · {d.count}t</span>
                </div>
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 3 }}><div style={{ height: 6, width: `${iWr}%`, background: `linear-gradient(90deg,${C.accent}70,${C.accent})`, borderRadius: 3 }} /></div>
            </div>;
          })}
        </Card>
      )}

      <Card>
        <CardTitle icon="↕️" title="Long vs Short" color={C.blue} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {["Long", "Short"].map(d => {
            const dd = dirMap[d]; if (!dd.count) return <div key={d} style={{ background: C.border + "20", borderRadius: 10, padding: 14, color: C.textMuted, fontFamily: "'Outfit',sans-serif", fontSize: 12 }}>No {d} trades</div>;
            const dWr = ((dd.wins / dd.count) * 100).toFixed(0), col = d === "Long" ? C.green : C.red;
            return <div key={d} style={{ background: `${col}0d`, border: `1px solid ${col}25`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10.5, color: col, fontFamily: "'Outfit',sans-serif", fontWeight: 700, marginBottom: 6, letterSpacing: 0.7, textTransform: "uppercase" }}>{d}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: col, fontFamily: "'Outfit',sans-serif" }}>{dWr}%</div>
              <div style={{ fontSize: 11.5, color: C.textMuted, fontFamily: "'Outfit',sans-serif", marginTop: 3 }}>{dd.count} trades · {dd.pnl >= 0 ? "+" : ""}{dd.pnl.toFixed(2)} AUD</div>
            </div>;
          })}
        </div>
      </Card>

      {(alignedT.length > 0 || notAlignedT.length > 0) && (
        <Card>
          <CardTitle icon="🎯" title="Timeframe Alignment Impact" color={C.purple} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Aligned", alignedT, C.green], ["Not Aligned", notAlignedT, C.red]].map(([label, ts, col]) => {
              const wr = ts.length ? ((ts.filter(t => t.result === "Win").length / ts.length) * 100).toFixed(0) : null;
              const pnl = ts.reduce((a, t) => a + (parseFloat(t.pnl) || 0), 0);
              return <div key={label} style={{ background: `${col}0d`, border: `1px solid ${col}25`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 10.5, color: col, fontFamily: "'Outfit',sans-serif", fontWeight: 700, marginBottom: 6, letterSpacing: 0.7, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: col, fontFamily: "'Outfit',sans-serif" }}>{wr ? `${wr}%` : "—"}</div>
                <div style={{ fontSize: 11.5, color: C.textMuted, fontFamily: "'Outfit',sans-serif", marginTop: 3 }}>{ts.length} trades · {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} AUD</div>
              </div>;
            })}
          </div>
        </Card>
      )}

      <Card>
        <CardTitle icon="🧠" title="Psychology Insights" color={C.purple} />
        {Object.keys(emotionStats).length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <Label>Win Rate by Emotional State</Label>
            {Object.entries(emotionStats).map(([e, s]) => <WinRateBar key={e} label={e} wr={s.wr} n={s.n} color={EMOTION_C[e] || C.accent} />)}
          </div>
        )}
        <Divider label="Behaviour Flags" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[["Chasing Losses", chasing, C.red], ["Extended TP", extended, C.amber]].map(([label, ts, col]) => {
            const pnl = ts.reduce((a, t) => a + (parseFloat(t.pnl) || 0), 0);
            return <div key={label} style={{ background: `${col}0d`, border: `1px solid ${col}25`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10.5, color: col, fontFamily: "'Outfit',sans-serif", fontWeight: 700, marginBottom: 7, letterSpacing: 0.7, textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: col, fontFamily: "'Outfit',sans-serif" }}>{ts.length}</div>
              <div style={{ fontSize: 11.5, color: C.textMuted, fontFamily: "'Outfit',sans-serif", marginTop: 3 }}>{ts.length > 0 ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} AUD` : "No data yet"}</div>
            </div>;
          })}
        </div>
      </Card>
    </div>
  );
}

/* ── Trade Log ──────────────────────────────────────────────────────── */
function TradeLog({ trades, onEdit, onDelete }) {
  if (!trades.length) return (
    <div style={{ textAlign: "center", padding: 80, color: C.textMuted, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.textSub, marginBottom: 6 }}>No trades yet</div>
      <div style={{ fontSize: 13 }}>Your trade history will appear here</div>
    </div>
  );
  return (
    <div style={{ paddingBottom: 40 }}>
      {[...trades].reverse().map(t => {
        const pnl = parseFloat(t.pnl) || 0;
        const col = t.result === "Win" ? C.green : t.result === "Loss" ? C.red : C.amber;
        return (
          <div key={t.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, borderLeft: `3px solid ${col}`, padding: "14px 18px", marginBottom: 10, boxShadow: "0 4px 18px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12.5, color: C.textSub, fontFamily: "'Outfit',sans-serif", fontWeight: 500 }}>{t.date}</span>
                  {t.instrument && <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 6, background: C.accentSoft, color: C.accent, fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>{t.instrument}</span>}
                  {t.session && <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 6, background: C.amberSoft, color: C.amber, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{t.session}</span>}
                  {t.direction && <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 6, background: `${t.direction === "Long" ? C.green : t.direction === "Short" ? C.red : C.accent}15`, color: t.direction === "Long" ? C.green : t.direction === "Short" ? C.red : C.accent, fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>{t.direction}</span>}
                  {t.lotSize && <span style={{ fontSize: 11.5, color: C.textMuted, fontFamily: "'Outfit',sans-serif" }}>{t.lotSize} lot</span>}
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {t.emotionalState && <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: `${EMOTION_C[t.emotionalState] || C.accent}15`, color: EMOTION_C[t.emotionalState] || C.accent, fontFamily: "'Outfit',sans-serif", fontWeight: 500 }}>{t.emotionalState}</span>}
                  {t.chasingLoss === "Yes" && <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: C.redSoft, color: C.red, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>⚠ Chasing</span>}
                  {t.extendedTP === "Yes" && <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: C.amberSoft, color: C.amber, fontFamily: "'Outfit',sans-serif" }}>Extended TP</span>}
                  {t.disciplineScore && <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: C.accentSoft, color: C.accent, fontFamily: "'Outfit',sans-serif" }}>🎯 {t.disciplineScore}/10</span>}
                </div>
                {t.wentWrong && <div style={{ marginTop: 9, fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif", fontStyle: "italic", lineHeight: 1.5 }}>"{t.wentWrong}"</div>}
              </div>
              <div style={{ textAlign: "right", marginLeft: 14, flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: col, fontFamily: "'Outfit',sans-serif", letterSpacing: -0.5 }}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'Outfit',sans-serif" }}>AUD</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => onEdit(t)} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 7, background: C.accentSoft, border: `1px solid ${C.accent}25`, color: C.accent, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Edit</button>
              <button onClick={() => onDelete(t.id)} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 7, background: C.redSoft, border: `1px solid ${C.red}25`, color: C.red, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── App Shell ──────────────────────────────────────────────────────── */
export default function App() {
  const [session, setSession] = useState(null);
  const [trades, setTrades] = useState([]);
  const [tab, setTab] = useState("analytics");
  const [editTrade, setEditTrade] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Load trades when logged in
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    loadTrades();
  }, [session]);

  const loadTrades = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", session.user.id)
      .order("date", { ascending: false });
    if (!error) setTrades(data || []);
    setLoading(false);
  };

  const handleSave = async (trade) => {
    const payload = { ...trade, user_id: session.user.id };
    if (trades.find(t => t.id === trade.id)) {
      await supabase.from("trades").update(payload).eq("id", trade.id);
    } else {
      const { data } = await supabase.from("trades").insert([{ ...payload, id: undefined }]).select();
      if (data) setTrades(prev => [...prev, data[0]]);
      setEditTrade(null); setTab("trades"); return;
    }
    setTrades(prev => prev.map(t => t.id === trade.id ? { ...payload } : t));
    setEditTrade(null); setTab("trades");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this trade?")) return;
    await supabase.from("trades").delete().eq("id", id);
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setTrades([]);
  };

  if (!session) return <AuthScreen onAuth={() => {}} />;
  if (loading) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.accent, fontFamily: "'Outfit',sans-serif", fontSize: 14 }}>Loading your trades...</div>
    </div>
  );

  const totalPnl = trades.reduce((a, t) => a + (parseFloat(t.pnl) || 0), 0);
  const winRate = trades.length ? ((trades.filter(t => t.result === "Win").length / trades.length) * 100).toFixed(1) : null;
  const tabs = [
    { id: "log", label: editTrade ? "Edit Trade" : "Log Trade", icon: "✏️" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "trades", label: "History", icon: "📋", badge: trades.length },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};}
        input::placeholder,textarea::placeholder{color:${C.textMuted};opacity:0.55;}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.4) sepia(1) hue-rotate(200deg);opacity:0.5;cursor:pointer;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:${C.bg};}::-webkit-scrollbar-thumb{background:${C.borderMid};border-radius:2px;}
        button{transition:all 0.12s;} button:active{transform:scale(0.96);}
      `}</style>

      <div style={{ background: C.bg, minHeight: "100vh" }}>
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(16px)" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.blue}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: `0 4px 16px ${C.accent}40` }}>⚡</div>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif", letterSpacing: -0.3 }}>Trading Journal</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {trades.length > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 19, fontWeight: 800, color: totalPnl >= 0 ? C.green : C.red, fontFamily: "'Outfit',sans-serif", letterSpacing: -0.5 }}>
                      {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)}<span style={{ fontSize: 11.5, fontWeight: 500, marginLeft: 3, color: C.textMuted }}>AUD</span>
                    </div>
                    {winRate && <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'Outfit',sans-serif" }}>{winRate}% win · {trades.length} trades</div>}
                  </div>
                )}
                <button onClick={handleSignOut} style={{ fontSize: 11.5, padding: "5px 12px", borderRadius: 7, background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Sign out</button>
              </div>
            </div>
            <div style={{ display: "flex", marginTop: 10 }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); if (t.id !== "log") setEditTrade(null); }} style={{ padding: "9px 14px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? C.accent : "transparent"}`, color: tab === t.id ? C.accent : C.textMuted, fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "color 0.15s, border-color 0.15s" }}>
                  <span style={{ fontSize: 12 }}>{t.icon}</span>{t.label}
                  {t.badge > 0 && <span style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 99, background: tab === t.id ? C.accentSoft : C.border, color: tab === t.id ? C.accent : C.textMuted, fontWeight: 700 }}>{t.badge}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 660, margin: "0 auto", padding: "18px 16px" }}>
          {tab === "log" && <TradeForm onSave={handleSave} editTrade={editTrade} onCancelEdit={() => { setEditTrade(null); setTab("trades"); }} />}
          {tab === "analytics" && <Analytics trades={trades} />}
          {tab === "trades" && <TradeLog trades={trades} onEdit={t => { setEditTrade(t); setTab("log"); }} onDelete={handleDelete} />}
        </div>
      </div>
    </>
  );
}

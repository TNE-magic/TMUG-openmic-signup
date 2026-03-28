import { useState, useEffect, useCallback } from "react";

const ADMIN_PASSWORD = "tmug123";

const store = {
  async get(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } },
  async set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const EFFECT_TYPES = ["Cards", "Mentalism", "Stage/Parlor", "Coins", "Comedy Magic", "Bizarre", "Escape", "Other"];
const REPEAT_OPTIONS = ["No - new effect", "Yes - I'm refining it", "Yes - same as last time", "First time at TMUG"];
const STATUS_OPTIONS = ["Pending", "Confirmed", "Waitlist", "Flagged - Overlap", "Flagged - Repeat", "Declined", "No Show"];

const RULES = {
  performers: [
    "Sign up by Sunday before the show (2nd Tuesday). Late sign-ups go on the waitlist.",
    "Default time limit: 7 minutes. Request more time in advance for longer pieces — approval not guaranteed.",
    "Include your effect name, type, and approximate time when signing up.",
    "No performing the same effect two months in a row unless you're actively refining it (and say so).",
    "If you see the light signal, you have 60 seconds to wrap up. Respect it.",
    "Be in the green room and ready 10 minutes before your slot.",
    "Check the run sheet when you arrive. Your order is final.",
  ],
  organizer: [
    "Review sign-ups by Monday evening. Flag overlapping effect types and repeat performers.",
    "Set the run order by Monday night. Alternate effect types — don't stack 3 card acts in a row.",
    "Text/message the run order to all confirmed performers Monday night or Tuesday morning.",
    "Print the run sheet and post it in the green room day-of.",
    "Keep the show within 120 minutes (7:00–9:00 PM) including host time.",
    "Budget ~15 minutes total for host (opening + closing + transitions).",
    "Log every performance in the Effect History tab after the show.",
  ],
  lights: [
    "GREEN light — You're good, keep going.",
    "YELLOW light (or flash) — 2 minutes remaining.",
    "RED light (or double flash) — Time's up, wrap within 60 seconds.",
    "The host or stage manager controls the light from offstage.",
  ],
  structure: [
    "7:00 — Host opens (welcome, housekeeping, set the vibe) — 5 min",
    "7:05 — Act 1 (strong opener)",
    "Acts continue with brief host transitions (~1 min each)",
    "~8:45 — Final act",
    "8:55 — Host closes (thank audience, plug next show) — 5 min",
    "9:00 — Doors / hang time",
  ],
};

const Icons = {
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
  signup: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  run: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>,
  history: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  crm: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  lock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  edit: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  up: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>,
  down: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  chevDown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>,
  feedback: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  rules: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  pin: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
};

export default function App() {
  const [view, setView] = useState("public");
  const [publicTab, setPublicTab] = useState("signup");
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminTab, setAdminTab] = useState("signups");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState({ signups: [], performers: [], shows: [], feedback: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); }, []);

  const loadData = useCallback(async () => {
    const [signups, performers, shows, feedback] = await Promise.all([store.get("tmug-signups"), store.get("tmug-performers"), store.get("tmug-shows"), store.get("tmug-feedback")]);
    setData({ signups: signups || [], performers: performers || [], shows: shows || [], feedback: feedback || [] });
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveSignups = async (s) => { setData(d => ({ ...d, signups: s })); await store.set("tmug-signups", s); };
  const savePerformers = async (p) => { setData(d => ({ ...d, performers: p })); await store.set("tmug-performers", p); };
  const saveShows = async (s) => { setData(d => ({ ...d, shows: s })); await store.set("tmug-shows", s); };
  const saveFeedback = async (f) => { setData(d => ({ ...d, feedback: f })); await store.set("tmug-feedback", f); };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F5F0E1", fontFamily: "'DM Sans', sans-serif" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A" }}>THE MAGIC UNDERGROUND</div><div style={{ color: "#999", marginTop: 8 }}>Loading...</div></div></div>;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#F5F0E1;color:#1A1A1A}input,select,textarea,button{font-family:inherit}input:focus,select:focus,textarea:focus{outline:2px solid #D4A017;outline-offset:-1px}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#555;border-radius:3px}
        @keyframes slideIn{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes toastIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        .card{background:#fff;border:1px solid #E8DFC9;border-radius:10px;animation:slideIn .25s ease}
        .card-dark{background:#2A2A2E;border:1px solid #3A3A3E;border-radius:10px;animation:slideIn .25s ease}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;transition:all .15s}.btn:hover{transform:translateY(-1px)}.btn:active{transform:translateY(0)}
        .btn-primary{background:#1A1A1A;color:#F0C940}.btn-primary:hover{background:#333}
        .btn-gold{background:#D4A017;color:#1A1A1A}.btn-gold:hover{background:#E8B52A}
        .btn-ghost{background:transparent;color:#1A1A1A;border:1px solid #E8DFC9}.btn-ghost:hover{background:#F5F0E1}
        .btn-ghost-dark{background:transparent;color:#ccc;border:1px solid #444}.btn-ghost-dark:hover{background:#333}
        .btn-sm{padding:5px 10px;font-size:12px}
        .input{width:100%;padding:10px 12px;border:1px solid #E8DFC9;border-radius:6px;font-size:14px;background:#fff;color:#1A1A1A}
        .input-dark{width:100%;padding:10px 12px;border:1px solid #444;border-radius:6px;font-size:14px;background:#333;color:#eee}.input-dark:focus{outline:2px solid #D4A017;outline-offset:-1px}.input-dark::placeholder{color:#777}
        .label{font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
        .label-dark{font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
        .badge{display:inline-block;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600}
        .badge-pending{background:#FFF3CD;color:#856404}.badge-confirmed{background:#D4EDDA;color:#155724}.badge-waitlist{background:#E2E3E5;color:#383D41}.badge-flagged{background:#F8D7DA;color:#721C24}.badge-declined{background:#444;color:#999}
        .tag{display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:500;background:#F5F0E1;color:#666;margin:1px 2px}
        .tag-dark{display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:500;background:#3A3A3E;color:#aaa;margin:1px 2px}
        .sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:40;animation:fadeIn .2s}
      `}</style>

      {toast && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 100, padding: "12px 20px", borderRadius: 8, background: toast.type === "success" ? "#1A1A1A" : "#C0392B", color: toast.type === "success" ? "#F0C940" : "#fff", fontWeight: 600, fontSize: 13, animation: "toastIn .3s ease", boxShadow: "0 4px 20px rgba(0,0,0,.2)" }}>{toast.msg}</div>}

      {view === "public" ? (
        <PublicPage data={data} saveSignups={saveSignups} savePerformers={savePerformers} saveFeedback={saveFeedback} showToast={showToast} onAdmin={() => setView("admin")} publicTab={publicTab} setPublicTab={setPublicTab} />
      ) : !adminAuth ? (
        <AdminLogin onAuth={() => setAdminAuth(true)} onBack={() => setView("public")} />
      ) : (
        <AdminDashboard data={data} saveSignups={saveSignups} savePerformers={savePerformers} saveShows={saveShows} saveFeedback={saveFeedback} showToast={showToast} adminTab={adminTab} setAdminTab={setAdminTab} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { setAdminAuth(false); setView("public"); }} />
      )}
    </>
  );
}

function Collapsible({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #E8DFC9" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "12px 14px", border: "none", background: open ? "#1A1A1A" : "#fff", color: open ? "#F0C940" : "#1A1A1A", cursor: "pointer", fontSize: 13, fontWeight: 700, textAlign: "left", transition: "all .2s" }}>
        <span style={{ transition: "transform .2s", transform: open ? "rotate(0)" : "rotate(-90deg)", flexShrink: 0 }}>{Icons.chevDown}</span>
        {title}
      </button>
      {open && <div style={{ padding: "12px 14px", background: "#FDFBF6", fontSize: 13, lineHeight: 1.7 }}>{children}</div>}
    </div>
  );
}

function PublicPage({ data, saveSignups, savePerformers, saveFeedback, showToast, onAdmin, publicTab, setPublicTab }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E1" }}>
      <div style={{ background: "#1A1A1A", padding: "24px 20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 3, color: "#D4A017", marginBottom: 4 }}>THE MAGIC UNDERGROUND</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F5F0E1", letterSpacing: -0.5 }}>Open Mic Night</h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, fontSize: 13, color: "#999" }}>
          <span style={{ color: "#D4A017" }}>{Icons.pin}</span> Sisyphus Brewing &bull; 2nd Tuesday &bull; 7–9 PM
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 16 }}>
          {[{ id: "signup", label: "Sign Up" }, { id: "feedback", label: "Feedback" }].map(t => (
            <button key={t.id} onClick={() => setPublicTab(t.id)} style={{ padding: "8px 20px", border: "none", borderRadius: "6px 6px 0 0", cursor: "pointer", fontSize: 13, fontWeight: 600, background: publicTab === t.id ? "#F5F0E1" : "transparent", color: publicTab === t.id ? "#1A1A1A" : "#777", transition: "all .15s" }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 80px" }}>
        {publicTab === "signup" ? <SignUpForm data={data} saveSignups={saveSignups} savePerformers={savePerformers} showToast={showToast} /> : <FeedbackForm data={data} saveFeedback={saveFeedback} showToast={showToast} />}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button className="btn btn-ghost" style={{ fontSize: 12, color: "#999" }} onClick={onAdmin}>{Icons.lock} Admin</button>
        </div>
      </div>
    </div>
  );
}

function SignUpForm({ data, saveSignups, savePerformers, showToast }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", effect: "", description: "", type: "Cards", time: "7", repeat: "No - new effect", showDate: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const getNextShowDate = () => {
    const now = new Date(); let d = new Date(now.getFullYear(), now.getMonth(), 1); let c = 0;
    while (c < 2) { if (d.getDay() === 2) c++; if (c < 2) d.setDate(d.getDate() + 1); }
    if (d < now) { d = new Date(now.getFullYear(), now.getMonth() + 1, 1); c = 0; while (c < 2) { if (d.getDay() === 2) c++; if (c < 2) d.setDate(d.getDate() + 1); } }
    return d.toISOString().split("T")[0];
  };
  useEffect(() => { setForm(f => ({ ...f, showDate: getNextShowDate() })); }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.effect || !form.showDate) { showToast("Fill in required fields", "error"); return; }
    await saveSignups([...data.signups, { id: uid(), ...form, time: parseInt(form.time), status: "Pending", createdAt: new Date().toISOString() }]);
    const ex = data.performers.find(p => p.name.toLowerCase() === form.name.toLowerCase());
    if (!ex) await savePerformers([...data.performers, { id: uid(), name: form.name, email: form.email, phone: form.phone, notes: "", tags: [], createdAt: new Date().toISOString() }]);
    else if (form.email || form.phone) await savePerformers(data.performers.map(p => p.id === ex.id ? { ...p, email: form.email || p.email, phone: form.phone || p.phone } : p));
    setSubmitted(true); showToast("You're signed up!");
  };

  if (submitted) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#F0C940" }}>{Icons.check}</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>You're In</h2>
      <p style={{ color: "#666", marginBottom: 20, lineHeight: 1.5, fontSize: 14 }}>We'll confirm your spot and send you the run order before the show.</p>
      <button className="btn btn-primary" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", effect: "", description: "", type: "Cards", time: "7", repeat: "No - new effect", showDate: getNextShowDate(), notes: "" }); }}>Sign Up Another Act</button>
    </div>
  );

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Collapsible title="Rules & Guidelines — Read Before Signing Up">
          <div style={{ fontWeight: 700, marginBottom: 6, color: "#D4A017" }}>Performer Rules</div>
          {RULES.performers.map((r, i) => <div key={i} style={{ paddingLeft: 12, marginBottom: 4, color: "#555" }}>• {r}</div>)}
          <div style={{ fontWeight: 700, marginTop: 14, marginBottom: 6, color: "#D4A017" }}>Light Signal Protocol</div>
          {RULES.lights.map((r, i) => <div key={i} style={{ paddingLeft: 12, marginBottom: 4, color: "#555" }}>• {r}</div>)}
          <div style={{ fontWeight: 700, marginTop: 14, marginBottom: 6, color: "#D4A017" }}>Show Structure</div>
          {RULES.structure.map((r, i) => <div key={i} style={{ paddingLeft: 12, marginBottom: 4, color: "#555" }}>• {r}</div>)}
        </Collapsible>
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "grid", gap: 16 }}>
          <div><div className="label">Show Date *</div><input className="input" type="date" value={form.showDate} onChange={e => setForm({ ...form, showDate: e.target.value })} /></div>
          <div><div className="label">Your Name *</div><input className="input" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><div className="label">Email</div><input className="input" type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><div className="label">Phone</div><input className="input" type="tel" placeholder="(555) 555-5555" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div style={{ height: 1, background: "#E8DFC9" }} />
          <div><div className="label">Effect / Bit Name *</div><input className="input" placeholder='e.g. "Ambitious Card" or "Book Test"' value={form.effect} onChange={e => setForm({ ...form, effect: e.target.value })} /></div>
          <div><div className="label">Brief Description</div><textarea className="input" rows={2} placeholder="What will the audience experience?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><div className="label">Effect Type</div><select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{EFFECT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><div className="label">Time Needed</div><select className="input" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}><option value="3">3 min</option><option value="5">5 min</option><option value="7">7 min (default)</option><option value="10">10+ min (needs approval)</option></select></div>
          </div>
          <div><div className="label">Performed this at TMUG before?</div><select className="input" value={form.repeat} onChange={e => setForm({ ...form, repeat: e.target.value })}>{REPEAT_OPTIONS.map(r => <option key={r}>{r}</option>)}</select></div>
          <div><div className="label">Anything else we should know?</div><textarea className="input" rows={2} placeholder="Special setup, props, audience volunteers, etc." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <button className="btn btn-primary" style={{ width: "100%", padding: 12, fontSize: 15, marginTop: 20 }} onClick={handleSubmit}>Submit Sign-Up</button>
      </div>
    </>
  );
}

function FeedbackForm({ data, saveFeedback, showToast }) {
  const [form, setForm] = useState({ name: "", message: "", rating: "" });
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = async () => {
    if (!form.message) { showToast("Please write some feedback", "error"); return; }
    await saveFeedback([...data.feedback, { id: uid(), name: form.name || "Anonymous", message: form.message, rating: form.rating, createdAt: new Date().toISOString() }]);
    setSubmitted(true); showToast("Feedback submitted!");
  };
  if (submitted) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#F0C940" }}>{Icons.check}</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Thanks!</h2>
      <p style={{ color: "#666", fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>Your feedback helps us improve the open mics for everyone.</p>
      <button className="btn btn-primary" onClick={() => { setSubmitted(false); setForm({ name: "", message: "", rating: "" }); }}>Submit More</button>
    </div>
  );
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><span style={{ color: "#D4A017" }}>{Icons.feedback}</span><h3 style={{ fontSize: 16, fontWeight: 800 }}>Anonymous Feedback</h3></div>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.5 }}>This feedback is <strong>anonymous</strong> and goes directly toward making the open mics better. You can leave your name if you want, but you don't have to.</p>
      <div style={{ display: "grid", gap: 14 }}>
        <div><div className="label">Your Name (optional)</div><input className="input" placeholder="Leave blank to stay anonymous" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div>
          <div className="label">How was the show?</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Great", "Good", "Okay", "Needs Work"].map(r => (
              <button key={r} className="btn btn-sm" onClick={() => setForm({ ...form, rating: r })} style={{ background: form.rating === r ? "#1A1A1A" : "#fff", color: form.rating === r ? "#F0C940" : "#666", border: "1px solid #E8DFC9" }}>{r}</button>
            ))}
          </div>
        </div>
        <div><div className="label">Your Feedback *</div><textarea className="input" rows={4} placeholder="What went well? What could be better?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", padding: 12, fontSize: 15, marginTop: 20 }} onClick={handleSubmit}>Submit Feedback</button>
    </div>
  );
}

function AdminLogin({ onAuth, onBack }) {
  const [pw, setPw] = useState(""); const [error, setError] = useState(false);
  return (
    <div style={{ minHeight: "100vh", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card-dark" style={{ maxWidth: 380, width: "100%", padding: 40, textAlign: "center" }}>
        <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#3A3A3E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#D4A017" }}>{Icons.lock}</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#eee", marginBottom: 4 }}>Admin Access</h2>
        <p style={{ color: "#777", fontSize: 13, marginBottom: 24 }}>The Magic Underground</p>
        <input className="input-dark" type="password" placeholder="Enter password" value={pw} onChange={e => { setPw(e.target.value); setError(false); }} onKeyDown={e => { if (e.key === "Enter") { if (pw === ADMIN_PASSWORD) onAuth(); else setError(true); } }} style={{ textAlign: "center", marginBottom: 12 }} />
        {error && <div style={{ color: "#C0392B", fontSize: 12, marginBottom: 12 }}>Wrong password</div>}
        <button className="btn btn-primary" style={{ width: "100%", padding: 10 }} onClick={() => { if (pw === ADMIN_PASSWORD) onAuth(); else setError(true); }}>Enter</button>
        <button className="btn btn-ghost-dark" style={{ marginTop: 12, fontSize: 12, width: "100%" }} onClick={onBack}>Back to sign-up</button>
      </div>
    </div>
  );
}

function AdminDashboard({ data, saveSignups, savePerformers, saveShows, saveFeedback, showToast, adminTab, setAdminTab, sidebarOpen, setSidebarOpen, onLogout }) {
  const tabs = [
    { id: "signups", label: "Sign-Ups", icon: Icons.signup },
    { id: "runsheet", label: "Run Sheet", icon: Icons.run },
    { id: "history", label: "Effect History", icon: Icons.history },
    { id: "crm", label: "Performers", icon: Icons.crm },
    { id: "feedback", label: "Feedback", icon: Icons.feedback },
    { id: "rules", label: "Rules Reference", icon: Icons.rules },
  ];
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#1E1E22" }}>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <div style={{ position: "fixed", left: sidebarOpen ? 0 : -270, top: 0, bottom: 0, width: 260, background: "#161618", zIndex: 50, transition: "left .25s ease", display: "flex", flexDirection: "column", padding: "20px 0", borderRight: "1px solid #2A2A2E" }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid #2A2A2E" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.5, color: "#D4A017" }}>THE MAGIC UNDERGROUND</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#eee", marginTop: 2 }}>Open Mic Manager</div>
        </div>
        <div style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setAdminTab(t.id); setSidebarOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", border: "none", borderRadius: 6, background: adminTab === t.id ? "#2A2A2E" : "transparent", color: adminTab === t.id ? "#F0C940" : "#888", cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 2, transition: "all .15s", textAlign: "left" }}>{t.icon} {t.label}</button>
          ))}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #2A2A2E" }}>
          <button className="btn btn-ghost-dark" style={{ width: "100%", fontSize: 12 }} onClick={onLogout}>Log Out</button>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: "#2A2A2E", borderBottom: "1px solid #3A3A3E", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 30 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", padding: 4 }} onClick={() => setSidebarOpen(!sidebarOpen)}>{Icons.menu}</button>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#eee" }}>{tabs.find(t => t.id === adminTab)?.label}</span>
        </div>
        <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
          {adminTab === "signups" && <SignupsView data={data} saveSignups={saveSignups} showToast={showToast} />}
          {adminTab === "runsheet" && <RunSheetView data={data} saveShows={saveShows} showToast={showToast} />}
          {adminTab === "history" && <HistoryView data={data} />}
          {adminTab === "crm" && <CRMView data={data} savePerformers={savePerformers} showToast={showToast} />}
          {adminTab === "feedback" && <FeedbackView data={data} saveFeedback={saveFeedback} showToast={showToast} />}
          {adminTab === "rules" && <RulesView />}
        </div>
      </div>
    </div>
  );
}

function SignupsView({ data, saveSignups, showToast }) {
  const [filter, setFilter] = useState("all");
  const grouped = {}; data.signups.forEach(s => { const k = s.showDate || "x"; if (!grouped[k]) grouped[k] = []; grouped[k].push(s); });
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
  const updateStatus = async (id, st) => { await saveSignups(data.signups.map(s => s.id === id ? { ...s, status: st } : s)); showToast(`Updated to ${st}`); };
  const del = async (id) => { await saveSignups(data.signups.filter(s => s.id !== id)); showToast("Removed"); };
  const bc = (s) => s === "Confirmed" ? "badge badge-confirmed" : s === "Pending" ? "badge badge-pending" : s === "Waitlist" ? "badge badge-waitlist" : s?.startsWith("Flagged") ? "badge badge-flagged" : "badge badge-declined";

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "Pending", "Confirmed", "Flagged"].map(f => (
          <button key={f} className="btn btn-sm" style={{ background: filter === f ? "#D4A017" : "#2A2A2E", color: filter === f ? "#1A1A1A" : "#999", border: "1px solid #3A3A3E" }} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f} ({f === "all" ? data.signups.length : data.signups.filter(s => f === "Flagged" ? s.status?.startsWith("Flagged") : s.status === f).length})
          </button>
        ))}
      </div>
      {!sortedDates.length && <div className="card-dark" style={{ padding: 40, textAlign: "center", color: "#777" }}>No sign-ups yet.</div>}
      {sortedDates.map(date => {
        let items = grouped[date]; if (filter !== "all") items = items.filter(s => filter === "Flagged" ? s.status?.startsWith("Flagged") : s.status === filter); if (!items.length) return null;
        return (
          <div key={date} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#D4A017", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}><span style={{ background: "#D4A017", width: 8, height: 8, borderRadius: 2 }} />{fmtDate(date + "T12:00:00")} <span style={{ color: "#777", fontWeight: 400 }}>({items.length})</span></div>
            <div style={{ display: "grid", gap: 6 }}>
              {items.map(s => (
                <div key={s.id} className="card-dark" style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#eee" }}>{s.name}</span>
                        <span className={bc(s.status)}>{s.status}</span>
                        <span className="tag-dark">{s.type}</span>
                        <span className="tag-dark">{s.time} min</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3, color: "#ccc" }}>{s.effect}</div>
                      {s.description && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{s.description}</div>}
                      {s.repeat !== "No - new effect" && <div style={{ fontSize: 12, color: "#C0392B", marginTop: 2, fontWeight: 500 }}>{s.repeat}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                      <select className="input-dark" style={{ width: "auto", padding: "4px 8px", fontSize: 11 }} value={s.status} onChange={e => updateStatus(s.id, e.target.value)}>{STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}</select>
                      <button className="btn btn-sm btn-ghost-dark" style={{ color: "#C0392B" }} onClick={() => del(s.id)}>{Icons.trash}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RunSheetView({ data, saveShows, showToast }) {
  const [selectedDate, setSelectedDate] = useState("");
  const dates = [...new Set(data.signups.map(s => s.showDate))].sort((a, b) => new Date(b) - new Date(a));
  useEffect(() => { if (dates.length && !selectedDate) setSelectedDate(dates[0]); }, [dates]);
  const confirmed = data.signups.filter(s => s.showDate === selectedDate && s.status === "Confirmed");
  const show = data.shows.find(s => s.date === selectedDate);
  const [order, setOrder] = useState([]);
  useEffect(() => { setOrder(show?.order || confirmed.map(s => s.id)); }, [selectedDate, data.signups, data.shows]);
  const move = (idx, dir) => { const n = [...order]; const sw = idx + dir; if (sw < 0 || sw >= n.length) return; [n[idx], n[sw]] = [n[sw], n[idx]]; setOrder(n); };
  const saveOrder = async () => {
    const ex = data.shows.find(s => s.date === selectedDate);
    await saveShows(ex ? data.shows.map(s => s.date === selectedDate ? { ...s, order } : s) : [...data.shows, { date: selectedDate, order, createdAt: new Date().toISOString() }]);
    showToast("Saved!");
  };
  const logShow = async () => {
    const ex = data.shows.find(s => s.date === selectedDate);
    await saveShows(ex ? data.shows.map(s => s.date === selectedDate ? { ...s, order, logged: true } : s) : [...data.shows, { date: selectedDate, order, logged: true, createdAt: new Date().toISOString() }]);
    showToast("Show logged!");
  };
  const totalTime = confirmed.reduce((sum, s) => sum + (s.time || 7), 0) + 15;
  const allOrdered = [...order.map(id => confirmed.find(s => s.id === id)).filter(Boolean), ...confirmed.filter(s => !order.includes(s.id))];
  let rt = 19 * 60; const runTimes = allOrdered.map(s => { const st = rt; rt += (s.time || 7); return { start: st, end: rt }; });
  const fmtTime = (m) => { const h = Math.floor(m / 60); const mn = m % 60; return `${h > 12 ? h - 12 : h}:${mn.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select className="input-dark" style={{ width: "auto" }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
          {dates.map(d => <option key={d} value={d}>{fmtDate(d + "T12:00:00")}</option>)}
          {!dates.length && <option value="">No shows</option>}
        </select>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <button className="btn btn-primary btn-sm" onClick={saveOrder}>Save Order</button>
          <button className="btn btn-gold btn-sm" onClick={logShow}>Log Show</button>
        </div>
      </div>
      <div className="card-dark" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div><span className="label-dark">Performers</span><div style={{ fontSize: 20, fontWeight: 800, color: "#eee" }}>{confirmed.length}</div></div>
        <div><span className="label-dark">Total Time</span><div style={{ fontSize: 20, fontWeight: 800, color: "#eee" }}>{totalTime} <span style={{ fontSize: 13, fontWeight: 400, color: "#777" }}>min</span></div></div>
        <div><span className="label-dark">Remaining</span><div style={{ fontSize: 20, fontWeight: 800, color: 120 - totalTime < 0 ? "#C0392B" : "#4A7C59" }}>{120 - totalTime} <span style={{ fontSize: 13, fontWeight: 400, color: "#777" }}>min</span></div></div>
      </div>
      <div style={{ background: "#D4A017", borderRadius: "8px 8px 0 0", padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#1A1A1A", minWidth: 65, fontWeight: 600 }}>7:00 PM</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1A1A1A" }}>HOST — Opening</span>
        <span style={{ fontSize: 12, color: "#333", marginLeft: "auto" }}>5 min</span>
      </div>
      {allOrdered.map((s, i) => (
        <div key={s.id} className="card-dark" style={{ padding: "10px 14px", marginBottom: 1, borderRadius: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: i === 0 ? "#444" : "#888" }} onClick={() => move(order.indexOf(s.id), -1)}>{Icons.up}</button>
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: i === allOrdered.length - 1 ? "#444" : "#888" }} onClick={() => move(order.indexOf(s.id), 1)}>{Icons.down}</button>
          </div>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#D4A017", minWidth: 65 }}>{fmtTime(runTimes[i]?.start + 5)}</span>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#3A3A3E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#D4A017", flexShrink: 0 }}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#eee" }}>{s.name}</div>
            <div style={{ fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.effect} <span className="tag-dark">{s.type}</span></div>
          </div>
          <span style={{ fontSize: 12, color: "#999", fontWeight: 600, flexShrink: 0 }}>{s.time}m</span>
        </div>
      ))}
      {!confirmed.length && <div className="card-dark" style={{ padding: 30, textAlign: "center", color: "#777", borderRadius: 0 }}>No confirmed performers yet.</div>}
      <div style={{ background: "#D4A017", borderRadius: "0 0 8px 8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#1A1A1A", minWidth: 65, fontWeight: 600 }}>{confirmed.length ? fmtTime(runTimes[runTimes.length - 1]?.end + 5) : "—"}</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1A1A1A" }}>HOST — Closing</span>
        <span style={{ fontSize: 12, color: "#333", marginLeft: "auto" }}>5 min</span>
      </div>
    </div>
  );
}

function HistoryView({ data }) {
  const [search, setSearch] = useState("");
  const history = []; data.shows.filter(s => s.logged).forEach(show => { (show.order || []).map(id => data.signups.find(s => s.id === id)).filter(Boolean).forEach(s => { history.push({ date: show.date, name: s.name, effect: s.effect, type: s.type, time: s.time, repeat: s.repeat }); }); });
  const filtered = search ? history.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.effect.toLowerCase().includes(search.toLowerCase())) : history;
  const byP = {}; history.forEach(h => { if (!byP[h.name]) byP[h.name] = []; byP[h.name].push(h); });
  return (
    <div>
      <input className="input-dark" placeholder="Search by performer or effect..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16 }} />
      {!filtered.length && <div className="card-dark" style={{ padding: 40, textAlign: "center", color: "#777" }}>{!history.length ? "No shows logged yet." : "No results."}</div>}
      {!search && Object.entries(byP).map(([name, acts]) => { const eff = {}; acts.forEach(a => { eff[a.effect] = (eff[a.effect] || 0) + 1; }); return Object.entries(eff).filter(([, c]) => c >= 2).map(([effect, count]) => (<div key={name + effect} style={{ background: "#3A3020", border: "1px solid #D4A017", borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13, color: "#F0C940" }}><strong>{name}</strong> has performed <strong>{effect}</strong> {count} times</div>)); })}
      {filtered.length > 0 && <div style={{ display: "grid", gap: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 70px 50px", gap: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: .5 }}><span>Date</span><span>Performer</span><span>Effect</span><span>Type</span><span>Time</span></div>
        {filtered.map((h, i) => (<div key={i} className="card-dark" style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 70px 50px", gap: 8, padding: "10px 14px", alignItems: "center", fontSize: 13 }}><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#D4A017" }}>{fmtDate(h.date + "T12:00:00")}</span><span style={{ fontWeight: 600, color: "#eee" }}>{h.name}</span><span style={{ color: "#aaa" }}>{h.effect}</span><span className="tag-dark">{h.type}</span><span style={{ fontWeight: 600, color: "#eee" }}>{h.time}m</span></div>))}
      </div>}
    </div>
  );
}

function CRMView({ data, savePerformers, showToast }) {
  const [search, setSearch] = useState(""); const [editing, setEditing] = useState(null); const [form, setForm] = useState({}); const [showAdd, setShowAdd] = useState(false); const [np, setNp] = useState({ name: "", email: "", phone: "", notes: "", tags: "" });
  const filtered = data.performers.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));
  const sc = {}; data.signups.filter(s => s.status === "Confirmed").forEach(s => { sc[s.name.toLowerCase()] = (sc[s.name.toLowerCase()] || 0) + 1; });
  const addP = async () => { if (!np.name) { showToast("Name required", "error"); return; } await savePerformers([...data.performers, { id: uid(), ...np, tags: np.tags ? np.tags.split(",").map(t => t.trim()) : [], createdAt: new Date().toISOString() }]); setShowAdd(false); setNp({ name: "", email: "", phone: "", notes: "", tags: "" }); showToast("Added!"); };
  const saveEdit = async () => { await savePerformers(data.performers.map(p => p.id === editing ? { ...p, ...form, tags: typeof form.tags === "string" ? form.tags.split(",").map(t => t.trim()) : form.tags } : p)); setEditing(null); showToast("Updated!"); };
  const delP = async (id) => { await savePerformers(data.performers.filter(p => p.id !== id)); showToast("Removed"); };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input className="input-dark" style={{ flex: 1, minWidth: 180 }} placeholder="Search performers..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>{Icons.plus} Add</button>
      </div>
      {showAdd && <div className="card-dark" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12, color: "#eee" }}>New Performer</div>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><div><div className="label-dark">Name *</div><input className="input-dark" value={np.name} onChange={e => setNp({ ...np, name: e.target.value })} /></div><div><div className="label-dark">Email</div><input className="input-dark" value={np.email} onChange={e => setNp({ ...np, email: e.target.value })} /></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><div><div className="label-dark">Phone</div><input className="input-dark" value={np.phone} onChange={e => setNp({ ...np, phone: e.target.value })} /></div><div><div className="label-dark">Tags</div><input className="input-dark" placeholder="mentalist, regular" value={np.tags} onChange={e => setNp({ ...np, tags: e.target.value })} /></div></div>
          <div><div className="label-dark">Notes</div><textarea className="input-dark" rows={2} value={np.notes} onChange={e => setNp({ ...np, notes: e.target.value })} /></div>
          <div style={{ display: "flex", gap: 8 }}><button className="btn btn-primary btn-sm" onClick={addP}>Save</button><button className="btn btn-ghost-dark btn-sm" onClick={() => setShowAdd(false)}>Cancel</button></div>
        </div>
      </div>}
      <div style={{ fontSize: 12, color: "#777", marginBottom: 8 }}>{filtered.length} performer{filtered.length !== 1 ? "s" : ""}</div>
      <div style={{ display: "grid", gap: 6 }}>
        {filtered.map(p => (
          <div key={p.id} className="card-dark" style={{ padding: "12px 14px" }}>
            {editing === p.id ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}><div><div className="label-dark">Name</div><input className="input-dark" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div><div><div className="label-dark">Email</div><input className="input-dark" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div><div><div className="label-dark">Phone</div><input className="input-dark" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></div></div>
                <div><div className="label-dark">Tags</div><input className="input-dark" value={typeof form.tags === "string" ? form.tags : (form.tags || []).join(", ")} onChange={e => setForm({ ...form, tags: e.target.value })} /></div>
                <div><div className="label-dark">Notes</div><textarea className="input-dark" rows={2} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <div style={{ display: "flex", gap: 8 }}><button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button><button className="btn btn-ghost-dark btn-sm" onClick={() => setEditing(null)}>Cancel</button></div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#eee" }}>{p.name}</span>
                    {sc[p.name.toLowerCase()] && <span className="tag-dark" style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ color: "#D4A017" }}>{Icons.star}</span> {sc[p.name.toLowerCase()]} show{sc[p.name.toLowerCase()] > 1 ? "s" : ""}</span>}
                    {(p.tags || []).map(t => <span key={t} className="tag-dark">{t}</span>)}
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#888", marginTop: 3, flexWrap: "wrap" }}>{p.email && <span>{p.email}</span>}{p.phone && <span>{p.phone}</span>}</div>
                  {p.notes && <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>{p.notes}</div>}
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button className="btn btn-sm btn-ghost-dark" onClick={() => { setEditing(p.id); setForm({ name: p.name, email: p.email, phone: p.phone, notes: p.notes, tags: (p.tags || []).join(", ") }); }}>{Icons.edit}</button>
                  <button className="btn btn-sm btn-ghost-dark" style={{ color: "#C0392B" }} onClick={() => delP(p.id)}>{Icons.trash}</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackView({ data, saveFeedback, showToast }) {
  const sorted = [...data.feedback].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const del = async (id) => { await saveFeedback(data.feedback.filter(f => f.id !== id)); showToast("Deleted"); };
  return (
    <div>
      {!sorted.length && <div className="card-dark" style={{ padding: 40, textAlign: "center", color: "#777" }}>No feedback yet.</div>}
      <div style={{ display: "grid", gap: 8 }}>
        {sorted.map(f => (
          <div key={f.id} className="card-dark" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#eee" }}>{f.name || "Anonymous"}</span>
                  {f.rating && <span className="tag-dark">{f.rating}</span>}
                  <span style={{ fontSize: 11, color: "#666" }}>{fmtDate(f.createdAt)}</span>
                </div>
                <p style={{ fontSize: 14, color: "#ccc", lineHeight: 1.5 }}>{f.message}</p>
              </div>
              <button className="btn btn-sm btn-ghost-dark" style={{ color: "#C0392B", flexShrink: 0 }} onClick={() => del(f.id)}>{Icons.trash}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RulesView() {
  const sections = [
    { title: "Performer Rules", items: RULES.performers, color: "#D4A017" },
    { title: "Organizer Checklist", items: RULES.organizer, color: "#4A7C59" },
    { title: "Light Signal Protocol", items: RULES.lights, color: "#C0392B" },
    { title: "Show Structure", items: RULES.structure, color: "#888" },
  ];
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {sections.map(s => (
        <div key={s.title} className="card-dark" style={{ padding: "16px 18px" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: s.color, marginBottom: 10, textTransform: "uppercase", letterSpacing: .5 }}>{s.title}</div>
          {s.items.map((item, i) => (<div key={i} style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6, paddingLeft: 14, marginBottom: 4, position: "relative" }}><span style={{ position: "absolute", left: 0, color: s.color }}>•</span>{item}</div>))}
        </div>
      ))}
    </div>
  );
}

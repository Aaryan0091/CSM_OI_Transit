import { useState } from "react";

// ── Seed Data ────────────────────────────────────────────────────────────────
const DEPARTMENTS = ["Sales", "Design", "Procurement", "Production", "QC", "Dispatch"];

// Each person logs in with their own username/password.
// dept: "Admin" can view + edit every department. Others can edit only their own dept, view all.
const USERS = [
  { username: "akhil",  password: "admin123", name: "Akhil",         dept: "Admin" },
  { username: "ravi",   password: "sales123", name: "Ravi Sharma",   dept: "Sales" },
  { username: "priya",  password: "design123", name: "Priya Nair",   dept: "Design" },
  { username: "meena",  password: "design123", name: "Meena Joshi",  dept: "Design" },
  { username: "anil",   password: "proc123",  name: "Anil Gupta",    dept: "Procurement" },
  { username: "suresh", password: "prod123",  name: "Suresh Kumar",  dept: "Production" },
  { username: "deepak", password: "qc123",    name: "Deepak Verma",  dept: "QC" },
];

const STATUS_META = {
  "Pending":     { color: "#F59E0B", bg: "#FEF3C7", dot: "#F59E0B" },
  "In Progress": { color: "#3B82F6", bg: "#DBEAFE", dot: "#3B82F6" },
  "On Hold":     { color: "#EF4444", bg: "#FEE2E2", dot: "#EF4444" },
  "Completed":   { color: "#10B981", bg: "#D1FAE5", dot: "#10B981" },
  "Dispatched":  { color: "#8B5CF6", bg: "#EDE9FE", dot: "#8B5CF6" },
};

const INITIAL_ORDERS = [
  {
    id: "ORD-001",
    client: "Indian Railways – NR Zone",
    product: "FRP Equipment Enclosures × 120",
    deadline: "2026-07-15",
    priority: "High",
    overallStatus: "In Progress",
    tasks: [
      { dept: "Sales",       status: "Completed",   assignee: "Ravi Sharma",   remark: "PO received & reviewed", holdReason: "" },
      { dept: "Design",      status: "Completed",   assignee: "Priya Nair",    remark: "Drawings approved by client", holdReason: "" },
      { dept: "Procurement", status: "In Progress", assignee: "Anil Gupta",    remark: "Resin & mat ordered, ETA 3 Jul", holdReason: "" },
      { dept: "Production",  status: "Pending",     assignee: "Suresh Kumar",  remark: "Awaiting raw material", holdReason: "" },
      { dept: "QC",          status: "Pending",     assignee: "Deepak Verma",  remark: "", holdReason: "" },
      { dept: "Dispatch",    status: "Pending",     assignee: "",              remark: "", holdReason: "" },
    ],
    createdAt: "2026-06-01",
  },
  {
    id: "ORD-002",
    client: "DRDO – Pune Lab",
    product: "Defence-grade GRP Panels × 40",
    deadline: "2026-07-10",
    priority: "Critical",
    overallStatus: "On Hold",
    tasks: [
      { dept: "Sales",       status: "Completed",   assignee: "Ravi Sharma",   remark: "Signed NDA & PO", holdReason: "" },
      { dept: "Design",      status: "On Hold",     assignee: "Priya Nair",    remark: "Awaiting spec clarification from DRDO", holdReason: "Client has not responded to spec query sent on 20 Jun" },
      { dept: "Procurement", status: "Pending",     assignee: "Anil Gupta",    remark: "", holdReason: "" },
      { dept: "Production",  status: "Pending",     assignee: "",              remark: "", holdReason: "" },
      { dept: "QC",          status: "Pending",     assignee: "",              remark: "", holdReason: "" },
      { dept: "Dispatch",    status: "Pending",     assignee: "",              remark: "", holdReason: "" },
    ],
    createdAt: "2026-06-10",
  },
  {
    id: "ORD-003",
    client: "NTPC – Faridabad Plant",
    product: "FRP Cable Trays × 500 mtrs",
    deadline: "2026-08-01",
    priority: "Medium",
    overallStatus: "In Progress",
    tasks: [
      { dept: "Sales",       status: "Completed",   assignee: "Ravi Sharma",   remark: "PO confirmed", holdReason: "" },
      { dept: "Design",      status: "Completed",   assignee: "Meena Joshi",   remark: "Standard drawings used", holdReason: "" },
      { dept: "Procurement", status: "Completed",   assignee: "Anil Gupta",    remark: "Material in stock", holdReason: "" },
      { dept: "Production",  status: "In Progress", assignee: "Suresh Kumar",  remark: "150 mtrs moulded, running on schedule", holdReason: "" },
      { dept: "QC",          status: "Pending",     assignee: "Deepak Verma",  remark: "", holdReason: "" },
      { dept: "Dispatch",    status: "Pending",     assignee: "",              remark: "", holdReason: "" },
    ],
    createdAt: "2026-06-15",
  },
  {
    id: "ORD-004",
    client: "BHEL – Haridwar",
    product: "Epoxy Insulator Sets × 80",
    deadline: "2026-07-25",
    priority: "High",
    overallStatus: "In Progress",
    tasks: [
      { dept: "Sales",       status: "Completed",   assignee: "Ravi Sharma",   remark: "PO + advance received", holdReason: "" },
      { dept: "Design",      status: "Completed",   assignee: "Priya Nair",    remark: "Drawings finalised", holdReason: "" },
      { dept: "Procurement", status: "On Hold",     assignee: "Anil Gupta",    remark: "Epoxy resin vendor delay", holdReason: "Vendor Chem-India citing 10-day delivery delay due to freight backlog" },
      { dept: "Production",  status: "Pending",     assignee: "Suresh Kumar",  remark: "", holdReason: "" },
      { dept: "QC",          status: "Pending",     assignee: "Deepak Verma",  remark: "", holdReason: "" },
      { dept: "Dispatch",    status: "Pending",     assignee: "",              remark: "", holdReason: "" },
    ],
    createdAt: "2026-06-20",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const priorityMeta = {
  Critical: { color: "#991B1B", bg: "#FEE2E2" },
  High:     { color: "#B45309", bg: "#FEF3C7" },
  Medium:   { color: "#1D4ED8", bg: "#DBEAFE" },
  Low:      { color: "#374151", bg: "#F3F4F6" },
};

function daysLeft(deadline) {
  const d = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  return d;
}

function progressPct(tasks) {
  const done = tasks.filter(t => t.status === "Completed" || t.status === "Dispatched").length;
  return Math.round((done / tasks.length) * 100);
}

// ── Components ───────────────────────────────────────────────────────────────
function Badge({ label, meta }) {
  return (
    <span style={{
      background: meta.bg, color: meta.color,
      padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
      letterSpacing: "0.03em", whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function StatusDot({ status }) {
  const m = STATUS_META[status] || STATUS_META["Pending"];
  return <span style={{ width: 9, height: 9, borderRadius: "50%", background: m.dot, display: "inline-block", marginRight: 6, flexShrink: 0 }} />;
}

function ProgressBar({ pct }) {
  return (
    <div style={{ background: "#E5E7EB", borderRadius: 4, height: 6, overflow: "hidden", width: "100%" }}>
      <div style={{ width: `${pct}%`, background: pct === 100 ? "#10B981" : "#3B82F6", height: "100%", transition: "width 0.4s" }} />
    </div>
  );
}

function DeptPipeline({ tasks }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {tasks.map((t, i) => {
        const m = STATUS_META[t.status] || STATUS_META["Pending"];
        return (
          <div key={i} style={{
            background: m.bg, color: m.color,
            borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 700,
            border: `1px solid ${m.dot}22`,
          }}>{t.dept}</div>
        );
      })}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = USERS.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
    if (user) { setError(""); onLogin(user); }
    else { setError("Incorrect username or password."); }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#1E3A5F",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', -apple-system, sans-serif", padding: 16,
    }}>
      <form onSubmit={handleSubmit} style={{
        background: "#fff", borderRadius: 16, padding: "36px 32px",
        width: "100%", maxWidth: 360, boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, background: "#F59E0B", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>C</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>CSM Engineers</div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>Order Tracker</div>
          </div>
        </div>

        <Field label="Username">
          <input value={username} onChange={e => setUsername(e.target.value)} autoFocus
            placeholder="e.g. suresh" style={inputStyle} />
        </Field>
        <div style={{ height: 14 }} />
        <Field label="Password">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" style={inputStyle} />
        </Field>

        {error && <div style={{ color: "#DC2626", fontSize: 12, fontWeight: 600, marginTop: 12 }}>{error}</div>}

        <button type="submit" style={{
          width: "100%", marginTop: 20, padding: "11px", borderRadius: 8, border: "none",
          background: "#1E3A5F", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>Sign in</button>

        <div style={{ marginTop: 18, fontSize: 11, color: "#9CA3AF", lineHeight: 1.6 }}>
          Each department has its own login. Everyone can view all orders — only your own department's tasks are editable by you. Admin can edit any department.
        </div>
      </form>
    </div>
  );
}
function Modal({ order, onClose, onSave, currentUser }) {
  const [tasks, setTasks] = useState(JSON.parse(JSON.stringify(order.tasks)));
  const [activeTab, setActiveTab] = useState(0);

  const update = (i, field, val) => {
    const t = [...tasks]; t[i][field] = val; setTasks(t);
  };

  const canEdit = (dept) => currentUser.dept === "Admin" || currentUser.dept === dept;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 740,
        maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>{order.id}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{order.client}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{order.product}</div>
            </div>
            <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18, color: "#6B7280" }}>×</button>
          </div>
          {/* Dept Tabs */}
          <div style={{ display: "flex", gap: 4, marginTop: 16, flexWrap: "wrap" }}>
            {tasks.map((t, i) => {
              return (
                <button key={i} onClick={() => setActiveTab(i)} style={{
                  padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: 12,
                  background: activeTab === i ? "#1E3A5F" : "#F3F4F6",
                  color: activeTab === i ? "#fff" : "#374151",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <StatusDot status={t.status} />{t.dept}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {(() => {
            const t = tasks[activeTab];
            const editable = canEdit(t.dept);
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {!editable && (
                  <div style={{ background: "#F3F4F6", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#6B7280", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    🔒 View only — only {t.dept} or Admin can edit this department's tasks
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Assignee">
                    <input value={t.assignee} onChange={e => update(activeTab, "assignee", e.target.value)}
                      placeholder="Who is working on this?" disabled={!editable}
                      style={{ ...inputStyle, ...(editable ? {} : disabledStyle) }} />
                  </Field>
                  <Field label="Status">
                    <select value={t.status} onChange={e => update(activeTab, "status", e.target.value)} disabled={!editable}
                      style={{ ...inputStyle, ...(editable ? {} : disabledStyle) }}>
                      {Object.keys(STATUS_META).map(s => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Remarks / Progress Update">
                  <textarea value={t.remark} onChange={e => update(activeTab, "remark", e.target.value)}
                    placeholder="What's the current update from this department?" disabled={!editable}
                    rows={3} style={{ ...inputStyle, resize: "vertical", ...(editable ? {} : disabledStyle) }} />
                </Field>
                {t.status === "On Hold" && (
                  <Field label="Hold Reason" accent>
                    <textarea value={t.holdReason} onChange={e => update(activeTab, "holdReason", e.target.value)}
                      placeholder="Why is this on hold? Who/what is blocking progress?" disabled={!editable}
                      rows={3} style={{ ...inputStyle, borderColor: "#FCA5A5", background: editable ? "#FFF5F5" : "#F3F4F6", resize: "vertical", ...(editable ? {} : { color: "#9CA3AF", cursor: "not-allowed" }) }} />
                  </Field>
                )}
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>Logged in as <strong>{currentUser.name}</strong> ({currentUser.dept})</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#374151" }}>Cancel</button>
            <button onClick={() => onSave(order.id, tasks)} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1E3A5F", color: "#fff", cursor: "pointer", fontWeight: 700 }}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, accent }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: accent ? "#DC2626" : "#6B7280", letterSpacing: "0.06em", marginBottom: 6 }}>{label.toUpperCase()}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid #E5E7EB", fontSize: 13, color: "#111827",
  background: "#FAFAFA", outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};

const disabledStyle = {
  background: "#F3F4F6", color: "#9CA3AF", cursor: "not-allowed",
};

function AddOrderModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    client: "", product: "", deadline: "", priority: "Medium",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handle = () => {
    if (!form.client || !form.product || !form.deadline) return;
    const newOrder = {
      id: `ORD-${String(Math.floor(Math.random() * 900) + 100)}`,
      ...form,
      overallStatus: "Pending",
      tasks: DEPARTMENTS.map(dept => ({ dept, status: "Pending", assignee: "", remark: "", holdReason: "" })),
      createdAt: new Date().toISOString().split("T")[0],
    };
    onAdd(newOrder);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 25px 60px rgba(0,0,0,0.25)", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>New Order</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Fill details to add this order to the tracker</div>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Client / Organisation">
            <input value={form.client} onChange={e => set("client", e.target.value)} placeholder="e.g. Indian Railways – NR Zone" style={inputStyle} />
          </Field>
          <Field label="Product / Description">
            <input value={form.product} onChange={e => set("product", e.target.value)} placeholder="e.g. FRP Cable Trays × 200 mtrs" style={inputStyle} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Deadline">
              <input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={e => set("priority", e.target.value)} style={inputStyle}>
                {["Low", "Medium", "High", "Critical"].map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#374151" }}>Cancel</button>
          <button onClick={handle} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1E3A5F", color: "#fff", cursor: "pointer", fontWeight: 700 }}>Add Order</button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  // Derive overall status from tasks
  const deriveStatus = (tasks) => {
    if (tasks.every(t => t.status === "Completed" || t.status === "Dispatched")) return "Completed";
    if (tasks.some(t => t.status === "On Hold")) return "On Hold";
    if (tasks.some(t => t.status === "In Progress")) return "In Progress";
    return "Pending";
  };

  const handleSave = (id, newTasks) => {
    setOrders(prev => prev.map(o => o.id === id
      ? { ...o, tasks: newTasks, overallStatus: deriveStatus(newTasks) }
      : o
    ));
    setSelected(null);
  };

  const handleAdd = (order) => { setOrders(p => [order, ...p]); setAddOpen(false); };

  const filtered = orders.filter(o => {
    const matchStatus = filter === "All" || o.overallStatus === filter;
    const matchSearch = !search || o.client.toLowerCase().includes(search.toLowerCase()) || o.product.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || o.tasks.some(t => t.dept === deptFilter && (t.status === "In Progress" || t.status === "On Hold"));
    return matchStatus && matchSearch && matchDept;
  });

  // Stats
  const stats = {
    total: orders.length,
    inProgress: orders.filter(o => o.overallStatus === "In Progress").length,
    onHold: orders.filter(o => o.overallStatus === "On Hold").length,
    completed: orders.filter(o => o.overallStatus === "Completed").length,
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Top Bar */}
      <div style={{ background: "#1E3A5F", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "#F59E0B", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>C</span>
          </div>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>CSM Engineers</span>
          <span style={{ color: "#94A3B8", fontWeight: 400, fontSize: 13, marginLeft: 4 }}>Order Tracker</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{currentUser.name}</div>
            <div style={{ color: "#94A3B8", fontSize: 10 }}>{currentUser.dept}</div>
          </div>
          <button onClick={() => setAddOpen(true)} style={{
            background: "#F59E0B", color: "#fff", border: "none", borderRadius: 8,
            padding: "7px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>+ New Order</button>
          <button onClick={() => setCurrentUser(null)} style={{
            background: "transparent", color: "#94A3B8", border: "1px solid #334155", borderRadius: 8,
            padding: "7px 12px", fontWeight: 600, fontSize: 12, cursor: "pointer",
          }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Orders", val: stats.total, color: "#1E3A5F" },
            { label: "In Progress", val: stats.inProgress, color: "#3B82F6" },
            { label: "On Hold", val: stats.onHold, color: "#EF4444" },
            { label: "Completed", val: stats.completed, color: "#10B981" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.05em", marginTop: 2 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders, clients..."
            style={{ ...inputStyle, width: 220, background: "#fff" }} />
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["All", "Pending", "In Progress", "On Hold", "Completed"].map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                padding: "7px 14px", borderRadius: 8, border: "1px solid",
                borderColor: filter === s ? "#1E3A5F" : "#E5E7EB",
                background: filter === s ? "#1E3A5F" : "#fff",
                color: filter === s ? "#fff" : "#374151",
                fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}>{s}</button>
            ))}
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ ...inputStyle, width: 160, background: "#fff" }}>
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        {/* Order Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF", fontSize: 14 }}>No orders match your filters.</div>
          )}
          {filtered.map(order => {
            const pct = progressPct(order.tasks);
            const dl = daysLeft(order.deadline);
            const holdTasks = order.tasks.filter(t => t.status === "On Hold");
            const activeTasks = order.tasks.filter(t => t.status === "In Progress");
            const sm = STATUS_META[order.overallStatus] || STATUS_META["Pending"];
            const pm = priorityMeta[order.priority] || priorityMeta["Medium"];

            return (
              <div key={order.id} onClick={() => setSelected(order)}
                style={{
                  background: "#fff", borderRadius: 14, padding: "18px 22px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)", cursor: "pointer",
                  border: "1.5px solid transparent",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  borderLeft: `4px solid ${sm.dot}`,
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.11)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"}
              >
                {/* Row 1: ID + Client + Badges */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, letterSpacing: "0.07em" }}>{order.id}</span>
                      <Badge label={order.priority} meta={pm} />
                      <Badge label={order.overallStatus} meta={{ bg: sm.bg, color: sm.color }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginTop: 4 }}>{order.client}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{order.product}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: dl <= 3 ? "#DC2626" : dl <= 7 ? "#B45309" : "#6B7280", fontWeight: 700 }}>
                      {dl < 0 ? `${Math.abs(dl)}d overdue` : `${dl}d left`}
                    </div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{order.deadline}</div>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>PROGRESS</span>
                    <span style={{ fontSize: 11, color: "#374151", fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <ProgressBar pct={pct} />
                </div>

                {/* Dept Pipeline */}
                <div style={{ marginTop: 12 }}>
                  <DeptPipeline tasks={order.tasks} />
                </div>

                {/* Active / Hold callouts */}
                {(activeTasks.length > 0 || holdTasks.length > 0) && (
                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {activeTasks.map((t, i) => (
                      <div key={i} style={{ background: "#EFF6FF", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#1D4ED8", fontWeight: 600 }}>
                        🔵 {t.dept}: {t.assignee || "Unassigned"}{t.remark ? ` — ${t.remark.slice(0, 45)}${t.remark.length > 45 ? "…" : ""}` : ""}
                      </div>
                    ))}
                    {holdTasks.map((t, i) => (
                      <div key={i} style={{ background: "#FEF2F2", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#DC2626", fontWeight: 600 }}>
                        🔴 {t.dept} on hold{t.holdReason ? `: ${t.holdReason.slice(0, 50)}${t.holdReason.length > 50 ? "…" : ""}` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selected && <Modal order={selected} onClose={() => setSelected(null)} onSave={handleSave} currentUser={currentUser} />}
      {addOpen && <AddOrderModal onClose={() => setAddOpen(false)} onAdd={handleAdd} />}
    </div>
  );
}

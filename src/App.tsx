import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from './lib/firebase'

type Department =
  | 'Sales'
  | 'Design'
  | 'Procurement'
  | 'Production'
  | 'QC'
  | 'Dispatch'

type UserDepartment = Department | 'Admin'
type Status = 'In Progress' | 'On Hold' | 'Completed' | 'Dispatched'
type Priority = 'Low' | 'Medium' | 'High' | 'Critical'
type Company = 'CSM' | 'Oriental'

type User = {
  username: string
  password: string
  name: string
  dept: UserDepartment
}

type Task = {
  dept: Department
  status: Status
  assignee: string
  remark: string
  nextDeptRemark: string
  nextDeptRemarkTarget: Department | ''
  holdReason: string
}

type Order = {
  id: string
  company: Company
  client: string
  product: string
  description: string
  deadline: string
  priority: Priority
  overallStatus: Exclude<Status, 'Dispatched'>
  tasks: Task[]
  createdAt: string
}

type StatusMeta = Record<
  Status,
  {
    color: string
    bg: string
    dot: string
  }
>

type PriorityMeta = Record<
  Priority,
  {
    color: string
    bg: string
  }
>

type ThemeMode = 'light' | 'dark'

const EyeIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block' }}
  >
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeClosedIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block' }}
  >
    <path d="M3 10a9 9 0 0 0 18 0" />
    <path d="M12 19v-4" />
    <path d="m4.93 14 2.83-2.83" />
    <path d="m19.07 14-2.83-2.83" />
  </svg>
)

type Theme = {
  pageBg: string
  surface: string
  surfaceAlt: string
  text: string
  textMuted: string
  textSoft: string
  border: string
  headerBg: string
  headerBorder: string
  primary: string
  primaryText: string
  inputBg: string
  inputText: string
  overlay: string
  shadow: string
  hoverShadow: string
}

const DEPARTMENTS: Department[] = [
  'Sales',
  'Design',
  'Procurement',
  'Production',
  'QC',
  'Dispatch',
]

const USERS: User[] = [
  { username: 'akhil', password: 'admin123', name: 'Akhil', dept: 'Admin' },
  { username: 'ravi', password: 'sales123', name: 'Ravi Sharma', dept: 'Sales' },
  { username: 'priya', password: 'design123', name: 'Priya Nair', dept: 'Design' },
  { username: 'meena', password: 'design123', name: 'Meena Joshi', dept: 'Design' },
  { username: 'anil', password: 'proc123', name: 'Anil Gupta', dept: 'Procurement' },
  { username: 'suresh', password: 'prod123', name: 'Suresh Kumar', dept: 'Production' },
  { username: 'deepak', password: 'qc123', name: 'Deepak Verma', dept: 'QC' },
]

const SESSION_STORAGE_KEY = 'csm-order-tracker-user'

const STATUS_META: StatusMeta = {
  'In Progress': { color: '#3B82F6', bg: '#DBEAFE', dot: '#3B82F6' },
  'On Hold': { color: '#EF4444', bg: '#FEE2E2', dot: '#EF4444' },
  Completed: { color: '#10B981', bg: '#D1FAE5', dot: '#10B981' },
  Dispatched: { color: '#8B5CF6', bg: '#EDE9FE', dot: '#8B5CF6' },
}

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    company: 'CSM',
    client: 'Indian Railways - NR Zone',
    product: 'FRP Equipment Enclosures',
    description: 'x 120',
    deadline: '2026-07-15',
    priority: 'High',
    overallStatus: 'In Progress',
    tasks: [
      { dept: 'Sales', status: 'Completed', assignee: 'Ravi Sharma', remark: 'PO received & reviewed', nextDeptRemark: 'PO is verified. Client requirements are ready for design handoff.', nextDeptRemarkTarget: 'Design', holdReason: '' },
      { dept: 'Design', status: 'Completed', assignee: 'Priya Nair', remark: 'Drawings approved by client', nextDeptRemark: 'Approved drawings shared for material planning.', nextDeptRemarkTarget: 'Procurement', holdReason: '' },
      { dept: 'Procurement', status: 'In Progress', assignee: 'Anil Gupta', remark: 'Resin & mat ordered, ETA 3 Jul', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
      { dept: 'Production', status: 'In Progress', assignee: 'Suresh Kumar', remark: 'Awaiting raw material', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
      { dept: 'QC', status: 'In Progress', assignee: 'Deepak Verma', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
      { dept: 'Dispatch', status: 'In Progress', assignee: '', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
    ],
    createdAt: '2026-06-01',
  },
  {
    id: 'ORD-002',
    company: 'CSM',
    client: 'DRDO - Pune Lab',
    product: 'Defence-grade GRP Panels',
    description: 'x 40',
    deadline: '2026-07-10',
    priority: 'Critical',
    overallStatus: 'On Hold',
    tasks: [
      { dept: 'Sales', status: 'Completed', assignee: 'Ravi Sharma', remark: 'Signed NDA & PO', nextDeptRemark: 'Customer documents cleared, proceed with technical review.', nextDeptRemarkTarget: 'Design', holdReason: '' },
      { dept: 'Design', status: 'On Hold', assignee: 'Priya Nair', remark: 'Awaiting spec clarification from DRDO', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: 'Client has not responded to spec query sent on 20 Jun' },
      { dept: 'Procurement', status: 'In Progress', assignee: 'Anil Gupta', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
      { dept: 'Production', status: 'In Progress', assignee: '', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
      { dept: 'QC', status: 'In Progress', assignee: '', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
      { dept: 'Dispatch', status: 'In Progress', assignee: '', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
    ],
    createdAt: '2026-06-10',
  },
  {
    id: 'ORD-003',
    company: 'Oriental',
    client: 'NTPC - Faridabad Plant',
    product: 'FRP Cable Trays',
    description: 'x 500 mtrs',
    deadline: '2026-08-01',
    priority: 'Medium',
    overallStatus: 'In Progress',
    tasks: [
      { dept: 'Sales', status: 'Completed', assignee: 'Ravi Sharma', remark: 'PO confirmed', nextDeptRemark: 'Commercial clearance done. Standard tray specs confirmed.', nextDeptRemarkTarget: 'Design', holdReason: '' },
      { dept: 'Design', status: 'Completed', assignee: 'Meena Joshi', remark: 'Standard drawings used', nextDeptRemark: 'Use revision D-14 drawings for all fabrication.', nextDeptRemarkTarget: 'Production', holdReason: '' },
      { dept: 'Procurement', status: 'Completed', assignee: 'Anil Gupta', remark: 'Material in stock', nextDeptRemark: 'All raw materials issued and available at shop floor.', nextDeptRemarkTarget: 'Production', holdReason: '' },
      { dept: 'Production', status: 'In Progress', assignee: 'Suresh Kumar', remark: '150 mtrs moulded, running on schedule', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
      { dept: 'QC', status: 'In Progress', assignee: 'Deepak Verma', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
      { dept: 'Dispatch', status: 'In Progress', assignee: '', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
    ],
    createdAt: '2026-06-15',
  },
  {
    id: 'ORD-004',
    company: 'Oriental',
    client: 'BHEL - Haridwar',
    product: 'Epoxy Insulator Sets',
    description: 'x 80',
    deadline: '2026-07-25',
    priority: 'High',
    overallStatus: 'In Progress',
    tasks: [
      { dept: 'Sales', status: 'Completed', assignee: 'Ravi Sharma', remark: 'PO + advance received', nextDeptRemark: 'Advance cleared. Priority handling requested by client.', nextDeptRemarkTarget: 'Design', holdReason: '' },
      { dept: 'Design', status: 'Completed', assignee: 'Priya Nair', remark: 'Drawings finalised', nextDeptRemark: 'Final GA and dimensions locked for procurement.', nextDeptRemarkTarget: 'Procurement', holdReason: '' },
      { dept: 'Procurement', status: 'On Hold', assignee: 'Anil Gupta', remark: 'Epoxy resin vendor delay', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: 'Vendor Chem-India citing 10-day delivery delay due to freight backlog' },
      { dept: 'Production', status: 'In Progress', assignee: 'Suresh Kumar', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
      { dept: 'QC', status: 'In Progress', assignee: 'Deepak Verma', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
      { dept: 'Dispatch', status: 'In Progress', assignee: '', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
    ],
    createdAt: '2026-06-20',
  },
]

const priorityMeta: PriorityMeta = {
  Critical: { color: '#991B1B', bg: '#FEE2E2' },
  High: { color: '#B45309', bg: '#FEF3C7' },
  Medium: { color: '#1D4ED8', bg: '#DBEAFE' },
  Low: { color: '#374151', bg: '#F3F4F6' },
}

const THEMES: Record<ThemeMode, Theme> = {
  light: {
    pageBg: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F4F6',
    text: '#111827',
    textMuted: '#6B7280',
    textSoft: '#94A3B8',
    border: '#E5E7EB',
    headerBg: '#1E3A5F',
    headerBorder: '#334155',
    primary: '#1E3A5F',
    primaryText: '#FFFFFF',
    inputBg: '#FAFAFA',
    inputText: '#111827',
    overlay: 'rgba(0,0,0,0.55)',
    shadow: '0 12px 30px rgba(15, 23, 42, 0.10)',
    hoverShadow: '0 16px 34px rgba(15, 23, 42, 0.16)',
  },
  dark: {
    pageBg: '#06111F',
    surface: '#0F172A',
    surfaceAlt: '#1E293B',
    text: '#E5EEF8',
    textMuted: '#CBD5E1',
    textSoft: '#94A3B8',
    border: '#334155',
    headerBg: '#020817',
    headerBorder: '#475569',
    primary: '#7DD3FC',
    primaryText: '#082F49',
    inputBg: '#0B1220',
    inputText: '#E5EEF8',
    overlay: 'rgba(2,6,23,0.78)',
    shadow: '0 16px 40px rgba(2, 6, 23, 0.35)',
    hoverShadow: '0 18px 42px rgba(2, 6, 23, 0.5)',
  },
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

function themedInputStyle(theme: Theme): CSSProperties {
  return {
    ...inputStyle,
    border: `1px solid ${theme.border}`,
    color: theme.inputText,
    background: theme.inputBg,
  }
}

function themedDisabledStyle(theme: Theme): CSSProperties {
  return {
    background: theme.surfaceAlt,
    color: theme.textSoft,
    cursor: 'not-allowed',
  }
}

function daysLeft(deadline: string) {
  const today = new Date()
  const [year, month, day] = deadline.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function progressPct(tasks: Task[]) {
  const done = tasks.filter((task) => task.status === 'Completed' || task.status === 'Dispatched').length
  return Math.round((done / tasks.length) * 100)
}

function Badge({ label, meta }: { label: string; meta: { bg: string; color: string } }) {
  return (
    <span
      style={{
        background: meta.bg,
        color: meta.color,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

function StatusDot({ status }: { status: Status }) {
  const meta = STATUS_META[status]
  return (
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: meta.dot,
        display: 'inline-block',
        marginRight: 6,
        flexShrink: 0,
      }}
    />
  )
}



function DeptPipeline({ tasks, theme }: { tasks: Task[]; theme: Theme }) {
  const activeIndex = tasks.findIndex((task) => task.status === 'In Progress' || task.status === 'On Hold')
  const completedCount = tasks.filter((task) => task.status === 'Completed' || task.status === 'Dispatched').length
  const progressPercent = tasks.length > 1 ? (completedCount / (tasks.length - 1)) * 100 : 0

  return (
    <div style={{ position: 'relative', padding: '16px 8px 10px 8px', marginTop: 10 }}>
      {/* Background track line */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: 24,
          height: 4,
          background: theme.border,
          borderRadius: 2,
          zIndex: 1,
        }}
      />
      
      {/* Progress completeness line overlapping */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          top: 24,
          height: 4,
          background: '#10B981',
          width: `calc(${progressPercent}% - 4px)`,
          borderRadius: 2,
          zIndex: 1,
          transition: 'width 0.4s ease-out',
        }}
      />

      {/* Nodes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
        {tasks.map((task, index) => {
          const isCompleted = task.status === 'Completed' || task.status === 'Dispatched'
          const isInProgress = task.status === 'In Progress'
          const isOnHold = task.status === 'On Hold'
          const isActive = index === activeIndex || (activeIndex === -1 && index === tasks.length - 1 && isCompleted)
          
          let dotColor = '#E5E7EB'
          let borderColor = theme.border
          let labelColor = theme.textSoft
          let scale = 1
          let pulseClass = false
          
          if (isCompleted) {
            dotColor = '#10B981'
            borderColor = '#10B981'
            labelColor = theme.text
          } else if (isInProgress) {
            dotColor = '#3B82F6'
            borderColor = '#3B82F6'
            labelColor = '#3B82F6'
            scale = 1.15
            pulseClass = true
          } else if (isOnHold) {
            dotColor = '#EF4444'
            borderColor = '#EF4444'
            labelColor = '#EF4444'
            scale = 1.15
            pulseClass = true
          }

          let shortName = ''
          if (task.dept === 'Sales') shortName = 'SL'
          else if (task.dept === 'Design') shortName = 'DS'
          else if (task.dept === 'Procurement') shortName = 'PR'
          else if (task.dept === 'Production') shortName = 'PD'
          else if (task.dept === 'QC') shortName = 'QC'
          else if (task.dept === 'Dispatch') shortName = 'DP'

          return (
            <div
              key={task.dept}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* Active status bubble/label above node */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: -24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    background: isOnHold ? '#EF4444' : isInProgress ? '#3B82F6' : '#10B981',
                    color: '#fff',
                    fontSize: 8,
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 3,
                    animation: pulseClass ? 'bounce-active 1.5s infinite alternate ease-in-out' : 'none',
                  }}
                >
                  {isOnHold ? 'ON HOLD' : isInProgress ? 'CURRENTLY HERE' : 'DISPATCHED'}
                </div>
              )}

              {/* Node dot */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: dotColor,
                  border: `2.5px solid ${isActive ? '#fff' : borderColor}`,
                  boxShadow: isActive ? '0 0 10px rgba(0,0,0,0.15)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 900,
                  color: isCompleted ? '#fff' : isActive ? '#fff' : theme.textSoft,
                  transform: `scale(${scale})`,
                  transition: 'all 0.3s ease',
                  zIndex: 2,
                }}
              >
                {isCompleted ? (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: 'block' }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  shortName
                )}
              </div>

              {/* Node label */}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: isActive ? 800 : 600,
                  color: labelColor,
                  marginTop: 6,
                  letterSpacing: '0.02em',
                }}
              >
                {task.dept}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  accent = false,
  theme,
}: {
  label: string
  children: ReactNode
  accent?: boolean
  theme: Theme
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 700,
          color: accent ? '#DC2626' : theme.textMuted,
          letterSpacing: '0.06em',
          marginBottom: 6,
        }}
      >
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  )
}

function normalizeTask(
  task: Task | (Omit<Task, 'nextDeptRemark' | 'nextDeptRemarkTarget'> & { nextDeptRemark?: string; nextDeptRemarkTarget?: Department | '' }),
): Task {
  return {
    ...task,
    nextDeptRemark: task.nextDeptRemark ?? '',
    nextDeptRemarkTarget: task.nextDeptRemarkTarget ?? '',
  }
}

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    tasks: order.tasks.map(normalizeTask),
  }
}

function loadStoredUser(): User | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawUser = window.localStorage.getItem(SESSION_STORAGE_KEY)

    if (!rawUser) {
      return null
    }

    const parsedUser = JSON.parse(rawUser) as Pick<User, 'username'>
    return USERS.find((entry) => entry.username === parsedUser.username) ?? null
  } catch {
    return null
  }
}

function LoginScreen({
  onLogin,
  themeMode,
  onToggleTheme,
}: {
  onLogin: (user: User) => void
  themeMode: ThemeMode
  onToggleTheme: () => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const theme = THEMES[themeMode]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const user = USERS.find(
      (entry) =>
        entry.username.toLowerCase() === username.trim().toLowerCase() &&
        entry.password === password,
    )

    if (user) {
      setError('')
      onLogin(user)
      return
    }

    setError('Incorrect username or password.')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          themeMode === 'dark'
            ? 'radial-gradient(circle at top, #12324B 0%, #07111F 48%, #020617 100%)'
            : '#1E3A5F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: theme.surface,
          borderRadius: 16,
          padding: '36px 32px',
          width: '100%',
          maxWidth: 360,
          boxShadow: theme.shadow,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: '#a8f5e9',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#1E3A5F', fontWeight: 900, fontSize: 16 }}>C</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: theme.text }}>CSM Engineers</div>
            <div style={{ fontSize: 12, color: theme.textSoft }}>Order Tracker</div>
          </div>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            style={{
              border: `1px solid ${theme.border}`,
              background: theme.surfaceAlt,
              color: theme.textMuted,
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {themeMode === 'dark' ? <EyeClosedIcon size={14} /> : <EyeIcon size={14} />}
          </button>
        </div>

        <Field label="Username" theme={theme}>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoFocus
            placeholder="e.g. suresh"
            style={themedInputStyle(theme)}
          />
        </Field>
        <div style={{ height: 14 }} />
        <Field label="Password" theme={theme}>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="........"
              style={{ ...themedInputStyle(theme), paddingRight: 64 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                color: theme.primary,
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                <circle cx="12" cy="12" r="3" />
                {showPassword && (
                  <path d="M4 20 20 4" />
                )}
              </svg>
            </button>
          </div>
        </Field>

        {error && (
          <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, marginTop: 12 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            marginTop: 20,
            padding: '11px',
            borderRadius: 8,
            border: 'none',
            background: theme.primary,
            color: theme.primaryText,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Sign in
        </button>

        <div style={{ marginTop: 18, fontSize: 11, color: theme.textSoft, lineHeight: 1.6 }}>
          Each department has its own login. HODs can work only inside their own department.
          Admin can edit any department and manage the full tracker.
        </div>
      </form>
    </div>
  )
}

function Modal({
  order,
  onClose,
  onSave,
  currentUser,
  theme,
}: {
  order: Order
  onClose: () => void
  onSave: (id: string, updates: { tasks: Task[]; deadline: string }) => void
  currentUser: User
  theme: Theme
}) {
  const normalizedTasks = order.tasks.map(normalizeTask)
  const editableTaskIndex =
    currentUser.dept === 'Admin'
      ? 0
      : normalizedTasks.findIndex((task) => task.dept === currentUser.dept)
  const initialActiveTab = editableTaskIndex >= 0 ? editableTaskIndex : 0

  const [tasks, setTasks] = useState<Task[]>(structuredClone(normalizedTasks))
  const [deadline, setDeadline] = useState(order.deadline)
  const [isChangingDeadline, setIsChangingDeadline] = useState(false)
  const [activeTab, setActiveTab] = useState(initialActiveTab)

  const update = <K extends keyof Task>(index: number, field: K, value: Task[K]) => {
    setTasks((previous) => {
      const next = [...previous]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const canEdit = (dept: Department) => currentUser.dept === 'Admin' || currentUser.dept === dept
  const adminEditable = currentUser.dept === 'Admin'
  const visibleTasks = adminEditable
    ? tasks.map((task, index) => ({ task, index }))
    : tasks
        .map((task, index) => ({ task, index }))
        .filter(({ task }) => task.dept === currentUser.dept)
  const activeTask = tasks[activeTab]
  const editable = canEdit(activeTask.dept)
  const availableRemarkTargets = DEPARTMENTS.slice(activeTab + 1)
  const previousDeptRemarks = tasks
    .slice(0, activeTab)
    .filter(
      (task) =>
        (task.status === 'Completed' || task.status === 'Dispatched') &&
        task.nextDeptRemark.trim() &&
        (task.nextDeptRemarkTarget === '' || task.nextDeptRemarkTarget === activeTask.dept),
    )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: theme.overlay,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.surface,
          borderRadius: 16,
          width: '100%',
          maxWidth: 740,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: theme.shadow,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: theme.textSoft, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
                {order.id}
              </div>
              <div style={{ fontSize: 11, color: theme.primary, fontWeight: 700, marginBottom: 6 }}>
                {order.company}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>{order.client}</div>
              <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>{order.product}</div>
              {order.description && (
                <div style={{ fontSize: 12, color: theme.textSoft, marginTop: 4 }}>
                  {order.description}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: theme.surfaceAlt,
                border: 'none',
                borderRadius: 8,
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: 18,
                color: theme.textMuted,
              }}
            >
              x
            </button>
          </div>

          <div style={{ display: 'flex', gap: 4, marginTop: 16, flexWrap: 'wrap' }}>
            {visibleTasks.map(({ task, index }) => (
              <button
                key={task.dept}
                onClick={() => setActiveTab(index)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 12,
                  background: activeTab === index ? theme.primary : theme.surfaceAlt,
                  color: activeTab === index ? theme.primaryText : theme.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <StatusDot status={task.status} />
                {task.dept}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!editable && (
              <div
                style={{
                  background: theme.surfaceAlt,
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: theme.textMuted,
                  fontWeight: 600,
                }}
              >
                View only. Only {activeTask.dept} or Admin can edit this department&apos;s tasks.
              </div>
            )}

            {previousDeptRemarks.length > 0 && (
              <div
                style={{
                  background: theme.surfaceAlt,
                  border: '1px solid #a8f5e9',
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: '#0F766E',
                    marginBottom: 10,
                  }}
                >
                  REMARKS FOR THIS DEPARTMENT
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {previousDeptRemarks.map((task) => (
                    <div
                      key={task.dept}
                      style={{
                        background: theme.surface,
                        borderRadius: 10,
                        padding: '10px 12px',
                        borderLeft: '4px solid #0F766E',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>
                        {task.dept} remark for {task.nextDeptRemarkTarget || 'later departments'}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4, lineHeight: 1.5 }}>
                        {task.nextDeptRemark}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              <Field label="Deadline" theme={theme}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div
                    style={{
                      ...themedInputStyle(theme),
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: 38,
                    }}
                  >
                    {deadline}
                  </div>
                  {adminEditable && (
                    <button
                      type="button"
                      onClick={() => setIsChangingDeadline((previous) => !previous)}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${theme.border}`,
                        background: theme.surfaceAlt,
                        color: theme.textMuted,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {isChangingDeadline ? 'Cancel Deadline Change' : 'Change Deadline'}
                    </button>
                  )}
                  {adminEditable && isChangingDeadline && (
                    <input
                      type="date"
                      value={deadline}
                      onChange={(event) => setDeadline(event.target.value)}
                      style={themedInputStyle(theme)}
                    />
                  )}
                </div>
              </Field>
              <Field label="Assignee" theme={theme}>
                <input
                  value={activeTask.assignee}
                  onChange={(event) => update(activeTab, 'assignee', event.target.value)}
                  placeholder="Who is working on this?"
                  disabled={!editable}
                  style={{ ...themedInputStyle(theme), ...(editable ? {} : themedDisabledStyle(theme)) }}
                />
              </Field>
              <Field label="Status" theme={theme}>
                <select
                  value={activeTask.status}
                  onChange={(event) => update(activeTab, 'status', event.target.value as Status)}
                  disabled={!editable}
                  style={{ ...themedInputStyle(theme), ...(editable ? {} : themedDisabledStyle(theme)) }}
                >
                  {Object.keys(STATUS_META).map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Remarks / Progress Update" theme={theme}>
              <textarea
                value={activeTask.remark}
                onChange={(event) => update(activeTab, 'remark', event.target.value)}
                placeholder="What's the current update from this department?"
                disabled={!editable}
                rows={3}
                style={{ ...themedInputStyle(theme), resize: 'vertical', ...(editable ? {} : themedDisabledStyle(theme)) }}
              />
            </Field>

            <Field label="Remark For Next Departments" theme={theme}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <select
                  value={activeTask.nextDeptRemarkTarget}
                  onChange={(event) =>
                    update(activeTab, 'nextDeptRemarkTarget', event.target.value as Department | '')
                  }
                  disabled={!editable}
                  style={{ ...themedInputStyle(theme), ...(editable ? {} : themedDisabledStyle(theme)) }}
                >
                  <option value="">All later departments</option>
                  {availableRemarkTargets.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                <textarea
                  value={activeTask.nextDeptRemark}
                  onChange={(event) => update(activeTab, 'nextDeptRemark', event.target.value)}
                  placeholder="What should the selected department know before they continue?"
                  disabled={!editable}
                  rows={3}
                  style={{
                    ...themedInputStyle(theme),
                    resize: 'vertical',
                    background: editable ? theme.surfaceAlt : theme.surfaceAlt,
                    borderColor: '#a8f5e9',
                    ...(editable ? {} : { color: theme.textSoft, cursor: 'not-allowed' }),
                  }}
                />
              </div>
            </Field>

            {activeTask.status === 'On Hold' && (
              <Field label="Hold Reason" accent theme={theme}>
                <textarea
                  value={activeTask.holdReason}
                  onChange={(event) => update(activeTab, 'holdReason', event.target.value)}
                  placeholder="Why is this on hold? Who or what is blocking progress?"
                  disabled={!editable}
                  rows={3}
                  style={{
                    ...themedInputStyle(theme),
                    borderColor: '#FCA5A5',
                    background: editable ? '#FFF5F5' : theme.surfaceAlt,
                    resize: 'vertical',
                    ...(editable ? {} : { color: theme.textSoft, cursor: 'not-allowed' }),
                  }}
                />
              </Field>
            )}
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 11, color: theme.textSoft }}>
            Logged in as <strong>{currentUser.name}</strong> ({currentUser.dept})
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: theme.surface,
                cursor: 'pointer',
                fontWeight: 600,
                color: theme.textMuted,
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(order.id, { tasks, deadline })}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: theme.primary,
                color: theme.primaryText,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddOrderModal({
  onClose,
  onAdd,
  theme,
}: {
  onClose: () => void
  onAdd: (order: Order) => void
  theme: Theme
}) {
  const [form, setForm] = useState<{
    company: Company
    client: string
    product: string
    description: string
    deadline: string
    priority: Priority
  }>({
    company: 'CSM',
    client: '',
    product: '',
    description: '',
    deadline: '',
    priority: 'Medium',
  })

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const handleAdd = () => {
    if (!form.client || !form.product || !form.deadline) {
      return
    }

    const newOrder: Order = {
      id: `ORD-${String(Math.floor(Math.random() * 900) + 100)}`,
      ...form,
      overallStatus: 'In Progress',
      tasks: DEPARTMENTS.map((dept) => ({
        dept,
        status: 'In Progress',
        assignee: '',
        remark: '',
        nextDeptRemark: '',
        nextDeptRemarkTarget: '',
        holdReason: '',
      })),
      createdAt: new Date().toISOString().split('T')[0],
    }

    onAdd(newOrder)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: theme.overlay,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.surface,
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          boxShadow: theme.shadow,
          overflow: 'hidden',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: theme.text }}>New Order</div>
          <div style={{ fontSize: 12, color: theme.textSoft, marginTop: 2 }}>
            Fill details to add this order to the tracker
          </div>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Company" theme={theme}>
            <select
              value={form.company}
              onChange={(event) => updateField('company', event.target.value as Company)}
              style={themedInputStyle(theme)}
            >
              {(['CSM', 'Oriental'] as const).map((company) => (
                <option key={company}>{company}</option>
              ))}
            </select>
          </Field>
          <Field label="Client / Organisation" theme={theme}>
            <input
              value={form.client}
              onChange={(event) => updateField('client', event.target.value)}
              placeholder="e.g. Indian Railways - NR Zone"
              style={themedInputStyle(theme)}
            />
          </Field>
          <Field label="Product" theme={theme}>
            <input
              value={form.product}
              onChange={(event) => updateField('product', event.target.value)}
              placeholder="e.g. FRP Cable Trays"
              style={themedInputStyle(theme)}
            />
          </Field>
          <Field label="Description" theme={theme}>
            <textarea
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="e.g. x 200 mtrs or extra order details"
              rows={3}
              style={{ ...themedInputStyle(theme), resize: 'vertical' }}
            />
          </Field>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <Field label="Deadline" theme={theme}>
              <input
                type="date"
                value={form.deadline}
                onChange={(event) => updateField('deadline', event.target.value)}
                style={themedInputStyle(theme)}
              />
            </Field>
            <Field label="Priority" theme={theme}>
              <select
                value={form.priority}
                onChange={(event) => updateField('priority', event.target.value as Priority)}
                style={themedInputStyle(theme)}
              >
                {(['Low', 'Medium', 'High', 'Critical'] as const).map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: theme.surface,
              cursor: 'pointer',
              fontWeight: 600,
              color: theme.textMuted,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: theme.primary,
              color: theme.primaryText,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Add Order
          </button>
        </div>
      </div>
    </div>
  )
}

function deriveStatus(tasks: Task[]): Order['overallStatus'] {
  if (tasks.every((task) => task.status === 'Completed' || task.status === 'Dispatched')) {
    return 'Completed'
  }

  if (tasks.some((task) => task.status === 'On Hold')) {
    return 'On Hold'
  }

  if (tasks.some((task) => task.status === 'In Progress')) {
    return 'In Progress'
  }

  return 'In Progress'
}

async function saveOrderToFirestore(order: Order) {
  if (!db) {
    return
  }

  await setDoc(doc(db, 'orders', order.id), order)
}

async function loadOrdersFromFirestore() {
  if (!db) {
    return [...INITIAL_ORDERS].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }

  const snapshot = await getDocs(collection(db, 'orders'))
  const orders = snapshot.docs.map((entry) => normalizeOrder(entry.data() as Order))

  if (orders.length === 0) {
    await Promise.all(INITIAL_ORDERS.map((order) => saveOrderToFirestore(order)))
    return [...INITIAL_ORDERS].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }

  return orders.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadStoredUser())
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [selected, setSelected] = useState<Order | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [filter, setFilter] = useState<'All' | Order['overallStatus']>('All')
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<'All' | Company>('All')
  const [deptFilter, setDeptFilter] = useState<'All' | Department>('All')
  const [isLoadingOrders, setIsLoadingOrders] = useState(isFirebaseConfigured)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')
  const theme = THEMES[themeMode]

  useEffect(() => {
    let cancelled = false

    async function bootstrapOrders() {
      if (!isFirebaseConfigured) {
        setIsLoadingOrders(false)
        return
      }

      try {
        const firestoreOrders = await loadOrdersFromFirestore()

        if (!cancelled) {
          setOrders(firestoreOrders)
          setSyncError(null)
        }
      } catch (error) {
        console.error('Failed to load Firestore orders:', error)

        if (!cancelled) {
          setOrders(INITIAL_ORDERS)
          setSyncError('Could not load Firestore data. Showing local sample orders instead.')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOrders(false)
        }
      }
    }

    bootstrapOrders()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (!currentUser) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ username: currentUser.username }),
    )
  }, [currentUser])

  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={setCurrentUser}
        themeMode={themeMode}
        onToggleTheme={() => setThemeMode((previous) => (previous === 'light' ? 'dark' : 'light'))}
      />
    )
  }

  const handleSave = async (
    id: string,
    updates: { tasks: Task[]; deadline: string },
  ) => {
    let updatedOrder: Order | null = null

    setOrders((previous) =>
      previous.map((order) => {
        if (order.id !== id) {
          return order
        }

        const mergedTasks =
          currentUser.dept === 'Admin'
            ? updates.tasks
            : order.tasks.map((task) => {
                const nextTask = updates.tasks.find((candidate) => candidate.dept === task.dept)

                if (!nextTask || task.dept !== currentUser.dept) {
                  return task
                }

                return nextTask
              })

        updatedOrder = {
          ...order,
          tasks: mergedTasks,
          deadline: currentUser.dept === 'Admin' ? updates.deadline : order.deadline,
          overallStatus: deriveStatus(mergedTasks),
        }
        return updatedOrder
      }),
    )
    setSelected(null)

    if (!updatedOrder || !isFirebaseConfigured) {
      return
    }

    try {
      await saveOrderToFirestore(updatedOrder)
      setSyncError(null)
    } catch (error) {
      console.error('Failed to save Firestore order:', error)
      setSyncError('Order changes were saved locally, but Firestore sync failed.')
    }
  }

  const handleAdd = async (order: Order) => {
    setOrders((previous) => [order, ...previous])
    setAddOpen(false)

    if (!isFirebaseConfigured) {
      return
    }

    try {
      await saveOrderToFirestore(order)
      setSyncError(null)
    } catch (error) {
      console.error('Failed to create Firestore order:', error)
      setSyncError('The new order was added locally, but Firestore sync failed.')
    }
  }

  const filtered = orders.filter((order) => {
    const query = search.toLowerCase()
    const matchStatus = filter === 'All' || order.overallStatus === filter
    const matchCompany = companyFilter === 'All' || order.company === companyFilter
    const matchSearch =
      !search ||
      order.client.toLowerCase().includes(query) ||
      order.product.toLowerCase().includes(query) ||
      order.id.toLowerCase().includes(query)
    const matchDept =
      deptFilter === 'All' ||
      order.tasks.some(
        (task) =>
          task.dept === deptFilter &&
          (task.status === 'In Progress' || task.status === 'On Hold'),
      )

    return matchStatus && matchCompany && matchSearch && matchDept
  })

  const stats = {
    total: orders.length,
    inProgress: orders.filter((order) => order.overallStatus === 'In Progress').length,
    onHold: orders.filter((order) => order.overallStatus === 'On Hold').length,
    completed: orders.filter((order) => order.overallStatus === 'Completed').length,
  }

  return (
    <div
      style={{
        fontFamily: "'Inter', -apple-system, sans-serif",
        background: theme.pageBg,
        color: theme.text,
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          background: theme.headerBg,
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 56,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: '#a8f5e9',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#1E3A5F', fontWeight: 900, fontSize: 13 }}>C</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>CSM Engineers</span>
          <span style={{ color: theme.textSoft, fontWeight: 400, fontSize: 13, marginLeft: 4 }}>
            Order Tracker
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '12px 0' }}>
          <button
            onClick={() => setThemeMode((previous) => (previous === 'light' ? 'dark' : 'light'))}
            style={{
              background: theme.surfaceAlt,
              color: theme.textMuted,
              border: `1px solid ${theme.headerBorder}`,
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {themeMode === 'dark' ? <EyeClosedIcon size={14} /> : <EyeIcon size={14} />}
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{currentUser.name}</div>
            <div style={{ color: theme.textSoft, fontSize: 10 }}>{currentUser.dept}</div>
          </div>
          {currentUser.dept === 'Admin' && (
            <button
              onClick={() => setAddOpen(true)}
              style={{
                background: '#a8f5e9',
                color: '#123850',
                border: 'none',
                borderRadius: 8,
                padding: '7px 16px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              + New Order
            </button>
          )}
          <button
            onClick={() => setCurrentUser(null)}
            style={{
              background: 'transparent',
              color: theme.textSoft,
              border: `1px solid ${theme.headerBorder}`,
              borderRadius: 8,
              padding: '7px 12px',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {isLoadingOrders && (
        <div
          style={{
            background: '#DBEAFE',
            color: '#1D4ED8',
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Loading orders from Firestore...
        </div>
      )}

      {!isLoadingOrders && !isFirebaseConfigured && (
        <div
          style={{
            background: '#FEF3C7',
            color: '#92400E',
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Firestore is not configured yet. The app is using local sample data.
        </div>
      )}

      {syncError && (
        <div
          style={{
            background: '#FEE2E2',
            color: '#B91C1C',
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {syncError}
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { label: 'Total Orders', value: stats.total, color: '#1E3A5F' },
            { label: 'In Progress', value: stats.inProgress, color: '#3B82F6' },
            { label: 'On Hold', value: stats.onHold, color: '#EF4444' },
            { label: 'Completed', value: stats.completed, color: '#10B981' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: theme.surface,
                borderRadius: 12,
                padding: '16px 20px',
                boxShadow: theme.shadow,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 900, color: stat.color }}>{stat.value}</div>
              <div
                style={{
                  fontSize: 11,
                  color: theme.textSoft,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  marginTop: 2,
                }}
              >
                {stat.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search orders, clients..."
            style={{ ...themedInputStyle(theme), width: 220 }}
          />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(['All', 'In Progress', 'On Hold', 'Completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid',
                  borderColor: filter === status ? theme.primary : theme.border,
                  background: filter === status ? theme.primary : theme.surface,
                  color: filter === status ? theme.primaryText : theme.textMuted,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {status}
              </button>
            ))}
          </div>
          <select
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value as 'All' | Company)}
            style={{ ...themedInputStyle(theme), width: 150 }}
          >
            <option value="All">All Factories</option>
            {(['CSM', 'Oriental'] as const).map((company) => (
              <option key={company}>{company}</option>
            ))}
          </select>
          <select
            value={deptFilter}
            onChange={(event) => setDeptFilter(event.target.value as 'All' | Department)}
            style={{ ...themedInputStyle(theme), width: 160 }}
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((department) => (
              <option key={department}>{department}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: theme.textSoft, fontSize: 14 }}>
              No orders match your filters.
            </div>
          )}

          {filtered.map((order) => {
            const pct = progressPct(order.tasks)
            const dl = daysLeft(order.deadline)
            const holdTasks = order.tasks.filter((task) => task.status === 'On Hold')
            const activeTasks = order.tasks.filter((task) => task.status === 'In Progress')
            const statusMeta = STATUS_META[order.overallStatus]
            const priority = priorityMeta[order.priority]

            return (
              <div
                key={order.id}
                onClick={() => setSelected(order)}
                style={{
                  background: theme.surface,
                  borderRadius: 14,
                  padding: '18px 22px',
                  boxShadow: theme.shadow,
                  cursor: 'pointer',
                  border: `1.5px solid ${theme.border}`,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  borderLeft: `4px solid ${statusMeta.dot}`,
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.boxShadow = theme.hoverShadow
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.boxShadow = theme.shadow
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: theme.textSoft, fontWeight: 700, letterSpacing: '0.07em' }}>
                        {order.id}
                      </span>
                      <Badge
                        label={order.company}
                        meta={{ bg: '#E6FFFB', color: '#0F766E' }}
                      />
                      <Badge label={order.priority} meta={priority} />
                      <Badge
                        label={order.overallStatus}
                        meta={{ bg: statusMeta.bg, color: statusMeta.color }}
                      />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: theme.text, marginTop: 4 }}>
                      {order.client}
                    </div>
                    <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{order.product}</div>
                    {order.description && (
                      <div style={{ fontSize: 11, color: theme.textSoft, marginTop: 4 }}>
                        {order.description}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: dl <= 3 ? '#DC2626' : dl <= 7 ? '#B45309' : '#6B7280',
                        fontWeight: 700,
                      }}
                    >
                      {dl < 0 ? `${Math.abs(dl)}d overdue` : `${dl}d left`}
                    </div>
                    <div style={{ fontSize: 10, color: theme.textSoft }}>{order.deadline}</div>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: theme.textSoft, fontWeight: 600 }}>PRODUCTION COMPLETENESS</span>
                    <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <DeptPipeline tasks={order.tasks} theme={theme} />
                </div>

                {(activeTasks.length > 0 || holdTasks.length > 0) && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {activeTasks.map((task) => (
                      <div
                        key={task.dept}
                        style={{
                          background: '#EFF6FF',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11,
                          color: '#1D4ED8',
                          fontWeight: 600,
                        }}
                      >
                        {task.dept}: {task.assignee || 'Unassigned'}
                        {task.remark
                          ? ` - ${task.remark.slice(0, 45)}${task.remark.length > 45 ? '...' : ''}`
                          : ''}
                      </div>
                    ))}
                    {holdTasks.map((task) => (
                      <div
                        key={task.dept}
                        style={{
                          background: '#FEF2F2',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11,
                          color: '#DC2626',
                          fontWeight: 600,
                        }}
                      >
                        {task.dept} on hold
                        {task.holdReason
                          ? `: ${task.holdReason.slice(0, 50)}${task.holdReason.length > 50 ? '...' : ''}`
                          : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {selected && (
        <Modal
          order={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          currentUser={currentUser}
          theme={theme}
        />
      )}
      {addOpen && currentUser.dept === 'Admin' && (
        <AddOrderModal onClose={() => setAddOpen(false)} onAdd={handleAdd} theme={theme} />
      )}
    </div>
  )
}

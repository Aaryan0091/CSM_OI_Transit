export type Department =
  | 'Sales'
  | 'Design'
  | 'Procurement'
  | 'Production'
  | 'QC'
  | 'Dispatch'

export type UserDepartment = Department | 'Admin'
export type Status = 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'Dispatched'
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'
export type Company = 'CSM' | 'Oriental'

export type User = {
  uid: string
  email: string
  emailVerified: boolean
  name: string
  dept: UserDepartment
}

export type Task = {
  dept: Department
  status: Status
  assignee: string
  remark: string
  nextDeptRemark: string
  nextDeptRemarkTarget: Department | ''
  holdReason: string
}

export type Order = {
  id: string
  company: Company
  client: string
  product: string
  description: string
  deadline: string
  priority: Priority
  overallStatus: Exclude<Status, 'Pending' | 'Dispatched'>
  tasks: Task[]
  createdAt: string
  lastActivityId?: string
}

export type OrderActivity = {
  id: string
  actorUid: string
  actorName: string
  actorDept: UserDepartment
  action: 'created' | 'updated'
  summary: string
  createdAt: string
}

export type StatusMeta = Record<
  Status,
  {
    color: string
    bg: string
    dot: string
  }
>

export type PriorityMeta = Record<
  Priority,
  {
    color: string
    bg: string
  }
>

export type ThemeMode = 'light' | 'dark'

export type Theme = {
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

export type AdminRequestStatus = 'pending' | 'approved' | 'rejected'

export type AdminRequest = {
  id: string
  requesterUid: string
  requesterEmail: string
  requesterName: string
  requesterDept: Department
  status: AdminRequestStatus
  createdAt: string
  approvedAt: string | null
  approvedBy: string | null
}

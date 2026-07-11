export type Department =
  | 'Sales'
  | 'Design'
  | 'Procurement'
  | 'Production'
  | 'QC'
  | 'Dispatch'

export type UserDepartment = Department | 'Admin'
export type Status = 'In Progress' | 'On Hold' | 'Completed' | 'Dispatched'
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'
export type Company = 'CSM' | 'Oriental'

export type User = {
  uid: string
  email: string
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
  overallStatus: Exclude<Status, 'Dispatched'>
  tasks: Task[]
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

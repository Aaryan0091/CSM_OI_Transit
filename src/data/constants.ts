import type { CSSProperties } from 'react'
import type {
  Department,
  Order,
  PriorityMeta,
  StatusMeta,
  Theme,
  ThemeMode,
} from '../types'

export const DEPARTMENTS: Department[] = [
  'Sales',
  'Design',
  'Procurement',
  'Production',
  'QC',
  'Dispatch',
]

export const STATUS_META: StatusMeta = {
  'In Progress': { color: '#3B82F6', bg: '#DBEAFE', dot: '#3B82F6' },
  'On Hold': { color: '#EF4444', bg: '#FEE2E2', dot: '#EF4444' },
  Completed: { color: '#10B981', bg: '#D1FAE5', dot: '#10B981' },
  Dispatched: { color: '#8B5CF6', bg: '#EDE9FE', dot: '#8B5CF6' },
}

export const INITIAL_ORDERS: Order[] = [
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

export const PRIORITY_META: PriorityMeta = {
  Critical: { color: '#991B1B', bg: '#FEE2E2' },
  High: { color: '#B45309', bg: '#FEF3C7' },
  Medium: { color: '#1D4ED8', bg: '#DBEAFE' },
  Low: { color: '#374151', bg: '#F3F4F6' },
}

export const THEMES: Record<ThemeMode, Theme> = {
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

export function themedInputStyle(theme: Theme): CSSProperties {
  return {
    ...inputStyle,
    border: `1px solid ${theme.border}`,
    color: theme.inputText,
    background: theme.inputBg,
  }
}

export function themedDisabledStyle(theme: Theme): CSSProperties {
  return {
    background: theme.surfaceAlt,
    color: theme.textSoft,
    cursor: 'not-allowed',
  }
}

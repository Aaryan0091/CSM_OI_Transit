import type { CSSProperties } from 'react'
import type {
  Department,
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

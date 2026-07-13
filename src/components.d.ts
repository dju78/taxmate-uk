// Type declarations for the not-yet-migrated components.jsx design-system
// module. Remove this file when components.jsx becomes components.tsx.
import type { ReactNode, CSSProperties, InputHTMLAttributes } from 'react';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  style?: CSSProperties;
}
export function Button(props: ButtonProps): ReactNode;

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
}
export function Input(props: InputProps): ReactNode;

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error';
  children: ReactNode;
}
export function Badge(props: BadgeProps): ReactNode;

export interface AlertProps {
  variant?: 'warning' | 'success' | 'error';
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}
export function Alert(props: AlertProps): ReactNode;

export interface TableProps {
  columns: string[];
  rows: ReactNode[][];
}
export function Table(props: TableProps): ReactNode;

export interface TransactionListColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
}
export interface TransactionListProps<T> {
  isMobile: boolean;
  columns: TransactionListColumn<T>[];
  rows: T[];
  getKey: (row: T) => string;
}
export function TransactionList<T>(props: TransactionListProps<T>): ReactNode;

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: string;
  actionLabel?: string;
  onAction?: () => void;
}
export function EmptyState(props: EmptyStateProps): ReactNode;

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}
export function Switch(props: SwitchProps): ReactNode;

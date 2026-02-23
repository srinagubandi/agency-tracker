/**
 * Shared UI components — stable replacements for the SSA UI kit complex
 * components that crash with "Cannot convert undefined or null to object".
 * These use the SSA UI kit's color palette and design tokens but are
 * implemented with plain Emotion-styled HTML elements.
 */
import React from 'react';
import styled from '@emotion/styled';

// ─── Color tokens (matching SSA UI kit mainTheme) ───────────────────────────
export const colors = {
  primary: '#2E6DA4',
  primaryLight: '#e8f0f9',
  primaryDark: '#1d4f7c',
  secondary: '#4CAF82',
  danger: '#e53e3e',
  warning: '#d97706',
  text: '#1a1a2e',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  bg: '#f8fafc',
  white: '#ffffff',
};

// ─── Button ─────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isDisabled?: boolean;
  startIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const StyledButton = styled.button<{ variant: string; size: string; disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  border-radius: 8px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  transition: background 0.15s, box-shadow 0.15s;
  border: none;
  outline: none;
  font-size: ${({ size }) => (size === 'sm' ? '12px' : size === 'lg' ? '16px' : '14px')};
  padding: ${({ size }) => (size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '9px 18px')};
  background: ${({ variant }) =>
    variant === 'primary' ? colors.primary :
    variant === 'secondary' ? colors.white :
    variant === 'danger' ? colors.danger :
    'transparent'};
  color: ${({ variant }) =>
    variant === 'primary' ? colors.white :
    variant === 'secondary' ? colors.text :
    variant === 'danger' ? colors.white :
    colors.primary};
  box-shadow: ${({ variant }) =>
    variant === 'secondary' ? `0 0 0 1.5px ${colors.border}` : 'none'};
  &:hover:not(:disabled) {
    background: ${({ variant }) =>
      variant === 'primary' ? colors.primaryDark :
      variant === 'secondary' ? colors.bg :
      variant === 'danger' ? '#c53030' :
      colors.primaryLight};
  }
`;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', isDisabled, startIcon, children, ...rest
}) => (
  <StyledButton variant={variant} size={size} disabled={isDisabled || rest.disabled} {...rest}>
    {startIcon}
    {children}
  </StyledButton>
);

// ─── Icon (text-based fallback using emoji/unicode) ──────────────────────────
const iconMap: Record<string, string> = {
  'plus': '+',
  'edit': '✎',
  'delete': '✕',
  'ban-user': '⊘',
  'eye': '👁',
  'check': '✓',
  'close': '✕',
  'search': '🔍',
  'bell': '🔔',
  'settings': '⚙',
  'user': '👤',
  'users': '👥',
  'logout': '→',
  'dashboard': '⊞',
  'clients': '🏢',
  'time': '⏱',
  'reports': '📊',
  'changelog': '📋',
  'notifications': '🔔',
  'portal': '🌐',
  'copy': '⎘',
  'link': '🔗',
  'arrow-right': '→',
  'arrow-left': '←',
  'chevron-down': '▾',
  'chevron-up': '▴',
  'calendar': '📅',
  'clock': '🕐',
  'campaign': '📣',
  'website': '🌐',
  'account': '📁',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 16, color }) => (
  <span style={{ fontSize: size, lineHeight: 1, color, display: 'inline-flex', alignItems: 'center' }}>
    {iconMap[name] || '•'}
  </span>
);

// ─── Table ───────────────────────────────────────────────────────────────────
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

export const TableHead = styled.thead``;
export const TableBody = styled.tbody``;

export const TableRow = styled.tr`
  border-bottom: 1px solid ${colors.border};
  &:last-child { border-bottom: none; }
  &:hover { background: ${colors.bg}; }
`;

export const TableCellHeader = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: ${colors.textMuted};
  background: ${colors.bg};
  border-bottom: 1px solid ${colors.border};
  white-space: nowrap;
`;

export const TableCell = styled.td`
  padding: 12px 16px;
  color: ${colors.text};
  vertical-align: middle;
`;

// ─── WidgetCard ──────────────────────────────────────────────────────────────
interface WidgetCardProps {
  title?: string;
  value?: string | number;
  icon?: React.ReactNode;
  color?: string;
  children?: React.ReactNode;
}

const WidgetCardWrapper = styled.div`
  background: ${colors.white};
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const WidgetCardTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const WidgetCardValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${colors.text};
  line-height: 1;
`;

const WidgetCardAccent = styled.div<{ color?: string }>`
  height: 3px;
  width: 40px;
  border-radius: 2px;
  background: ${({ color }) => color || colors.primary};
`;

export const WidgetCard: React.FC<WidgetCardProps> = ({ title, value, icon, color, children }) => (
  <WidgetCardWrapper>
    {icon && <div style={{ fontSize: 28 }}>{icon}</div>}
    {title && <WidgetCardTitle>{title}</WidgetCardTitle>}
    {value !== undefined && <WidgetCardValue>{value}</WidgetCardValue>}
    <WidgetCardAccent color={color} />
    {children}
  </WidgetCardWrapper>
);

// ─── Badge ───────────────────────────────────────────────────────────────────
interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  children?: React.ReactNode;
}

const BadgeEl = styled.span<{ variant: string }>`
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  background: ${({ variant }) =>
    variant === 'primary' ? '#dbeafe' :
    variant === 'success' ? '#dcfce7' :
    variant === 'warning' ? '#fef3c7' :
    variant === 'danger' ? '#fee2e2' :
    '#f3f4f6'};
  color: ${({ variant }) =>
    variant === 'primary' ? '#2563eb' :
    variant === 'success' ? '#16a34a' :
    variant === 'warning' ? '#d97706' :
    variant === 'danger' ? '#dc2626' :
    '#6b7280'};
`;

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children }) => (
  <BadgeEl variant={variant}>{children}</BadgeEl>
);

// ─── Typography ──────────────────────────────────────────────────────────────
interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Typography: React.FC<TypographyProps> = ({ variant = 'body', children, style }) => {
  const styles: Record<string, React.CSSProperties> = {
    h1: { fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 },
    h2: { fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 },
    h3: { fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 },
    h4: { fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 },
    body: { fontSize: 14, color: colors.text },
    caption: { fontSize: 12, color: colors.textMuted },
    label: { fontSize: 13, fontWeight: 500, color: colors.text },
  };
  return <span style={{ ...styles[variant], ...style }}>{children}</span>;
};

// ─── Card ────────────────────────────────────────────────────────────────────
export const Card = styled.div`
  background: ${colors.white};
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
`;

// ─── PageHeader ──────────────────────────────────────────────────────────────
export const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

export const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${colors.text};
  margin: 0;
`;

// ─── Modal ───────────────────────────────────────────────────────────────────
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const ModalBox = styled.div`
  background: ${colors.white};
  border-radius: 16px;
  min-width: 440px;
  max-width: 560px;
  width: 100%;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  max-height: 90vh;
  overflow-y: auto;
`;

export const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
  color: ${colors.text};
`;

export const ModalFooter = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
`;

// ─── Form elements ───────────────────────────────────────────────────────────
export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
`;

export const FieldLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
`;

export const StyledInput = styled.input`
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid ${colors.border};
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: ${colors.primary}; }
`;

export const StyledSelect = styled.select`
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid ${colors.border};
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: ${colors.white};
  box-sizing: border-box;
  &:focus { border-color: ${colors.primary}; }
`;

export const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid ${colors.border};
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  resize: vertical;
  min-height: 80px;
  &:focus { border-color: ${colors.primary}; }
`;

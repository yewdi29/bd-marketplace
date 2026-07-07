import { ReactNode, ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'accent' | 'icon' | 'success' | 'muted' | 'warning'

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'rigburrito-btn rigburrito-btn-primary',
  secondary: 'rigburrito-btn rigburrito-btn-secondary',
  danger: 'rigburrito-btn rigburrito-btn-danger',
  accent: 'rigburrito-btn rigburrito-btn-accent',
  icon: 'rigburrito-btn-icon',
  success: 'rigburrito-btn rigburrito-btn-success',
  muted: 'rigburrito-btn rigburrito-btn-muted',
  warning: 'rigburrito-btn rigburrito-btn-warning',
}

export default function AdminButton({
  variant = 'primary',
  children,
  className = '',
  ...props
}: AdminButtonProps) {
  return (
    <button type="button" className={`${VARIANT_CLASS[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}

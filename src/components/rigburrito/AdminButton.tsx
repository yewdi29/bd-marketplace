import { ReactNode, ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'accent' | 'icon'

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

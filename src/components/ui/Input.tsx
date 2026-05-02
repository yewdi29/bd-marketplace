import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-body font-medium text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'bg-surface-elevated border border-surface-border text-white placeholder-gray-600',
            'px-4 py-2.5 text-sm font-body',
            'focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50',
            'transition-colors duration-150',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400 font-body">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input

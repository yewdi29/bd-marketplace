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
          <label htmlFor={id} className="text-sm font-sans font-medium text-ink">
            {label}
            {props.required && <span className="text-orange ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'bg-white border border-[#D4D5D7] text-ink placeholder:text-ink-3',
            'px-4 py-2.5 text-sm font-sans rounded-[10px]',
            'focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20',
            'transition-colors duration-150',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-sans">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input

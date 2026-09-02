'use client'

import PasswordInput from '@/components/auth/PasswordInput'
import {
  getPasswordChecks,
  getPasswordStrength,
  PASSWORD_REQUIREMENT_LABELS,
  PASSWORD_STRENGTH_META,
} from '@/lib/auth/passwordRequirements'

type PasswordStrengthFieldProps = {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  disabled?: boolean
}

export default function PasswordStrengthField({
  id = 'password',
  label = 'Password',
  value,
  onChange,
  placeholder = 'Create a strong password',
  autoComplete = 'new-password',
  required = true,
  disabled = false,
}: PasswordStrengthFieldProps) {
  const checks = getPasswordChecks(value)
  const strength = getPasswordStrength(value)
  const meta = PASSWORD_STRENGTH_META[strength]
  const showHints = value.length > 0

  return (
    <div className="space-y-3">
      <PasswordInput
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={8}
        disabled={disabled}
      />

      {showHints && (
        <>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-sans text-ink-3">Password strength</span>
              <span className={`text-xs font-sans font-semibold ${meta.textClass}`}>{meta.label}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full ${
                    i < meta.segments ? meta.barClass : 'bg-[#E8E9EA]'
                  }`}
                />
              ))}
            </div>
          </div>

          <ul className="space-y-1.5">
            {PASSWORD_REQUIREMENT_LABELS.map(({ key, label: reqLabel }) => {
              const met = checks[key]
              return (
                <li key={key} className="flex items-center gap-2 text-xs font-sans">
                  <span
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      met ? 'bg-green-600 text-white' : 'bg-[#E8E9EA] text-ink-3'
                    }`}
                    aria-hidden
                  >
                    {met ? (
                      <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6.2L4.8 8.5L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <span className="block h-1 w-1 rounded-full bg-current" />
                    )}
                  </span>
                  <span className={met ? 'text-ink-2' : 'text-ink-3'}>{reqLabel}</span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

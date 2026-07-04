import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  full?: boolean
  busy?: boolean
}

const styles: Record<Variant, string> = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-300',
  secondary:
    'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 disabled:text-zinc-400',
  danger: 'bg-red-600 text-white hover:bg-red-500 disabled:bg-red-300',
  ghost: 'text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300',
}

export function Button({
  variant = 'primary',
  full,
  busy,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles[variant]} ${full ? 'w-full' : ''} ${className}`}
      disabled={disabled || busy}
      {...rest}
    >
      {busy ? '…' : children}
    </button>
  )
}

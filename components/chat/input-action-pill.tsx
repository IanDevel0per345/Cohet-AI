import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ActionPillProps {
  icon: ReactNode
  label: string
  onClick: () => void
  className?: string
}

/**
 * Pill de ação inline no input (referência: "Generate a document" / "Translate").
 * Cápsula escura com borda sutil, ícone à esquerda e texto truncado.
 */
export function ActionPill({ icon, label, onClick, className }: ActionPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full',
        'border border-border/60 bg-card px-3 text-sm text-card-foreground',
        'transition-[background-color,box-shadow] duration-150 ease-out',
        'hover:bg-card-foreground/5 hover:shadow-sm',
        'focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring',
        className
      )}
    >
      <span className="size-4 shrink-0 opacity-80">{icon}</span>
      <span className="truncate font-medium">{label}</span>
    </button>
  )
}

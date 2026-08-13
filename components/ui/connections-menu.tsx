'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'

import { IconScoutIcon } from './iconscout-icon'

const connectors = [
  { name: 'Gmail', icon: 'global' as const },
  { name: 'Outlook Mail', icon: 'global' as const },
  { name: 'Google Calendar', icon: 'calendar' as const },
  { name: 'Outlook Calendar', icon: 'calendar' as const },
  { name: 'GitHub', icon: 'global' as const },
]

export function ConnectionsMenu({ onManage }: { onManage?: () => void }) {
  const [open, setOpen] = useState(false)
  const [browserEnabled, setBrowserEnabled] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Open connections"
        aria-expanded={open}
        onMouseDown={event => event.preventDefault()}
        onClick={() => setOpen(value => !value)}
        className={cn(
          'flex size-8 items-center justify-center rounded-full text-foreground/65 transition-colors hover:bg-muted hover:text-foreground',
          open && 'bg-muted text-foreground'
        )}
      >
        <IconScoutIcon name="global" className="size-[18px]" />
      </button>
      {open && (
        <div className="absolute bottom-12 left-0 z-50 w-[360px] overflow-hidden rounded-3xl border border-border/80 bg-card p-3 text-card-foreground shadow-2xl ring-1 ring-foreground/5">
          <div className="space-y-1 rounded-2xl bg-muted/20 p-1">
            {connectors.map(({ name, icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => setOpen(false)}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors hover:bg-muted"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background/70">
                  <IconScoutIcon name={icon} className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
                <span className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-foreground/70 transition-colors hover:bg-background hover:text-foreground">Connect</span>
              </button>
            ))}
          </div>

          <div className="my-2 border-t border-border" />

          <button
            type="button"
            onClick={() => setBrowserEnabled(value => !value)}
            className={cn(
              'flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm transition-colors',
              browserEnabled ? 'bg-emerald-500/10' : 'hover:bg-muted'
            )}
          >
            <IconScoutIcon name="global" className="size-4 shrink-0" />
            <span className="flex-1">My Browser</span>
            <span className={cn('flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors', browserEnabled ? 'justify-end bg-blue-500' : 'justify-start bg-muted-foreground/30')}>
              <span className="size-4 rounded-full bg-white shadow-sm" />
            </span>
          </button>

          <div className="my-2 border-t border-border" />
          <button type="button" onClick={() => setOpen(false)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted">
            <IconScoutIcon name="add" className="size-4" />
            <span className="flex-1">Add connectors</span>
            <span className="text-xs text-muted-foreground">+41</span>
          </button>
          <button type="button" onClick={() => { onManage?.(); setOpen(false) }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted">
            <IconScoutIcon name="manage" className="size-4" />
            <span className="flex-1">Manage connectors</span>
            <IconScoutIcon name="chevron" className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'

import { IconAdjustmentsHorizontal, IconBrandGithub, IconCalendar, IconChevronRight, IconCirclePlus, IconMail, IconWorld } from '@tabler/icons-react'

import { cn } from '@/lib/utils'

const connectors = [
  { name: 'Gmail', icon: IconMail },
  { name: 'Outlook Mail', icon: IconMail },
  { name: 'Google Calendar', icon: IconCalendar },
  { name: 'Outlook Calendar', icon: IconCalendar },
  { name: 'GitHub', icon: IconBrandGithub }
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
        <IconWorld className="size-[17px]" />
      </button>
      {open && (
        <div className="absolute bottom-11 left-0 z-50 w-[300px] overflow-hidden rounded-2xl border border-border bg-card p-2 text-card-foreground shadow-2xl">
          <div className="space-y-1">
            {connectors.map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => setOpen(false)}
                className="flex min-h-10 w-full items-center gap-3 rounded-xl px-2.5 text-left text-sm transition-colors hover:bg-muted"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <span className="shrink-0 text-sm text-muted-foreground">Connect</span>
              </button>
            ))}
          </div>

          <div className="my-2 border-t border-border" />

          <button
            type="button"
            onClick={() => setBrowserEnabled(value => !value)}
            className={cn(
              'flex min-h-10 w-full items-center gap-3 rounded-xl px-2.5 text-left text-sm transition-colors',
              browserEnabled ? 'bg-emerald-500/10' : 'hover:bg-muted'
            )}
          >
            <IconWorld className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1">My Browser</span>
            <span className={cn('flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors', browserEnabled ? 'justify-end bg-blue-500' : 'justify-start bg-muted-foreground/30')}>
              <span className="size-4 rounded-full bg-white shadow-sm" />
            </span>
          </button>

          <div className="my-2 border-t border-border" />
          <button type="button" onClick={() => setOpen(false)} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-2.5 text-left text-sm hover:bg-muted">
            <IconCirclePlus className="size-4 text-muted-foreground" />
            <span className="flex-1">Add connectors</span>
            <span className="text-xs text-muted-foreground">+41</span>
          </button>
          <button type="button" onClick={() => { onManage?.(); setOpen(false) }} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-2.5 text-left text-sm hover:bg-muted">
            <IconAdjustmentsHorizontal className="size-4 text-muted-foreground" />
            <span className="flex-1">Manage connectors</span>
            <IconChevronRight className="size-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  )
}
